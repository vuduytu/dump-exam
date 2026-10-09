CREATE TABLE `questions` (
	`id` int NOT NULL,
	`text` text NOT NULL,
	`choices` json NOT NULL,
	`suggested_answer` varchar(8) NOT NULL,
	`most_voted_answer` varchar(8) NOT NULL,
	`correct_answer` varchar(8) NOT NULL,
	`votes` json NOT NULL,
	`usable` boolean NOT NULL,
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
