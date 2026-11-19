-- Convert existing UUID-backed identifier columns to CUID-compatible text identifiers.
ALTER TABLE ballotveyra."OrganizerProfile"
  ALTER COLUMN "id" TYPE VARCHAR(36) USING "id"::text;

ALTER TABLE ballotveyra."Workspace"
  ALTER COLUMN "id" TYPE VARCHAR(36) USING "id"::text;

ALTER TABLE ballotveyra."WorkspaceMember"
  ALTER COLUMN "workspaceId" TYPE VARCHAR(36) USING "workspaceId"::text,
  ALTER COLUMN "organizerId" TYPE VARCHAR(36) USING "organizerId"::text;

ALTER TABLE ballotveyra."Election"
  ALTER COLUMN "id" TYPE VARCHAR(36) USING "id"::text,
  ALTER COLUMN "workspaceId" TYPE VARCHAR(36) USING "workspaceId"::text;

ALTER TABLE ballotveyra."BallotOption"
  ALTER COLUMN "id" TYPE VARCHAR(36) USING "id"::text,
  ALTER COLUMN "electionId" TYPE VARCHAR(36) USING "electionId"::text;

ALTER TABLE ballotveyra."EligibleVoter"
  ALTER COLUMN "id" TYPE VARCHAR(36) USING "id"::text,
  ALTER COLUMN "electionId" TYPE VARCHAR(36) USING "electionId"::text;

ALTER TABLE ballotveyra."Ballot"
  ALTER COLUMN "id" TYPE VARCHAR(36) USING "id"::text,
  ALTER COLUMN "electionId" TYPE VARCHAR(36) USING "electionId"::text,
  ALTER COLUMN "optionId" TYPE VARCHAR(36) USING "optionId"::text;

ALTER TABLE ballotveyra."ImportBatch"
  ALTER COLUMN "electionId" TYPE VARCHAR(36) USING "electionId"::text,
  ALTER COLUMN "batchKey" TYPE VARCHAR(36) USING "batchKey"::text;

ALTER TABLE ballotveyra."ResultSnapshot"
  ALTER COLUMN "electionId" TYPE VARCHAR(36) USING "electionId"::text,
  ALTER COLUMN "publishedBy" TYPE VARCHAR(36) USING "publishedBy"::text;

ALTER TABLE ballotveyra."AuditEvent"
  ALTER COLUMN "id" TYPE VARCHAR(36) USING "id"::text,
  ALTER COLUMN "workspaceId" TYPE VARCHAR(36) USING "workspaceId"::text,
  ALTER COLUMN "electionId" TYPE VARCHAR(36) USING "electionId"::text,
  ALTER COLUMN "actorId" TYPE VARCHAR(36) USING "actorId"::text;
