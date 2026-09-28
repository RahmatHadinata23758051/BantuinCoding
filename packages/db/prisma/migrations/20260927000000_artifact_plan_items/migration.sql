-- CreateTable
CREATE TABLE "artifact_plan_items" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "context_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artifact_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "artifact_plan_items_project_id_context_id_type_key" ON "artifact_plan_items"("project_id", "context_id", "type");

-- CreateIndex
CREATE INDEX "artifact_plan_items_project_id_context_id_is_required_idx" ON "artifact_plan_items"("project_id", "context_id", "is_required");

-- AddForeignKey
ALTER TABLE "artifact_plan_items" ADD CONSTRAINT "artifact_plan_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifact_plan_items" ADD CONSTRAINT "artifact_plan_items_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "project_contexts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
