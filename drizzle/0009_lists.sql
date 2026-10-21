CREATE TABLE "lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"kind" varchar(8) NOT NULL,
	"rule" varchar(16),
	"parent_id" integer,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "lists_slug_unique" UNIQUE("slug"),
	CONSTRAINT "lists_kind_check" CHECK ("lists"."kind" in ('films', 'lists')),
	CONSTRAINT "lists_rule_check" CHECK ("lists"."rule" is null or ("lists"."kind" = 'films' and "lists"."rule" in ('owned')))
);
--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_parent_id_lists_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lists_parent_id_idx" ON "lists" USING btree ("parent_id");