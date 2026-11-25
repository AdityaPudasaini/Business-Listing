# Changelog

All notable changes to AutoHub are listed here. The version number is in the `VERSION` file.
The same list, for customers, is in the guide: `documentation/index.html`.

## 1.0.0

First release.

### Added

- Business listings with search and filters, listing pages, reviews and ratings, bookings and enquiries.
- Owner dashboard, visitor chat on each listing (with optional AI answers and owner takeover) and an admin panel with an audit log.
- One-command installer (`install.sh`) and a browser-based first-run setup at `/install`.
- Guided email setup (`setup-smtp.sh`).
- Updater (`update.sh`): full replace that keeps `.env`, `backups/` and `install-credentials.txt`, with steps to go back if an update fails.
- Backup and restore scripts, including a `verify` mode, and a daily backup at 02:00 scheduled by the installer (`--no-backup` turns it off).
- `create-admin.sh` to create an admin account or reset a forgotten password.
- Nine starter categories, created when the first admin account is set up.
- Docker log size limits (3 files of 10 MB per service) so logs cannot fill the server disk.
- Customer guide in `documentation/index.html`.
