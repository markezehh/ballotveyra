CREATE SCHEMA IF NOT EXISTS ballotveyra;
REVOKE ALL ON SCHEMA ballotveyra FROM PUBLIC;

CREATE TYPE ballotveyra."WorkspaceRole" AS ENUM ('OWNER', 'MANAGER', 'OBSERVER');
CREATE TYPE ballotveyra."ElectionStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'CLOSED', 'PUBLISHED', 'CANCELLED');
CREATE TYPE ballotveyra."ResultVisibility" AS ENUM ('WORKSPACE', 'PUBLIC');

CREATE TABLE ballotveyra."OrganizerProfile" (
  "id" UUID PRIMARY KEY,
  "email" VARCHAR(254) NOT NULL UNIQUE
);

CREATE TABLE ballotveyra."Workspace" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" VARCHAR(80) NOT NULL UNIQUE,
  "name" VARCHAR(120) NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now()
);

CREATE TABLE ballotveyra."WorkspaceMember" (
  "workspaceId" UUID NOT NULL,
  "organizerId" UUID NOT NULL,
  "role" ballotveyra."WorkspaceRole" NOT NULL,
  PRIMARY KEY ("workspaceId", "organizerId"),
  CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES ballotveyra."Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "WorkspaceMember_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES ballotveyra."OrganizerProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "WorkspaceMember_organizerId_idx" ON ballotveyra."WorkspaceMember"("organizerId");

CREATE TABLE ballotveyra."Election" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId" UUID NOT NULL,
  "slug" VARCHAR(80) NOT NULL UNIQUE,
  "title" VARCHAR(160) NOT NULL,
  "description" TEXT,
  "status" ballotveyra."ElectionStatus" NOT NULL DEFAULT 'DRAFT',
  "timeZone" VARCHAR(64) NOT NULL DEFAULT 'Africa/Lagos',
  "opensAt" TIMESTAMPTZ(3),
  "closesAt" TIMESTAMPTZ(3),
  "endedEarlyAt" TIMESTAMPTZ(3),
  "eligibleCount" INTEGER,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  CONSTRAINT "Election_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES ballotveyra."Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Election_valid_window" CHECK ("opensAt" IS NULL OR "closesAt" IS NULL OR "opensAt" < "closesAt"),
  CONSTRAINT "Election_valid_eligible_count" CHECK ("eligibleCount" IS NULL OR "eligibleCount" >= 0)
);
CREATE INDEX "Election_workspaceId_createdAt_id_idx" ON ballotveyra."Election"("workspaceId", "createdAt", "id");

CREATE TABLE ballotveyra."BallotOption" (
  "id" UUID PRIMARY KEY,
  "electionId" UUID NOT NULL,
  "label" VARCHAR(120) NOT NULL,
  "description" TEXT,
  "position" INTEGER NOT NULL,
  CONSTRAINT "BallotOption_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES ballotveyra."Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "BallotOption_valid_position" CHECK ("position" >= 0),
  UNIQUE ("electionId", "id"),
  UNIQUE ("electionId", "position")
);

CREATE TABLE ballotveyra."EligibleVoter" (
  "id" UUID PRIMARY KEY,
  "electionId" UUID NOT NULL,
  "voterKey" VARCHAR(120) NOT NULL,
  "email" VARCHAR(254),
  "displayName" VARCHAR(120),
  "tokenDigest" VARCHAR(64) UNIQUE,
  "keyVersion" INTEGER,
  "redeemed" BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT "EligibleVoter_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES ballotveyra."Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EligibleVoter_valid_invite_pair" CHECK (("tokenDigest" IS NULL AND "keyVersion" IS NULL) OR ("tokenDigest" IS NOT NULL AND "keyVersion" IS NOT NULL AND "keyVersion" > 0)),
  UNIQUE ("electionId", "voterKey"),
  UNIQUE ("electionId", "email")
);
CREATE INDEX "EligibleVoter_electionId_id_idx" ON ballotveyra."EligibleVoter"("electionId", "id");

CREATE TABLE ballotveyra."Ballot" (
  "id" UUID PRIMARY KEY,
  "electionId" UUID NOT NULL,
  "optionId" UUID NOT NULL,
  CONSTRAINT "Ballot_option_fkey" FOREIGN KEY ("electionId", "optionId") REFERENCES ballotveyra."BallotOption"("electionId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "Ballot_electionId_optionId_idx" ON ballotveyra."Ballot"("electionId", "optionId");

CREATE TABLE ballotveyra."ImportBatch" (
  "electionId" UUID NOT NULL,
  "batchKey" UUID NOT NULL,
  "digest" VARCHAR(64) NOT NULL,
  "summary" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  PRIMARY KEY ("electionId", "batchKey"),
  CONSTRAINT "ImportBatch_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES ballotveyra."Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE ballotveyra."ResultSnapshot" (
  "electionId" UUID PRIMARY KEY,
  "visibility" ballotveyra."ResultVisibility" NOT NULL DEFAULT 'WORKSPACE',
  "tally" JSONB NOT NULL,
  "publishedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  "publishedBy" UUID NOT NULL,
  CONSTRAINT "ResultSnapshot_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES ballotveyra."Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE ballotveyra."AuditEvent" (
  "id" UUID PRIMARY KEY,
  "workspaceId" UUID NOT NULL,
  "electionId" UUID,
  "actorId" UUID NOT NULL,
  "action" VARCHAR(60) NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT now(),
  CONSTRAINT "AuditEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES ballotveyra."Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AuditEvent_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES ballotveyra."Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "AuditEvent_workspaceId_createdAt_id_idx" ON ballotveyra."AuditEvent"("workspaceId", "createdAt", "id");
CREATE INDEX "AuditEvent_electionId_createdAt_id_idx" ON ballotveyra."AuditEvent"("electionId", "createdAt", "id");

REVOKE ALL ON ALL TABLES IN SCHEMA ballotveyra FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA ballotveyra FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ballotveyra FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ballot_runtime') THEN
    GRANT USAGE ON SCHEMA ballotveyra TO ballot_runtime;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ballotveyra."OrganizerProfile" TO ballot_runtime;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ballotveyra."Workspace" TO ballot_runtime;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ballotveyra."WorkspaceMember" TO ballot_runtime;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ballotveyra."Election" TO ballot_runtime;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ballotveyra."BallotOption" TO ballot_runtime;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ballotveyra."EligibleVoter" TO ballot_runtime;
    GRANT SELECT, INSERT ON ballotveyra."Ballot" TO ballot_runtime;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ballotveyra."ImportBatch" TO ballot_runtime;
    GRANT SELECT, INSERT ON ballotveyra."ResultSnapshot" TO ballot_runtime;
    GRANT SELECT, INSERT ON ballotveyra."AuditEvent" TO ballot_runtime;
  END IF;
END $$;
