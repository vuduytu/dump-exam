ALTER TABLE `questions` ADD `source` varchar(64);--> statement-breakpoint
ALTER TABLE `questions` ADD `number` int;--> statement-breakpoint
ALTER TABLE `questions` ADD `explanation` text;--> statement-breakpoint
ALTER TABLE `questions` ADD `duplicates` json;