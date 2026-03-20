


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE SCHEMA IF NOT EXISTS "pgmq_public";


ALTER SCHEMA "pgmq_public" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgmq";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return pgmq.archive( queue_name := queue_name, msg_id := message_id ); end; $$;


ALTER FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) IS 'Archives a message by moving it from the queue to a permanent archive.';



CREATE OR REPLACE FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return pgmq.delete( queue_name := queue_name, msg_id := message_id ); end; $$;


ALTER FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) IS 'Permanently deletes a message from the specified queue.';



CREATE OR REPLACE FUNCTION "pgmq_public"."pop"("queue_name" "text") RETURNS SETOF "pgmq"."message_record"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return query select * from pgmq.pop( queue_name := queue_name ); end; $$;


ALTER FUNCTION "pgmq_public"."pop"("queue_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."pop"("queue_name" "text") IS 'Retrieves and locks the next message from the specified queue.';



CREATE OR REPLACE FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) RETURNS SETOF "pgmq"."message_record"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return query select * from pgmq.read( queue_name := queue_name, vt := sleep_seconds, qty := n , conditional := '{}'::jsonb ); end; $$;


ALTER FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) IS 'Reads up to "n" messages from the specified queue with an optional "sleep_seconds" (visibility timeout).';



CREATE OR REPLACE FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer DEFAULT 0) RETURNS SETOF bigint
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return query select * from pgmq.send( queue_name := queue_name, msg := message, delay := sleep_seconds ); end; $$;


ALTER FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer) IS 'Sends a message to the specified queue, optionally delaying its availability by a number of seconds.';



CREATE OR REPLACE FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer DEFAULT 0) RETURNS SETOF bigint
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$ begin return query select * from pgmq.send_batch( queue_name := queue_name, msgs := messages, delay := sleep_seconds ); end; $$;


ALTER FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer) IS 'Sends a batch of messages to the specified queue, optionally delaying their availability by a number of seconds.';



