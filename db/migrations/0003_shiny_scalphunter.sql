CREATE TABLE `attempt_answers` (
	`attempt_id` int NOT NULL,
	`question_id` int NOT NULL,
	`selected` varchar(8) NOT NULL,
	CONSTRAINT `attempt_answers_attempt_id_question_id_pk` PRIMARY KEY(`attempt_id`,`question_id`)
);
--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`exam_id` int NOT NULL,
	`started_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`submitted_at` datetime,
	`score` int,
	CONSTRAINT `attempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `attempt_answers` ADD CONSTRAINT `attempt_answers_attempt_id_attempts_id_fk` FOREIGN KEY (`attempt_id`) REFERENCES `attempts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attempt_answers` ADD CONSTRAINT `attempt_answers_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attempts` ADD CONSTRAINT `attempts_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `attempts` ADD CONSTRAINT `attempts_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE no action ON UPDATE no action;