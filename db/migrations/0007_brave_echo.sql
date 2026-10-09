CREATE TABLE `user_certifications` (
	`user_id` int NOT NULL,
	`certification` varchar(8) NOT NULL,
	CONSTRAINT `user_certifications_user_id_certification_pk` PRIMARY KEY(`user_id`,`certification`)
);
--> statement-breakpoint
ALTER TABLE `attempts` ADD `certification` varchar(8) DEFAULT 'PMP' NOT NULL;--> statement-breakpoint
ALTER TABLE `exams` ADD `certification` varchar(8) DEFAULT 'PMP' NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `certification` varchar(8) DEFAULT 'PMP' NOT NULL;--> statement-breakpoint
ALTER TABLE `user_certifications` ADD CONSTRAINT `user_certifications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- Certification Access: every User from before PgMP keeps PMP (existing rows got PMP from the column defaults above).
INSERT INTO `user_certifications` (`user_id`, `certification`) SELECT `id`, 'PMP' FROM `users`;