# CI/CD: automatic checks and deployment

Every change goes through the same path, so nothing reaches the live site untested, and a bad
release can be undone in a minute.

```
 pull request ──► CI: lint · tests · builds · migrations ──► review ──► merge to main
                                                                          │
   ┌──────────────────────────────────────────────────────────────────────┘
   ▼
 Deploy workflow:  CI again ─► build Docker images ─► publish (GHCR) ─► approval ─► server
                                                                                      │
                          roll back automatically if unhealthy ◄── health check ◄────┘
                                                                          │
                                                       live site check ◄──┘
```

| Workflow | When it runs | What it does |
| --- | --- | --- |
| `ci.yml` | Pull requests, pushes to other branches, and as step one of Deploy | Backend: installs, validates the schema, **applies all migrations to an empty PostgreSQL**, checks that `schema.prisma` has no change without a migration, builds. Frontend: lint, tests, build. Also builds both Docker images (nothing is published). |
| `deploy.yml` | Every push to `main` | Runs CI, builds and publishes the two images (tagged `sha-<commit>`), then deploys. |
| `deploy-server.yml` | Called by Deploy and Roll back | Copies the compose files to the server over SSH, runs `ops/deploy/deploy.sh`, then checks the live site and API. |
| `rollback.yml` | You start it by hand | Puts an older release back. |
| `codeql.yml` | Pushes, pull requests, weekly | Security scan of the code. Skips itself on private repositories without GitHub Code Security. |
| `dependabot.yml` | Weekly / monthly | Opens pull requests for outdated dependencies, base images and Actions. They go through CI like any change. |

On the server, `deploy.sh` does the work: **backup, pull the new images, restart, wait for the
backend to be healthy, and if it never is, put the previous version back.**

## One-time setup

### A. The server

Do the preparation from [DEPLOYMENT.md](DEPLOYMENT.md) first (Docker installed, DNS records for
the two domains, ports 80 and 443 open). Then:

```bash
# 1. A dedicated user for deployments, and the folder the app lives in
sudo adduser --disabled-password --gecos "" deploy
sudo usermod -aG docker deploy        # note: access to Docker is effectively root access, so keep this key private
sudo mkdir -p /opt/autohub && sudo chown deploy:deploy /opt/autohub
```

```bash
# 2. On YOUR computer: create a key pair used only for deployments
ssh-keygen -t ed25519 -C "autohub-deploy" -f autohub_deploy -N ""
#    autohub_deploy      = the private key  -> goes into GitHub (step B), then delete it from your computer
#    autohub_deploy.pub  = the public key   -> goes on the server:
ssh root@YOUR_SERVER "sudo -u deploy mkdir -p ~deploy/.ssh && echo '$(cat autohub_deploy.pub)' | sudo -u deploy tee -a ~deploy/.ssh/authorized_keys && sudo chmod 700 ~deploy/.ssh && sudo chmod 600 ~deploy/.ssh/authorized_keys"
```

