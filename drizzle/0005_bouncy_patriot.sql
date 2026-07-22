CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"password_hash" text NOT NULL,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- film_status is keyed by film_id alone today; every existing row's
-- watched/owned data needs an owner before user_id can be required. Add the
-- column nullable first, attribute existing rows to a placeholder account
-- (renamed to a real user via scripts/claim-owner.ts), then tighten it.
ALTER TABLE "film_status" ADD COLUMN "user_id" integer;
--> statement-breakpoint
ALTER TABLE "film_status" ADD CONSTRAINT "film_status_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
INSERT INTO "users" ("username", "password_hash", "must_change_password")
VALUES ('__pending_owner__', 'disabled', true);
--> statement-breakpoint
UPDATE "film_status"
SET "user_id" = (SELECT "id" FROM "users" WHERE "username" = '__pending_owner__')
WHERE "user_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "film_status" ALTER COLUMN "user_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "film_status" DROP CONSTRAINT IF EXISTS "film_status_pkey";
--> statement-breakpoint
ALTER TABLE "film_status" ADD CONSTRAINT "film_status_user_id_film_id_pk" PRIMARY KEY("user_id","film_id");
