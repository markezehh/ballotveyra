# BallotVeyra Product Requirements Document

**Version 1.0 · Full-stack build specification**  
**Product** · Private online elections for schools, associations, clubs, and organizations  
**Stack** · Next.js App Router, TypeScript, Tailwind CSS, Prisma, Supabase Postgres and Auth, Render

## 1. Build directive

Build a working, deployable application from this specification. Every production form, dashboard, and export must read or write real data. Supply the source repository, database migrations, environment template, safe local seed, automated tests, and deployment README. Use one Next.js Node web service for the frontend and backend. If the builder only supports static previews, generate the full source for deployment on Render.

BallotVeyra lets an organizer create a private election, import eligible voters, distribute individual links, collect one ballot per voter, and publish aggregate results. The initial release supports one contest per election and one choice per ballot. A complete election must work without an email provider through downloadable invitation batches. The application has no billing in v1.

**Success criteria**

- An organizer can complete the full setup-to-results flow from the browser.
- Every accepted ballot corresponds to exactly one successful eligibility redemption.
- Voters can cast a ballot on a narrow mobile screen without creating an account.
- An election can have 200,000 eligible voters and accept up to 200,000 ballots, subject to capacity testing on the chosen deployment.
- Organizers can download results, monitor turnout, and review changes without accessing individual choices.

**Later releases** · Ranked choice, multiple contests, bulk email automation, enterprise SSO, public open polls, and independently verifiable voting protocols. Scope v1 to organizational elections.

## 2. Roles and permissions

| Role | Permissions |
|---|---|
| Workspace owner | Manage workspace members, create and manage elections, download invitations, publish results, export records. |
| Election manager | Manage elections, voter imports and invitations in the assigned workspace, publish results and export records. |
| Observer | View configured elections, aggregate turnout, and published results in the assigned workspace. |
| Voter | Use a single election invitation to view and submit their ballot. |
| Public visitor | View marketing pages and results explicitly published publicly. |

Use Supabase Auth for organizer accounts, email verification, sign-in, and password reset. Use verified server-side identity and database membership on every privileged read and mutation. A verified user can create a workspace and becomes its owner. Owners add verified accounts by exact normalized email, matched server-side against profiles, and can change or revoke member roles. Prevent removal of the last owner with a transactional check. Scope all administrative queries by workspace. Voters use invitation credentials without Supabase Auth accounts.

## 3. User experience and navigation

| Route | Required content and actions |
|---|---|
| / | BallotVeyra homepage, explanation of the election flow, sign-in and create-election calls to action. |
| /login, /register, /forgot-password, /reset-password | Organizer account flows, verification and reset feedback. |
| /dashboard | Workspace selector, election list, status filters, create button, upcoming elections and turnout summary. |
| /workspaces/[slug]/members | Owner-only membership management. |
| /dashboard/elections/[id] | Setup checklist and tabs for Overview, Ballot, Voters, Results, and Activity. |
| /vote/[slug] | Invitation check, election details, accessible ballot, review, submission and confirmation. |
| /results/[slug] | Published totals, winner or tie, turnout, and closing time if access permits. |
| /privacy, /terms, /help | Product policy pages with operator-supplied contact details and a voter troubleshooting guide. |

Use a deep navy, white, and teal palette with visible focus rings and accessible contrast. Keep voter pages single-column with generous tap targets, clear radio choices, and a review screen. Support keyboard operation, semantic forms, error summaries, accessible status messages, and 320 px layouts. Test low-bandwidth mobile use. Dashboard tables need pagination and empty, loading, error, and success states. Use actual data in production and label demo seeds in local development. Show election times in its configured IANA timezone, defaulting to Africa/Lagos, with UTC storage and an explicit timezone label.

## 4. Election lifecycle and rules