```bash
# 3. Let the server download the images from GitHub's registry.
#    Create a token at GitHub > Settings > Developer settings > Personal access tokens (classic)
#    with ONLY the "read:packages" permission, then, as the deploy user on the server:
echo "THE_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

```bash
# 4. The server's settings file. Copy .env.example from the repository, fill it in, and add:
#    IMAGE_PREFIX=ghcr.io/your-github-name-in-lowercase/autohub
nano /opt/autohub/.env
```

All **runtime secrets stay in this file on the server** (database password, `JWT_SECRET`, SMTP,
OAuth). They are never put into GitHub.

### B. GitHub

**Settings, Secrets and variables, Actions, Variables** (repository variables; these are public
values that end up in the website's code anyway):

| Variable | Example |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://api.example.com` (must match `API_DOMAIN` on the server) |
| `NEXT_PUBLIC_SITE_URL` | `https://app.example.com` (must match `APP_DOMAIN`) |
| `NEXT_PUBLIC_VERTICAL` | `auto` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | your key (restricted by website address in Google Cloud) |
| `NEXT_PUBLIC_ANALYTICS_PROVIDER` | `ga4`, `plausible`, or empty |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` (GA4 only) |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | `app.example.com` (Plausible only) |
| `CSP_MODE` | `report-only`, later `enforce` |
| `DEPLOY_PATH` | `/opt/autohub` (optional; this is the default) |

**Settings, Environments, New environment, `production`:**

- Add the **secrets** here:

  | Secret | Value |
  | --- | --- |
  | `DEPLOY_HOST` | the server's address |
  | `DEPLOY_USER` | `deploy` |
  | `DEPLOY_SSH_KEY` | the whole contents of the `autohub_deploy` private key file |
  | `DEPLOY_KNOWN_HOSTS` | the output of `ssh-keyscan -t ed25519 YOUR_SERVER` |

  For `DEPLOY_KNOWN_HOSTS`, check the fingerprint against the server first
  (`ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` on the server). This pins the server's
  identity so a deployment can never be redirected to another machine.
- Turn on **Required reviewers** and pick the CEO or the team lead. Every deployment then waits
  for their approval. This is the safety catch: merging does not by itself change the live site.
- Under **Deployment branches**, allow only `main`.

**Settings, Branches, Add rule for `main`:**

- Require a pull request before merging
- Require status checks to pass: select `backend`, `frontend` and `docker`
- Do not allow direct pushes

**Settings, Actions, General:** under *Workflow permissions* keep the default (read-only). The
workflows ask for extra permission only where they need it.

### C. First release

Merge a change to `main` (or re-run the Deploy workflow). On the first run the pipeline builds
the images, copies the compose files to the server and starts everything. The backend creates the
database tables itself. Then create the first admin as described in [DEPLOYMENT.md](DEPLOYMENT.md).

## Day to day

1. Work on a branch, open a pull request. CI runs automatically; fix anything red.
2. Get it reviewed and merge.
3. The Deploy workflow starts. When it reaches the approval step, the reviewer approves it in the
   Actions tab (GitHub also emails them).
4. The run ends with "The site and the API both answered." A red cross means something is
   wrong; open the failed step, it says what.

Each run's summary shows the release tag, such as `sha-1a2b3c4`.

### Rolling back

If a release is bad (even when the checks passed):

1. **Actions, Roll back, Run workflow.**
2. Enter the tag of the last release that worked (from an earlier Deploy run's summary, or the
   repository's **Packages** page).
3. Approve it. The old images are put back within a minute or two.

If the site is down because the backup itself is failing, tick **skip_backup**. Use it only in
an emergency.

A release that starts but does not become healthy is rolled back **automatically** by
`deploy.sh`, and the Deploy run is marked failed.

## Database migrations: the rule that keeps deployments safe

The backend applies migrations itself when it starts. Rolling back restores the old **code**, not
the database, so a release must be safe to run **while the previous version is still around**:

- Adding a table or a column is fine. New columns should be optional or have a default.
- **Never remove or rename a column or table in the same release** that stops using it. Do it in
  two releases: first stop using it and deploy, then drop it in the next.
- If a migration itself fails, the backend will not start, the health check fails and the old
  version is put back. The database is restored from the pre-deploy backup only if a migration
  half-applied; see `ops/backup/restore.sh`.

CI helps here. It applies every migration to an empty database, and it fails if `schema.prisma`
was edited without a migration (`npx prisma migrate dev --name what_changed` creates one).
The first CI run may point out existing drift in the repository; fix it once by creating the
missing migration.

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| Build step: "Repository variable NEXT_PUBLIC_API_URL is not set" | Add the variable (section B). |
| Deploy step: "Secret DEPLOY_... is not set" | Add it under Environments, `production`, not under repository secrets. |
| `Host key verification failed` | `DEPLOY_KNOWN_HOSTS` is missing, wrong or the server was rebuilt. Create it again with `ssh-keyscan`. |
| `Permission denied (publickey)` | The public key is not in `~deploy/.ssh/authorized_keys`, or `DEPLOY_SSH_KEY` is not the whole private key. |
| "could not pull the images" | The server is not logged in to `ghcr.io`, the token expired, or `IMAGE_PREFIX` is wrong (it must be lowercase). |
| "did not become healthy" | Read the backend log lines printed in the step. Common causes: a bad `.env` value, a failing migration, an unreachable database. The old version is put back automatically. |
| CI: "schema.prisma matches the migrations" fails | Run `npx prisma migrate dev --name describe_the_change` locally and commit the new migration folder. |
| CI: migrations fail on an empty database | A migration depends on data or objects that only exist in your own database. Fix the migration so it works from scratch. |
| Site loads but analytics or maps are missing | The `NEXT_PUBLIC_*` variables are baked in at build time. Change the repository variable and merge any change (or re-run Deploy) to rebuild. |
| Deploy waits forever | It is waiting for approval: open the run and click **Review deployments**. |

## What this does not do (yet)

- **Brief interruption.** The containers are replaced one by one, so the site can be unavailable
  for a few seconds during a release. True zero-downtime releases need two copies running behind
  a load balancer.
- **One environment.** There is no staging site. A staging copy (same pipeline, second server and
  environment) is the natural next step before a high-traffic launch.
- **No automatic database rollback.** See the migrations section above.
- **No automated end-to-end tests.** CI proves the code builds and the unit tests pass. Adding
  Playwright tests for sign-up, login and booking would catch more.
- **Vulnerability audits are informational.** `npm audit` reports in the CI log but does not
  block a release. Remove `continue-on-error` in `ci.yml` when you want it to.
- **Action versions.** The workflows use the current major version of each action; Dependabot
  proposes updates.
