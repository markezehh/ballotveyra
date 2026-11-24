CREATE TABLE ballotveyra."WorkspaceInvite" (
  "id" VARCHAR(36) NOT NULL,
  "workspaceId" VARCHAR(36) NOT NULL,
  "voterKey" VARCHAR(120) NOT NULL,
  "tokenDigest" VARCHAR(64) NOT NULL,
  "keyVersion" INTEGER NOT NULL,
  CONSTRAINT "WorkspaceInvite_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "WorkspaceInvite_tokenDigest_key" UNIQUE ("tokenDigest"),
  CONSTRAINT "WorkspaceInvite_workspaceId_voterKey_key" UNIQUE ("workspaceId", "voterKey"),
  CONSTRAINT "WorkspaceInvite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES ballotveyra."Workspace"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ballot_runtime') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON ballotveyra."WorkspaceInvite" TO ballot_runtime;
  END IF;
END $$;
