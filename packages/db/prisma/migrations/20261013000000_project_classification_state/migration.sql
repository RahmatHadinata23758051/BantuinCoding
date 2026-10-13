-- Persist classifier lifecycle independently from project workflow.
-- Existing projects keep their current classification and are marked READY for compatibility.
ALTER TABLE "projects"
  ADD COLUMN "classification_status" TEXT NOT NULL DEFAULT 'READY',
  ADD COLUMN "classification_error" VARCHAR(120),
  ADD COLUMN "classification_attempt" INTEGER NOT NULL DEFAULT 0;
