-- Pinned year moves from a single app-wide setting to a per-user one: only
-- logged-in users can pin, and each user has their own pin. There's no
-- sensible single owner for whatever was pinned globally before, so this
-- drops the old table rather than trying to attribute it to someone.
DROP TABLE "app_settings";
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"pinned_year" integer
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
