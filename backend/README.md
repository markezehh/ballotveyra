# BallotVeyra backend

Backend foundation for the BallotVeyra Next.js application. It provides the private Prisma/PostgreSQL schema, migration, seed, validation, lifecycle rules, invitation helpers, aggregate tally helpers, and domain services.

## Requirements

- Node.js 22+
- Yarn 1.x
- Supabase PostgreSQL or a compatible PostgreSQL database

## Setup

```sh
cd backend
cp .env.example .env
corepack yarn install
DIRECT_URL="<migration-url>" yarn prisma:generate
DIRECT_URL="<migration-url>" yarn prisma:dev
DATABASE_URL="<runtime-url>" yarn seed
```

Generate the Prisma client, migration, and seed with placeholder values when running without a database.

## Database roles

Use a dedicated private `ballotveyra` schema. The migration role owns the schema and migration history. The runtime role receives only the privileges declared in `prisma/migrations/0001_initial/migration.sql`.

Set `schema=ballotveyra` on both `DATABASE_URL` and `DIRECT_URL`. Prisma uses `DATABASE_URL` at runtime and `DIRECT_URL` for migration commands; the datasource also forces runtime queries into `ballotveyra`.

Default Supabase `anon`, `authenticated`, and `PUBLIC` roles must not receive schema access.

## Commands

```sh
yarn prisma:generate
DIRECT_URL="<migration-url>" yarn prisma:migrate
yarn seed
yarn typecheck
yarn test
```

## Migration release

1. Deploy the migration role URL through the release environment.
2. Run `yarn prisma:migrate` before starting the new application revision.
3. Smoke-test `/api/health` and verify role privileges.
4. Roll back the application first if needed; do not reverse a migration unless it has been verified against backups.

## Secret rotation

- `INVITE_HMAC_KEYS`: keep old comma-separated `version:secret` entries until every live invitation is expired or replaced.
- `INVITE_ACTIVE_KEY_VERSION`: advance only after issuing or replacing links with the new active key.
- `VOTER_SESSION_SECRET`: rotate during a voter outage window or require users to reopen invitations.

## Retention

Purge eligible-voter and audit rows only through an approved, transaction-safe operator procedure. Produce and review a dry-run first. Preserve linkage-free `ResultSnapshot` rows when permitted. Retain backups under the same policy and reconcile redemptions against ballots after restoration.

## Privacy

The ballot table has no voter IDs or invitation digests. Individual choices are not exposed by domain responses or audit events. Infrastructure administrators may still have privileged database visibility.
