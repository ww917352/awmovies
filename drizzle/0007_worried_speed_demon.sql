CREATE TABLE "rate_limit_attempts" (
	"key" text PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp DEFAULT now() NOT NULL,
	"locked_until" timestamp
);
