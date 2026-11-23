ALTER TABLE public."EligibleVoter"
  ADD COLUMN IF NOT EXISTS "phone" VARCHAR(32);

DROP INDEX IF EXISTS public."EligibleVoter_electionId_email_key";

ALTER TABLE public."EligibleVoter"
  DROP COLUMN IF EXISTS "email";

ALTER TABLE public."EligibleVoter"
  DROP CONSTRAINT IF EXISTS "EligibleVoter_electionId_phone_key";

ALTER TABLE public."EligibleVoter"
  ADD CONSTRAINT "EligibleVoter_electionId_phone_key"
  UNIQUE ("electionId", "phone");