1. **Draft** · Set title, description, 2–50 options, display order, time zone, opening and closing times. Require closing after opening. Preview the ballot and import voters.
2. **Scheduled** · Publish the ballot configuration after validation. Lock options, schedule, and the eligible roster. Allow replacement invitations for unredeemed voters. Display opening time to eligible voters.
3. **Open** · Derive from the authoritative database clock and the stored schedule. Accept votes during the half-open interval from opening inclusive to closing exclusive. Show turnout to authorized organizers.
4. **Closed** · Derive when the closing time arrives. Stop submissions and allow publication. Authorized owners or managers can also close an open election immediately after confirmation and with an audit reason. Reopening is unavailable.
5. **Published** · Create one immutable aggregate snapshot. Choose workspace-only or public visibility at publication, defaulting to workspace-only. Public access must be explicit and audited.
6. **Cancelled** · Allow cancellation of scheduled or open elections with confirmation and a reason. Reject new votes, preserve existing records, and disable results publication. Drafts may be deleted with confirmation.

Store DRAFT, SCHEDULED, CLOSED, PUBLISHED and CANCELLED as lifecycle values. Resolve Scheduled, Open and naturally Closed from the SCHEDULED value plus the database clock. Use the same derived state in every UI and API. No scheduler is required for opening or closing. Activation requires a nonempty voter roll and a valid ballot. Guests cannot discover private elections through a public directory.

Count valid ballots by option. The highest nonzero count wins. Report all joint leaders on a tie and show “No votes cast” for zero ballots. Include zero-vote options. Turnout is accepted ballots divided by the frozen eligible count. Calculate displayed percentages from counts and round only for presentation. No write-ins, blank ballots, vote editing, or manual vote adjustments in v1.

## 5. Voter import and invitation delivery

- Import voters by required phone number and optional display_name. Preserve the entered phone text after trimming outer whitespace and require unique numbers per election. Reject duplicate numbers within a file or across the roster. Enforce string lengths, safe CSV handling, 200,000 total voters per election, and bounded upload bodies.
- Import in the browser in batches of up to 1,000 rows. Show a preview and present each batch's accepted count and row errors. Each batch uses a client-generated idempotency key and a canonical payload digest. Persist its result with its inserts in one transaction. The same key and payload returns the prior result. Changed payload under the same key returns 409. Exclude concurrent draft edits and activation using an election row lock for each batch. Let the organizer correct and retry failed rows. Use cursor pagination for roster reads.
- After activation, issue links in explicitly requested batches of up to 1,000 selected voters. Generate 32 CSPRNG bytes per token and encode using base64url. Store only a keyed HMAC digest and key version. Keep keys server-side. Deliver raw URLs once as a no-store CSV attachment under an authorized session. Files include phone and invite_url. Escape spreadsheet formulas in user-supplied CSV fields.
- A new link replaces the prior link for an unredeemed voter. A download failure may be recovered by explicitly reissuing links. Never disclose tokens again from storage. Audit batch counts and replacements without logging credentials. Enforce a per-voter row lock so redemption and replacement cannot both succeed with the old credential.
- Generate links as /vote/[slug]#token=TOKEN to keep credentials out of request URLs. The client reads the fragment, removes it from history, and submits the token in the body to the same-origin session endpoint. That endpoint validates the token and establishes a short-lived, signed, Secure, HttpOnly, SameSite cookie bound to the election and current digest. Keep the invitation valid through the election window and permit re-entry from the original link until redeemed or replaced. Link checks and previews never redeem eligibility.
- Manual invitation distribution is the default. The organizer must distribute each link privately. Treat a link as a bearer credential. Forwarding can transfer the ability to vote.

## 6. Ballot submission and privacy

**Voter flow** · Open the invite → see the election and available options → select one option → review → submit → receive a generic confirmation. Provide clear messages for early, closed, cancelled, invalid, already used, and temporary error states. Handle low connectivity and accidental double taps.

**Atomic submission contract**

1. Authenticate the voter cookie and validate the request. Ignore any client-provided ownership, status, or timestamps.
2. Begin a short PostgreSQL transaction. Acquire a shared lock on the election row and then lock the voter row. Administrative lifecycle operations acquire an exclusive election lock first. Maintain this order across code paths.
3. Match the current digest and key version to the credential. If already redeemed, return the generic “A ballot has already been recorded for this invitation” state without any choice information. Reject invalidated or replaced credentials.
4. Under the locks, recheck the window using the database wall clock, eligibility, and option membership. For a successful request, redeem the credential and insert one ballot in the same transaction. An error rolls back both. Enforce a tight transaction timeout. Retry transient failures with bounds and backoff, using the same session.
5. Return success after commit. If the response was lost, a repeat request with the same redeemed credential returns the already-recorded state. Never return a ballot identifier or a choice as proof of voting.

