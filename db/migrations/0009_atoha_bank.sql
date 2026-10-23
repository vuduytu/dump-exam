ALTER TABLE `exams` ADD `bank` varchar(16) DEFAULT 'examtopics' NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `bank` varchar(16) DEFAULT 'examtopics' NOT NULL;