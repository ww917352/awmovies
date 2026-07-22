CREATE TABLE "award_wins" (
	"id" serial PRIMARY KEY NOT NULL,
	"award_id" integer NOT NULL,
	"film_id" integer NOT NULL,
	"year" integer NOT NULL,
	"edition_label" text,
	CONSTRAINT "award_wins_award_year_film_unique" UNIQUE("award_id","year","film_id")
);
--> statement-breakpoint
CREATE TABLE "awards" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(64) NOT NULL,
	"organization" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "awards_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "film_status" (
	"film_id" integer PRIMARY KEY NOT NULL,
	"watched" boolean DEFAULT false NOT NULL,
	"watched_date" date,
	"owned_formats" text[] DEFAULT '{}' NOT NULL,
	"digital_quality" varchar(8),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "films" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"release_year" integer NOT NULL,
	"directors" text[] DEFAULT '{}' NOT NULL,
	"studios" text[] DEFAULT '{}' NOT NULL,
	"main_cast" text[] DEFAULT '{}' NOT NULL,
	"wiki_url" text,
	"letterboxd_url" text,
	"letterboxd_unverified" boolean DEFAULT false NOT NULL,
	CONSTRAINT "films_title_release_year_unique" UNIQUE("title","release_year")
);
--> statement-breakpoint
ALTER TABLE "award_wins" ADD CONSTRAINT "award_wins_award_id_awards_id_fk" FOREIGN KEY ("award_id") REFERENCES "public"."awards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "award_wins" ADD CONSTRAINT "award_wins_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_status" ADD CONSTRAINT "film_status_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE cascade ON UPDATE no action;