CREATE OR REPLACE FUNCTION "public"."_broadcast_row_changes_by_id"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  rec_id text;
BEGIN
  -- Prefer NEW.id, else OLD.id for DELETE
  rec_id := COALESCE(NEW.id::text, OLD.id::text);
  PERFORM realtime.broadcast_changes(
    TG_TABLE_SCHEMA || ':' || TG_TABLE_NAME || ':' || rec_id,  -- topic: schema:table:id
    TG_OP,
    TG_OP,
    TG_TABLE_NAME,
    TG_TABLE_SCHEMA,
    NEW,
    OLD
  );
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."_broadcast_row_changes_by_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_protocol_enforcement"("target_path" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
    session record;
    is_test_file boolean;
    is_in_scope boolean;
begin
    select * into session
    from protocol_sessions
    where status = 'active'
    order by created_at desc limit 1;

    if session is null then
        return json_build_object('enforce', false);
    end if;

    if session.protocol = 'theseus' then
        is_test_file := target_path ~ '(/tests/|/test/|/__tests__/|\.test\.|\.spec\.)';
        if is_test_file then
            return json_build_object(
                'enforce', true,
                'blocked', true,
                'reason', 'TEST LOCK: Cannot modify test files during refactoring',
                'session_id', session.id
            );
        end if;

        select exists(
            select 1 from protocol_scope
            where session_id = session.id
            and target_path like file_path || '%'
        ) into is_in_scope;

        if not is_in_scope then
            return json_build_object(
                'enforce', true,
                'blocked', true,
                'reason', 'VISA REQUIRED: File outside declared scope',
                'session_id', session.id
            );
        end if;
    end if;

    return json_build_object(
        'enforce', true,
        'blocked', false,
        'session_id', session.id,
        'protocol', session.protocol
    );
end;
$$;


ALTER FUNCTION "public"."check_protocol_enforcement"("target_path" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  workspace_id UUID := gen_random_uuid();
  workspace_name TEXT;
  workspace_slug TEXT;
BEGIN
  -- 1. Create a Profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1));

  -- 2. Determine Workspace Name & Slug
  workspace_name := split_part(NEW.email, '@', 1) || '''s Workspace';
  workspace_slug := lower(split_part(NEW.email, '@', 1)) || '-' || lower(substring(replace(workspace_id::text, '-', ''), 1, 4));

  -- 3. Create the Workspace
  INSERT INTO public.workspaces (id, name, slug, owner_user_id, status, plan_id)
  VALUES (workspace_id, workspace_name, workspace_slug, NEW.id, 'active', 'free');

  -- 4. Create the Membership (Owner)
  INSERT INTO public.workspace_memberships (workspace_id, user_id, role)
  VALUES (workspace_id, NEW.id, 'owner');

  -- 5. Set as Default Workspace for Profile
  UPDATE public.profiles
  SET default_workspace_id = workspace_id
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_workspace_member"("ws_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_memberships
    WHERE workspace_id = ws_id
      AND user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_workspace_member"("ws_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_session_counts"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.branch_id IS NULL THEN
      UPDATE sessions SET thought_count = thought_count + 1
      WHERE id = NEW.session_id;
    ELSE
      -- Increment branch_count only if this is the first thought for this branch
      IF NOT EXISTS (
        SELECT 1 FROM thoughts
        WHERE session_id = NEW.session_id
          AND branch_id = NEW.branch_id
          AND id != NEW.id
      ) THEN
        UPDATE sessions SET branch_count = branch_count + 1
        WHERE id = NEW.session_id;
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.branch_id IS NULL THEN
      UPDATE sessions SET thought_count = thought_count - 1
      WHERE id = OLD.session_id;
    ELSE
      -- Decrement branch_count only if this was the last thought for this branch
      IF NOT EXISTS (
        SELECT 1 FROM thoughts
        WHERE session_id = OLD.session_id
          AND branch_id = OLD.branch_id
          AND id != OLD.id
      ) THEN
        UPDATE sessions SET branch_count = branch_count - 1
        WHERE id = OLD.session_id;
      END IF;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_session_counts"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."api_keys" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "prefix" "text" NOT NULL,
    "key_hash" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "last_used_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "created_by_user_id" "uuid" NOT NULL,
    "revoked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "api_keys_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'revoked'::"text"])))
);


ALTER TABLE "public"."api_keys" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."entities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project" "text" NOT NULL,
    "name" "text" NOT NULL,
    "type" "text" NOT NULL,
    "label" "text" NOT NULL,
    "properties" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "text",
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "valid_from" timestamp with time zone DEFAULT "now"() NOT NULL,
    "valid_to" timestamp with time zone,
    "superseded_by" "uuid",
    "access_count" integer DEFAULT 0 NOT NULL,
    "last_accessed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "importance_score" real DEFAULT 0.5 NOT NULL,
    CONSTRAINT "entities_type_check" CHECK (("type" = ANY (ARRAY['Insight'::"text", 'Concept'::"text", 'Workflow'::"text", 'Decision'::"text", 'Agent'::"text"]))),
    CONSTRAINT "entities_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'agent-private'::"text", 'user-private'::"text", 'team-private'::"text"])))
);


ALTER TABLE "public"."entities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."observations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project" "text" NOT NULL,
    "entity_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "source_session" "uuid",
    "added_by" "text",
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "valid_from" timestamp with time zone DEFAULT "now"() NOT NULL,
    "valid_to" timestamp with time zone,
    "superseded_by" "uuid",
    "content_tsv" "tsvector" GENERATED ALWAYS AS ("to_tsvector"('"english"'::"regconfig", "content")) STORED
);


ALTER TABLE "public"."observations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "user_id" "uuid" NOT NULL,
    "display_name" "text",
    "default_workspace_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protocol_audits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "diff_hash" "text" NOT NULL,
    "commit_message" "text" NOT NULL,
    "approved" boolean NOT NULL,
    "feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."protocol_audits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protocol_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_json" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "protocol_history_event_type_check" CHECK (("event_type" = ANY (ARRAY['plan'::"text", 'outcome'::"text", 'reflect'::"text", 'checkpoint'::"text"])))
);


ALTER TABLE "public"."protocol_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protocol_scope" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "source" "text" DEFAULT 'init'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "protocol_scope_source_check" CHECK (("source" = ANY (ARRAY['init'::"text", 'visa'::"text"])))
);


ALTER TABLE "public"."protocol_scope" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protocol_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "protocol" "text" NOT NULL,
    "workspace_id" "text",
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "state_json" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "protocol_sessions_check" CHECK (((("protocol" = 'theseus'::"text") AND ("status" = ANY (ARRAY['active'::"text", 'superseded'::"text", 'complete'::"text", 'audit_failure'::"text", 'scope_exhaustion'::"text"]))) OR (("protocol" = 'ulysses'::"text") AND ("status" = ANY (ARRAY['active'::"text", 'superseded'::"text", 'resolved'::"text", 'insufficient_information'::"text", 'environment_compromised'::"text"]))))),
    CONSTRAINT "protocol_sessions_protocol_check" CHECK (("protocol" = ANY (ARRAY['theseus'::"text", 'ulysses'::"text"])))
);


ALTER TABLE "public"."protocol_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."protocol_visas" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "file_path" "text" NOT NULL,
    "justification" "text" NOT NULL,
    "anti_pattern_acknowledged" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."protocol_visas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."relations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project" "text" NOT NULL,
    "from_id" "uuid" NOT NULL,
    "to_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "properties" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "text",
    CONSTRAINT "relations_type_check" CHECK (("type" = ANY (ARRAY['RELATES_TO'::"text", 'BUILDS_ON'::"text", 'CONTRADICTS'::"text", 'EXTRACTED_FROM'::"text", 'APPLIED_IN'::"text", 'LEARNED_BY'::"text", 'DEPENDS_ON'::"text", 'SUPERSEDES'::"text", 'MERGED_FROM'::"text"])))
);


ALTER TABLE "public"."relations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "project" "text",
    "title" "text" NOT NULL,
    "description" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "thought_count" integer DEFAULT 0 NOT NULL,
    "branch_count" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "last_accessed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sessions_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'completed'::"text", 'abandoned'::"text"])))
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."thoughts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "workspace_id" "uuid" NOT NULL,
    "thought" "text" NOT NULL,
    "thought_number" integer NOT NULL,
    "total_thoughts" integer NOT NULL,
    "next_thought_needed" boolean NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_revision" boolean DEFAULT false,
    "revises_thought" integer,
    "branch_from_thought" integer,
    "branch_id" "text",
    "needs_more_thoughts" boolean,
    "thought_type" "text" DEFAULT 'reasoning'::"text" NOT NULL,
    "confidence" "text",
    "options" "jsonb",
    "action_result" "jsonb",
    "beliefs" "jsonb",
    "assumption_change" "jsonb",
    "context_data" "jsonb",
    "progress_data" "jsonb",
    "agent_id" "text",
    "agent_name" "text",
    "content_hash" "text",
    "parent_hash" "text",
    "critique" "jsonb",
    CONSTRAINT "thoughts_confidence_check" CHECK (("confidence" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "thoughts_thought_type_check" CHECK (("thought_type" = ANY (ARRAY['reasoning'::"text", 'decision_frame'::"text", 'action_report'::"text", 'belief_snapshot'::"text", 'assumption_update'::"text", 'context_snapshot'::"text", 'progress'::"text"])))
);


ALTER TABLE "public"."thoughts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspace_memberships" (
    "workspace_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "invited_by_user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "workspace_memberships_role_check" CHECK (("role" = ANY (ARRAY['owner'::"text", 'admin'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."workspace_memberships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workspaces" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "owner_user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "plan_id" "text" DEFAULT 'free'::"text" NOT NULL,
    "subscription_status" "text" DEFAULT 'inactive'::"text" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    CONSTRAINT "workspaces_plan_id_check" CHECK (("plan_id" = ANY (ARRAY['free'::"text", 'pro'::"text", 'enterprise'::"text"]))),
    CONSTRAINT "workspaces_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'suspended'::"text", 'archived'::"text"]))),
    CONSTRAINT "workspaces_subscription_status_check" CHECK (("subscription_status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'past_due'::"text", 'canceled'::"text"])))
);


ALTER TABLE "public"."workspaces" OWNER TO "postgres";


ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entities"
    ADD CONSTRAINT "entities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."entities"
    ADD CONSTRAINT "entities_project_name_type_key" UNIQUE ("project", "name", "type");



ALTER TABLE ONLY "public"."observations"
    ADD CONSTRAINT "observations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."protocol_audits"
    ADD CONSTRAINT "protocol_audits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protocol_history"
    ADD CONSTRAINT "protocol_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protocol_scope"
    ADD CONSTRAINT "protocol_scope_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protocol_scope"
    ADD CONSTRAINT "protocol_scope_session_id_file_path_key" UNIQUE ("session_id", "file_path");



ALTER TABLE ONLY "public"."protocol_sessions"
    ADD CONSTRAINT "protocol_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."protocol_visas"
    ADD CONSTRAINT "protocol_visas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."relations"
    ADD CONSTRAINT "relations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."thoughts"
    ADD CONSTRAINT "thoughts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."thoughts"
    ADD CONSTRAINT "thoughts_session_id_thought_number_branch_id_key" UNIQUE NULLS NOT DISTINCT ("session_id", "thought_number", "branch_id");



ALTER TABLE ONLY "public"."workspace_memberships"
    ADD CONSTRAINT "workspace_memberships_pkey" PRIMARY KEY ("workspace_id", "user_id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_slug_key" UNIQUE ("slug");



CREATE INDEX "idx_api_keys_prefix" ON "public"."api_keys" USING "btree" ("prefix");



CREATE INDEX "idx_api_keys_workspace" ON "public"."api_keys" USING "btree" ("workspace_id");



CREATE INDEX "idx_entities_importance" ON "public"."entities" USING "btree" ("importance_score" DESC);



CREATE INDEX "idx_entities_project" ON "public"."entities" USING "btree" ("project");



CREATE INDEX "idx_entities_type" ON "public"."entities" USING "btree" ("project", "type");



CREATE INDEX "idx_entities_valid" ON "public"."entities" USING "btree" ("valid_from", "valid_to");



CREATE INDEX "idx_entities_visibility" ON "public"."entities" USING "btree" ("visibility");



CREATE INDEX "idx_observations_entity" ON "public"."observations" USING "btree" ("entity_id");



CREATE INDEX "idx_observations_fts" ON "public"."observations" USING "gin" ("content_tsv");



CREATE INDEX "idx_observations_project" ON "public"."observations" USING "btree" ("project");



CREATE INDEX "idx_observations_session" ON "public"."observations" USING "btree" ("source_session");



CREATE INDEX "idx_observations_valid" ON "public"."observations" USING "btree" ("valid_from", "valid_to");



CREATE INDEX "idx_protocol_sessions_active" ON "public"."protocol_sessions" USING "btree" ("protocol", "status") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_relations_from" ON "public"."relations" USING "btree" ("from_id");



CREATE INDEX "idx_relations_project" ON "public"."relations" USING "btree" ("project");



CREATE INDEX "idx_relations_to" ON "public"."relations" USING "btree" ("to_id");



CREATE INDEX "idx_relations_type" ON "public"."relations" USING "btree" ("type");



CREATE INDEX "idx_sessions_tags" ON "public"."sessions" USING "gin" ("tags");



CREATE INDEX "idx_sessions_updated" ON "public"."sessions" USING "btree" ("workspace_id", "updated_at" DESC);



CREATE INDEX "idx_sessions_workspace" ON "public"."sessions" USING "btree" ("workspace_id");



CREATE INDEX "idx_thoughts_branch" ON "public"."thoughts" USING "btree" ("session_id", "branch_id") WHERE ("branch_id" IS NOT NULL);



CREATE INDEX "idx_thoughts_session" ON "public"."thoughts" USING "btree" ("session_id", "thought_number");



CREATE INDEX "idx_thoughts_workspace" ON "public"."thoughts" USING "btree" ("workspace_id");



CREATE INDEX "idx_workspaces_stripe_sub" ON "public"."workspaces" USING "btree" ("stripe_subscription_id");



CREATE OR REPLACE TRIGGER "trg_sessions_broadcast" AFTER INSERT OR DELETE OR UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."_broadcast_row_changes_by_id"();



CREATE OR REPLACE TRIGGER "trg_thoughts_broadcast" AFTER INSERT OR DELETE OR UPDATE ON "public"."thoughts" FOR EACH ROW EXECUTE FUNCTION "public"."_broadcast_row_changes_by_id"();



CREATE OR REPLACE TRIGGER "trigger_entities_updated_at" BEFORE UPDATE ON "public"."entities" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_sessions_updated_at" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_session_counts" AFTER INSERT OR DELETE ON "public"."thoughts" FOR EACH ROW EXECUTE FUNCTION "public"."update_session_counts"();



CREATE OR REPLACE TRIGGER "trigger_workspaces_updated_at" BEFORE UPDATE ON "public"."workspaces" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."api_keys"
    ADD CONSTRAINT "api_keys_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."entities"
    ADD CONSTRAINT "entities_superseded_by_fkey" FOREIGN KEY ("superseded_by") REFERENCES "public"."entities"("id");



ALTER TABLE ONLY "public"."observations"
    ADD CONSTRAINT "observations_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."observations"
    ADD CONSTRAINT "observations_source_session_fkey" FOREIGN KEY ("source_session") REFERENCES "public"."sessions"("id");



ALTER TABLE ONLY "public"."observations"
    ADD CONSTRAINT "observations_superseded_by_fkey" FOREIGN KEY ("superseded_by") REFERENCES "public"."observations"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_default_workspace_id_fkey" FOREIGN KEY ("default_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."protocol_audits"
    ADD CONSTRAINT "protocol_audits_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."protocol_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."protocol_history"
    ADD CONSTRAINT "protocol_history_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."protocol_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."protocol_scope"
    ADD CONSTRAINT "protocol_scope_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."protocol_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."protocol_visas"
    ADD CONSTRAINT "protocol_visas_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."protocol_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."relations"
    ADD CONSTRAINT "relations_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "public"."entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."relations"
    ADD CONSTRAINT "relations_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "public"."entities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."thoughts"
    ADD CONSTRAINT "thoughts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."thoughts"
    ADD CONSTRAINT "thoughts_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_memberships"
    ADD CONSTRAINT "workspace_memberships_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."workspace_memberships"
    ADD CONSTRAINT "workspace_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspace_memberships"
    ADD CONSTRAINT "workspace_memberships_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workspaces"
    ADD CONSTRAINT "workspaces_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE "public"."api_keys" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "api_keys_anon_validate" ON "public"."api_keys" FOR SELECT TO "anon" USING (true);



CREATE POLICY "api_keys_member_access" ON "public"."api_keys" USING ("public"."is_workspace_member"("workspace_id")) WITH CHECK ("public"."is_workspace_member"("workspace_id"));



CREATE POLICY "api_keys_workspace_member" ON "public"."api_keys" USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_memberships" "wm"
  WHERE (("wm"."workspace_id" = "api_keys"."workspace_id") AND ("wm"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."workspace_memberships" "wm"
  WHERE (("wm"."workspace_id" = "api_keys"."workspace_id") AND ("wm"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."entities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "memberships_select_own" ON "public"."workspace_memberships" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."observations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_own" ON "public"."profiles" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "project_isolation" ON "public"."entities" USING (("project" = ("auth"."jwt"() ->> 'project'::"text")));



CREATE POLICY "project_isolation" ON "public"."observations" USING (("project" = ("auth"."jwt"() ->> 'project'::"text")));



CREATE POLICY "project_isolation" ON "public"."relations" USING (("project" = ("auth"."jwt"() ->> 'project'::"text")));



ALTER TABLE "public"."protocol_audits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protocol_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protocol_scope" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protocol_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."protocol_visas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."relations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "service_role_all" ON "public"."protocol_audits" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_all" ON "public"."protocol_history" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_all" ON "public"."protocol_scope" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_all" ON "public"."protocol_sessions" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_all" ON "public"."protocol_visas" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass" ON "public"."entities" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass" ON "public"."observations" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass" ON "public"."relations" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass_api_keys" ON "public"."api_keys" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass_sessions" ON "public"."sessions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "service_role_bypass_thoughts" ON "public"."thoughts" TO "service_role" USING (true) WITH CHECK (true);



ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sessions_member_access" ON "public"."sessions" USING ("public"."is_workspace_member"("workspace_id")) WITH CHECK ("public"."is_workspace_member"("workspace_id"));



ALTER TABLE "public"."thoughts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "thoughts_member_access" ON "public"."thoughts" USING ("public"."is_workspace_member"("workspace_id")) WITH CHECK ("public"."is_workspace_member"("workspace_id"));



ALTER TABLE "public"."workspace_memberships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workspaces" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "workspaces_delete_owner" ON "public"."workspaces" FOR DELETE USING (("owner_user_id" = "auth"."uid"()));



CREATE POLICY "workspaces_insert_authenticated" ON "public"."workspaces" FOR INSERT WITH CHECK (("owner_user_id" = "auth"."uid"()));



CREATE POLICY "workspaces_select_member" ON "public"."workspaces" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_memberships" "wm"
  WHERE (("wm"."workspace_id" = "workspaces"."id") AND ("wm"."user_id" = "auth"."uid"())))));



CREATE POLICY "workspaces_update_admin" ON "public"."workspaces" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."workspace_memberships" "wm"
  WHERE (("wm"."workspace_id" = "workspaces"."id") AND ("wm"."user_id" = "auth"."uid"()) AND ("wm"."role" = ANY (ARRAY['owner'::"text", 'admin'::"text"]))))));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "pgmq_public" TO "anon";
GRANT USAGE ON SCHEMA "pgmq_public" TO "authenticated";
GRANT USAGE ON SCHEMA "pgmq_public" TO "service_role";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
































































































































































































GRANT ALL ON FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."archive"("queue_name" "text", "message_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."delete"("queue_name" "text", "message_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "pgmq_public"."pop"("queue_name" "text") TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."pop"("queue_name" "text") TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."pop"("queue_name" "text") TO "authenticated";



GRANT ALL ON FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."read"("queue_name" "text", "sleep_seconds" integer, "n" integer) TO "authenticated";



GRANT ALL ON FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer) TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."send"("queue_name" "text", "message" "jsonb", "sleep_seconds" integer) TO "authenticated";



GRANT ALL ON FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer) TO "service_role";
GRANT ALL ON FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer) TO "anon";
GRANT ALL ON FUNCTION "pgmq_public"."send_batch"("queue_name" "text", "messages" "jsonb"[], "sleep_seconds" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."_broadcast_row_changes_by_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."_broadcast_row_changes_by_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."_broadcast_row_changes_by_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_protocol_enforcement"("target_path" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_protocol_enforcement"("target_path" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_protocol_enforcement"("target_path" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_workspace_member"("ws_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_workspace_member"("ws_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_workspace_member"("ws_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_session_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_session_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_session_counts"() TO "service_role";



























GRANT ALL ON TABLE "public"."api_keys" TO "anon";
GRANT ALL ON TABLE "public"."api_keys" TO "authenticated";
GRANT ALL ON TABLE "public"."api_keys" TO "service_role";



GRANT ALL ON TABLE "public"."entities" TO "anon";
GRANT ALL ON TABLE "public"."entities" TO "authenticated";
GRANT ALL ON TABLE "public"."entities" TO "service_role";



GRANT ALL ON TABLE "public"."observations" TO "anon";
GRANT ALL ON TABLE "public"."observations" TO "authenticated";
GRANT ALL ON TABLE "public"."observations" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."protocol_audits" TO "anon";
GRANT ALL ON TABLE "public"."protocol_audits" TO "authenticated";
GRANT ALL ON TABLE "public"."protocol_audits" TO "service_role";



GRANT ALL ON TABLE "public"."protocol_history" TO "anon";
GRANT ALL ON TABLE "public"."protocol_history" TO "authenticated";
GRANT ALL ON TABLE "public"."protocol_history" TO "service_role";



GRANT ALL ON TABLE "public"."protocol_scope" TO "anon";
GRANT ALL ON TABLE "public"."protocol_scope" TO "authenticated";
GRANT ALL ON TABLE "public"."protocol_scope" TO "service_role";



GRANT ALL ON TABLE "public"."protocol_sessions" TO "anon";
GRANT ALL ON TABLE "public"."protocol_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."protocol_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."protocol_visas" TO "anon";
GRANT ALL ON TABLE "public"."protocol_visas" TO "authenticated";
GRANT ALL ON TABLE "public"."protocol_visas" TO "service_role";



GRANT ALL ON TABLE "public"."relations" TO "anon";
GRANT ALL ON TABLE "public"."relations" TO "authenticated";
GRANT ALL ON TABLE "public"."relations" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."thoughts" TO "anon";
GRANT ALL ON TABLE "public"."thoughts" TO "authenticated";
GRANT ALL ON TABLE "public"."thoughts" TO "service_role";



GRANT ALL ON TABLE "public"."workspace_memberships" TO "anon";
GRANT ALL ON TABLE "public"."workspace_memberships" TO "authenticated";
GRANT ALL ON TABLE "public"."workspace_memberships" TO "service_role";



GRANT ALL ON TABLE "public"."workspaces" TO "anon";
GRANT ALL ON TABLE "public"."workspaces" TO "authenticated";
GRANT ALL ON TABLE "public"."workspaces" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "realtime_authenticated_receive"
  on "realtime"."messages"
  as permissive
  for select
  to authenticated
using (true);



  create policy "realtime_authenticated_send"
  on "realtime"."messages"
  as permissive
  for insert
  to authenticated
with check (true);



