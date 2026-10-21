CREATE TABLE "list_films" (
	"list_id" integer NOT NULL,
	"film_id" integer NOT NULL,
	"rank" integer,
	"position" integer NOT NULL,
	CONSTRAINT "list_films_list_id_film_id_pk" PRIMARY KEY("list_id","film_id")
);
--> statement-breakpoint
ALTER TABLE "lists" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "list_films" ADD CONSTRAINT "list_films_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_films" ADD CONSTRAINT "list_films_film_id_films_id_fk" FOREIGN KEY ("film_id") REFERENCES "public"."films"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "list_films_film_id_idx" ON "list_films" USING btree ("film_id");--> statement-breakpoint
CREATE INDEX "award_wins_film_id_idx" ON "award_wins" USING btree ("film_id");