Keep the ballot table free of voter IDs, invite digests, receipts, individual timestamps, request IDs, and IPs. Use random UUIDs for ballots. Avoid row-level ballot activity logs, analytics, tracking pixels, and request-body logging. Expose only aggregate results and turnout. This design offers ballot separation at the application level. Infrastructure administrators with privileged visibility could potentially correlate database activity, and small groups may infer choices from aggregate results. Describe this privacy model accurately in product copy.

## 7. Prisma schema

Create prisma/schema.prisma using the schema below. Select a supported Prisma version, pin the CLI and client to the same version, and follow that version's generator and connection configuration. This example uses the Prisma 7-style generator and prisma.config.ts for the migration URL. Instantiate Prisma Client with the PostgreSQL adapter and a bounded pool using DATABASE_URL in the Node runtime. All timestamps use timestamptz.

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum WorkspaceRole {
  OWNER
  MANAGER
  OBSERVER
}

enum ElectionStatus {
  DRAFT
  SCHEDULED
  CLOSED
  PUBLISHED
  CANCELLED
}

enum ResultVisibility {
  WORKSPACE
  PUBLIC
}

model OrganizerProfile {
  id          String             @id @db.Uuid
  email       String             @unique @db.VarChar(254)
  memberships WorkspaceMember[]
}

model Workspace {
  id        String            @id @default(uuid()) @db.Uuid
  slug      String            @unique @db.VarChar(80)
  name      String            @db.VarChar(120)
  createdAt DateTime          @default(now()) @db.Timestamptz(3)
  members   WorkspaceMember[]
  elections Election[]
  events    AuditEvent[]
}

model WorkspaceMember {
  workspaceId String           @db.Uuid
  organizerId String           @db.Uuid
  role        WorkspaceRole
  workspace   Workspace        @relation(fields: [workspaceId], references: [id], onDelete: Restrict)
  organizer   OrganizerProfile @relation(fields: [organizerId], references: [id], onDelete: Restrict)

  @@id([workspaceId, organizerId])
  @@index([organizerId])
}

model Election {
  id            String          @id @default(uuid()) @db.Uuid
  workspaceId   String          @db.Uuid
  slug          String          @unique @db.VarChar(80)
  title         String          @db.VarChar(160)
  description   String?
  status        ElectionStatus  @default(DRAFT)
  timeZone      String          @default("Africa/Lagos") @db.VarChar(64)
  opensAt       DateTime?       @db.Timestamptz(3)
  closesAt      DateTime?       @db.Timestamptz(3)
  endedEarlyAt  DateTime?       @db.Timestamptz(3)
  eligibleCount Int?
  createdAt     DateTime        @default(now()) @db.Timestamptz(3)
  updatedAt     DateTime        @updatedAt @db.Timestamptz(3)
  workspace     Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Restrict)
  options       BallotOption[]
  voters        EligibleVoter[]
  imports       ImportBatch[]
  result        ResultSnapshot?
  events        AuditEvent[]

  @@index([workspaceId, createdAt, id])
}

model BallotOption {
  id          String   @id @default(uuid()) @db.Uuid
  electionId  String   @db.Uuid
  label       String   @db.VarChar(120)
  description String?
  position    Int
  election    Election @relation(fields: [electionId], references: [id], onDelete: Restrict)
  ballots     Ballot[]

  @@unique([electionId, id])
  @@unique([electionId, position])
}

model EligibleVoter {
  id          String   @id @default(uuid()) @db.Uuid
  electionId  String   @db.Uuid
  voterKey    String   @db.VarChar(120)
  phone       String?  @db.VarChar(16)
  displayName String?  @db.VarChar(120)
  tokenDigest String?  @unique @db.VarChar(64)
  keyVersion  Int?
  redeemed    Boolean  @default(false)
  election    Election @relation(fields: [electionId], references: [id], onDelete: Restrict)

  @@unique([electionId, voterKey])
  @@unique([electionId, phone])
  @@index([electionId, id])
}

