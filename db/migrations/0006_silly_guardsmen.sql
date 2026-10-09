CREATE TABLE `drill_questions` (
	`attempt_id` int NOT NULL,
	`position` int NOT NULL,
	`question_id` int NOT NULL,
	CONSTRAINT `drill_questions_attempt_id_position_pk` PRIMARY KEY(`attempt_id`,`position`),
	CONSTRAINT `drill_questions_attempt_id_question_id_unique` UNIQUE(`attempt_id`,`question_id`)
);
--> statement-breakpoint
ALTER TABLE `attempts` MODIFY COLUMN `exam_id` int;--> statement-breakpoint
ALTER TABLE `attempts` ADD `drill_source` varchar(32);--> statement-breakpoint
ALTER TABLE `questions` ADD `task` varchar(16);--> statement-breakpoint
ALTER TABLE `questions` ADD `approach` varchar(16);--> statement-breakpoint
ALTER TABLE `drill_questions` ADD CONSTRAINT `drill_questions_attempt_id_attempts_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `drill_questions` ADD CONSTRAINT `drill_questions_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE no action ON UPDATE no action;