## What changed and why

<!-- One or two sentences. Link the task or issue if there is one. -->

## Checklist

- [ ] I tested this locally (the page or feature works)
- [ ] If `schema.prisma` changed, I created a migration (`npx prisma migrate dev --name ...`) and committed it
- [ ] The change is safe to deploy while the old version is still running (no column or table removed or renamed in the same release)
- [ ] I added or updated tests where it made sense
- [ ] No secrets, `.env` files, database dumps or uploads are included
- [ ] New environment variables are added to the `.env.example` files and to `docs/CICD.md` if CI/CD needs them