model Ballot {
  id         String       @id @default(uuid()) @db.Uuid
  electionId String       @db.Uuid
  optionId   String       @db.Uuid
  option     BallotOption @relation(fields: [electionId, optionId], references: [electionId, id], onDelete: Restrict)

  @@index([electionId, optionId])
}

model ImportBatch {
  electionId String   @db.Uuid
  batchKey   String   @db.Uuid
  digest     String   @db.VarChar(64)
  summary    Json
  createdAt  DateTime @default(now()) @db.Timestamptz(3)
  election   Election @relation(fields: [electionId], references: [id], onDelete: Restrict)

  @@id([electionId, batchKey])
}

model ResultSnapshot {
  electionId  String           @id @db.Uuid
  visibility  ResultVisibility @default(WORKSPACE)
  tally       Json
  publishedAt DateTime         @default(now()) @db.Timestamptz(3)
  publishedBy String           @db.Uuid
  election    Election         @relation(fields: [electionId], references: [id], onDelete: Restrict)
}

model AuditEvent {
  id          String     @id @default(uuid()) @db.Uuid
  workspaceId String     @db.Uuid
  electionId  String?    @db.Uuid
  actorId     String     @db.Uuid
  action      String     @db.VarChar(60)
  metadata    Json?
  createdAt   DateTime   @default(now()) @db.Timestamptz(3)
  workspace   Workspace  @relation(fields: [workspaceId], references: [id], onDelete: Restrict)
  election    Election?  @relation(fields: [electionId], references: [id], onDelete: Restrict)

  @@index([workspaceId, createdAt, id])
  @@index([electionId, createdAt, id])
}
```

### Migration and data-access requirements

- Use an application-owned private schema and dedicated database roles. Scope Prisma and its migration history to the intended schema for the pinned Prisma version. Keep it outside exposed Supabase API schemas. Revoke access for public, anon and authenticated roles. Supabase Auth remains managed by Supabase. OrganizerProfile.id mirrors the verified Auth user ID. Sync email from verified identity and never trust a submitted email as identity.
- Separate migration credentials from the runtime role. Grant the runtime role only required privileges. Ballots are insert/select only and result snapshots insert/select only. Audit events are append-only. For draft-stage events, store the draft ID in metadata and leave the optional election foreign key empty. Explicitly handle draft deletion of child rows in one transaction while preserving workspace audit history using an audit entry without a foreign key to the deleted election.
- Add SQL checks for opensAt < closesAt when both exist, nonnegative positions and eligible counts, and valid pairs of token digest and key version. Guard draft-only settings, allowed transitions, and scoped writes in the service layer. Use parameterized SQL in Prisma transactions for locks and aggregation.
- Retain eligibility and audit records through the organizer's configured retention period. Provide a documented operator-run, transaction-safe retention procedure with a dry run. Keep linkage-free aggregates when roster identifiers are purged. Remove invitation digests when retention and support requirements allow. Keep backups within the same retention policy.

## 8. Backend interfaces

Use Next.js Route Handlers for these same-origin APIs. Group business logic by election, membership, roster, voting, and results. Use a shared validation module for input and a shared authorization module. Use stable JSON error codes with a safe message, optional field errors, and a request ID for administrative requests. Apply no-store to private responses. Sensitive mutations require CSRF protection using verified origin and authenticated sessions.

| API | Contract |
|---|---|
| POST /api/workspaces | Create workspace and initial owner atomically. |
| GET, POST /api/workspaces/[slug]/members | List or add verified members. |
| PATCH, DELETE /api/workspaces/[slug]/members/[id] | Edit role or revoke membership. |
| GET, POST /api/elections | List scoped elections or create a draft. |
| GET, PATCH, DELETE /api/elections/[id] | Retrieve scoped overview, edit draft or remove draft. |
| PUT /api/elections/[id]/options | Replace ordered draft option list atomically. |
| POST /api/elections/[id]/actions/[action] | Activate, close early, cancel, or publish. Reject invalid transitions with 409. |
| GET /api/elections/[id]/voters | Paginated roster for owner/manager with optional eligibility filters. |
| POST /api/elections/[id]/voters/import | Import an idempotent bounded batch. |
| DELETE /api/elections/[id]/voters/[voterId] | Remove a draft roster entry. |
| POST /api/elections/[id]/invitations | Issue or replace links and stream bounded CSV download. |
| GET /api/elections/[id]/activity | Paginated administrative events. |
| POST /api/vote/[slug]/session | Validate token and set voter cookie. |
| GET /api/vote/[slug]/ballot | Return eligible ballot and window state. |
| POST /api/vote/[slug]/ballot | Accept optionId and execute atomic submission. |
| GET /api/results/[slug] | Read authorized published snapshot. |
| GET /api/results/[slug]/csv | Export authorized aggregate result data. |
| GET /api/health | Readiness check with bounded DB probe and generic status. |

Use 400 or 422 for validation failures, 401 for missing authentication, 403 for known forbidden actions, 404 for unknown resources or inaccessible private resources, 409 for lifecycle or idempotency conflicts, 429 with Retry-After for throttling, and 503 for temporary service failures. Activation, cancellation, publication, membership changes, exports, and invitation operations write actor and action metadata to audit. Authorize and mutate in the same transaction where concurrent membership revocation matters.

## 9. Results, security, and operations

- Track turnout with indexed aggregate reads at a modest refresh interval. Keep choice totals hidden until publication, including from organizers. Never stream updates for individual ballots. After closing, verify ballot count equals redeemed count before committing publication. Lock the election during publication to wait for in-flight submissions. Commit the snapshot and status together. Repeated publication returns the existing snapshot.
- Snapshot includes schema version, election title and ID, closing time, method, options and counts, eligible count, ballots cast, turnout, and winning or tied option IDs. CSV includes a row for each option and aggregate totals. Provide a print-friendly results page.
- Configure TLS, secure cookies, content security policy, referrer policy no-referrer for voting, and input validation. Keep private voter and results pages out of crawler indexes. Cap request body sizes. Use shared rate limiting in production with a Postgres-backed limiter or a managed edge limiter. Cover token checks, ballot submissions, and login. Set limits mindful of shared campus or mobile-carrier IPs. Apply a shorter per-credential limit to repeats. Return safe errors and redact secrets and voter data from logs.
- Track request volume, validation errors, database pool saturation, transaction latency, 429/5xx rates and availability. Do not send voter tokens, identities, option choices or request bodies to telemetry. Arrange backups and test restoration. Reconcile ballots and redemptions after staging restoration before using the deployment for elections.
- Prepare an election-day runbook with support ownership, checks before opening, incident triage, backup/restore, and a documented process for handling outages. Freeze routine deploys during voting. Use aggregate operational metrics for monitoring without retaining ballot-level traces.

## 10. Render and Supabase deployment

1. Use separate Supabase projects and Render services for staging and production. Use Node versions supported by the pinned Next.js and Prisma versions. Choose nearby Render and Supabase regions and measure latency. Configure Supabase Auth site origin, verification settings, allowlisted callback/reset URLs, and reliable SMTP for production organizer email.
2. Provision a dedicated private database schema, migration role and runtime role. Use the Supabase session pooler on port 5432 for the long-lived Render web service and migrations, with distinct role URLs. Use a direct connection for migrations when supported by the network. Use SSL per Supabase guidance and percent-encode passwords. Reuse one bounded pool per Node process. Size pool limits against total instance count and the database connection budget.
3. Create a Render **Node Web Service**. Build with npm ci, Prisma generation, and npm run build. Run npx prisma migrate deploy in a controlled release step using the migration credentials. Use Render's pre-deploy command where available, or run from CI with network access and secrets before deployment. Test backward compatibility so the old app continues working during rollout. Start with npm run start and bind Next.js to 0.0.0.0 using Render's PORT. Configure /api/health as the health check.
4. Supply render.yaml or exact dashboard instructions and a smoke-test script. Treat the service filesystem as ephemeral. Use Next.js server-side logic on the Node runtime, with no local durable state. Deploy through HTTPS and use a canonical production origin.
5. Use Free for development or previews. For the 200,000-vote launch, choose capacity after staging load tests. Account for Supabase storage, egress, database connections, Render startup and instance capacity, and organizer email costs.

| Environment variable | Purpose |
|---|---|
| DATABASE_URL | Server-only Prisma runtime connection, restricted role. |
| DIRECT_URL | Server-only migration connection used by prisma.config.ts. May be the session pooler. |
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL for organizer Auth. |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Publishable key for organizer Auth. |
| APP_ORIGIN | Canonical HTTPS origin, localhost permitted in development. |
| VOTER_SESSION_SECRET | Server-only signing key with a documented rotation procedure. |
| INVITE_HMAC_KEYS, INVITE_ACTIVE_KEY_VERSION | Versioned secret keyring and active key for token digests. Retain old versions while live links use them. |
| DATABASE_POOL_MAX | Maximum connections per process. |
| PORT | Assigned by Render in deployment. |

Keep production secrets out of source and browser bundles. Supply example values without live credentials. Allow the build to compile without querying election tables or requiring production database connectivity.

## 11. Performance targets and acceptance tests

Use staging with production-like compute and realistic fixtures. Seed 200,000 synthetic eligible voters and full-size data. Run one end-to-end burst at **70 distinct vote submissions per second for five minutes** with realistic ballot reads and link validation. Then measure a full 200,000-ballot run. Initial targets are **p95 submission latency under 1 second** during the burst, **under 0.5% unexpected failures**, and **zero duplicate or lost committed ballots**. Document the tested instance sizes, load shape, database footprint including indexes, egress, pool limits, and observed rate limits. Reconcile database totals and adjust infrastructure if capacity fails. These are release targets, not free-tier capacity guarantees.

| Test | Expected outcome |
|---|---|
| Draft to published result | Organizer completes setup, imports voters, issues links, receives votes and publishes accurate totals and CSV. |
| Concurrent submissions | Many simultaneous requests for one credential create exactly one ballot. |
| Insert failure and retry | Failed ballot insertion leaves the credential unused. A successful commit followed by response loss returns already recorded on retry. |
| Timing and transitions | Boundary tests cover start inclusive, end exclusive, cancellation, early close and in-flight submission ordering. |
| Cross-election option | App rejects foreign option IDs and the composite foreign key also blocks them. |
| Reissued link | Old link and old cookie cannot cast. New link works if the voter remains eligible. |
| Authorization | Other workspaces, logged-out clients and observers cannot perform restricted operations. Private results never leak through API, CSV or cache. |
| Tally | Zero votes, one winner, ties, zero-vote options, turnout, visibility, and repeated publication are correct. |
| Import and CSV | Validation, normalized duplicates, interrupted retry, batch replay, injection-safe exports and pagination work. |
| Privacy | Schema, API responses, exports and logs expose no voter-to-choice mapping. Preview traffic never redeems votes. |
| Accessibility and mobile | Keyboard navigation, screen-reader labels and errors, contrast, mobile layouts and slow network states work. |
| Deployment and recovery | Fresh database migration, correct connection roles, health check, backups and staging restoration succeed. |

## 12. Definition of done

- Working full-stack source with strict TypeScript, Tailwind styles, Prisma schema, migrations, lockfile, and seeded staging demo.
- Functional organizer, voter, and result journeys verified with integration tests and browser tests. Ship a repeatable load test and document its results when infrastructure is available.
- README with setup, test, seed, database migration, secret rotation, Render deployment and rollback commands.
- Deployment handoff lists actual environment dependencies and any test that still requires operator credentials or paid capacity.
- No placeholder API results, simulated votes in production, hard-coded admin accounts, or publicly accessible database credentials.

## Implementation references

- [Supabase Prisma integration](https://supabase.com/docs/guides/database/prisma)
- [Supabase plan limits](https://supabase.com/pricing)
- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Render Next.js deployment](https://render.com/docs/deploy-nextjs-app)
- [Render deployment steps](https://render.com/docs/deploys)
- [Render Free limitations](https://render.com/docs/free)
