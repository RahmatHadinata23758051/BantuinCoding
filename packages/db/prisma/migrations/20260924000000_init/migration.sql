-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "raw_idea" TEXT NOT NULL,
    "classification" TEXT NOT NULL DEFAULT 'OTHER',
    "target_agent" TEXT NOT NULL DEFAULT 'CLAUDE_CODE',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_contexts" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "content_json" TEXT NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_contexts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clarification_questions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "impact" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clarification_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artifacts" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "context_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'NOT_GENERATED',
    "provider" TEXT,
    "model" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_recommendations" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'skillsllm.com',
    "purpose" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backlog_phases" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backlog_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backlog_tasks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "phase_id" TEXT NOT NULL,
    "task_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "acceptance_criteria" TEXT NOT NULL,
    "definition_of_done" TEXT NOT NULL,
    "relevant_docs" TEXT,
    "recommended_skills" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "backlog_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "backlog_dependencies" (
    "task_id" TEXT NOT NULL,
    "depends_on_task_id" TEXT NOT NULL,

    CONSTRAINT "backlog_dependencies_pkey" PRIMARY KEY ("task_id","depends_on_task_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "project_contexts_project_id_version_key" ON "project_contexts"("project_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "artifacts_project_id_type_key" ON "artifacts"("project_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "backlog_phases_project_id_order_key" ON "backlog_phases"("project_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "backlog_tasks_project_id_task_key_key" ON "backlog_tasks"("project_id", "task_key");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_contexts" ADD CONSTRAINT "project_contexts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clarification_questions" ADD CONSTRAINT "clarification_questions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_context_id_fkey" FOREIGN KEY ("context_id") REFERENCES "project_contexts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_recommendations" ADD CONSTRAINT "skill_recommendations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backlog_phases" ADD CONSTRAINT "backlog_phases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backlog_tasks" ADD CONSTRAINT "backlog_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backlog_tasks" ADD CONSTRAINT "backlog_tasks_phase_id_fkey" FOREIGN KEY ("phase_id") REFERENCES "backlog_phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backlog_dependencies" ADD CONSTRAINT "backlog_dependencies_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "backlog_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "backlog_dependencies" ADD CONSTRAINT "backlog_dependencies_depends_on_task_id_fkey" FOREIGN KEY ("depends_on_task_id") REFERENCES "backlog_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

