CREATE TABLE `exam_questions` (
	`exam_id` int NOT NULL,
	`position` int NOT NULL,
	`question_id` int NOT NULL,
	CONSTRAINT `exam_questions_exam_id_position_pk` PRIMARY KEY(`exam_id`,`position`),
	CONSTRAINT `exam_questions_exam_id_question_id_unique` UNIQUE(`exam_id`,`question_id`)
);
--> statement-breakpoint
CREATE TABLE `exams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	CONSTRAINT `exams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `exam_questions` ADD CONSTRAINT `exam_questions_exam_id_exams_id_fk` FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `exam_questions` ADD CONSTRAINT `exam_questions_question_id_questions_id_fk` FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE no action ON UPDATE no action;