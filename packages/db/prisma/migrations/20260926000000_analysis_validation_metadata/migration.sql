-- CreateTable
CREATE TABLE "project_analyses" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "content_json" TEXT NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validation_reports" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "context_id" TEXT NOT NULL,
    "content_json" TEXT NOT NULL,
    "artifact_version" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_reports_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "artifacts" ADD COLUMN "is_required" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "plan_reason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "project_analyses_project_id_version_key" ON "project_analyses"("project_id", "version");

-- CreateIndex
CREATE INDEX "project_analyses_project_id_is_current_idx" ON "project_analyses"("project_id", "is_current");

-- CreateIndex
CREATE INDEX "validation_reports_project_id_created_at_idx" ON "validation_reports"("project_id", "created_at");

-- AddForeignKey
ALTER TABLE "project_analyses" ADD CONSTRAINT "project_analyses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_reports" ADD CONSTRAINT "validation_reports_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validation_reports" ADD CONSTRAINT "validation_reports_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "project_contexts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
