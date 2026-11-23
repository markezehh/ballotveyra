ALTER TABLE ballotveyra."EligibleVoter"
  ADD COLUMN "phone" VARCHAR(32);

ALTER TABLE ballotveyra."EligibleVoter"
  DROP CONSTRAINT IF EXISTS "EligibleVoter_electionId_email_key",
  ADD CONSTRAINT "EligibleVoter_electionId_phone_key" UNIQUE ("electionId", "phone");

ALTER TABLE ballotveyra."EligibleVoter"
  DROP COLUMN "email";
