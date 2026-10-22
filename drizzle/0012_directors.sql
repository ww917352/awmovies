CREATE TABLE "directors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"birth_year" integer NOT NULL,
	"death_year" integer,
	"photo_url" text,
	"wiki_url" text,
	"letterboxd_url" text,
	CONSTRAINT "directors_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "list_films" ADD COLUMN "section" text;--> statement-breakpoint
ALTER TABLE "lists" ADD COLUMN "director_id" integer;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_director_id_directors_id_fk" FOREIGN KEY ("director_id") REFERENCES "public"."directors"("id") ON DELETE set null ON UPDATE no action;