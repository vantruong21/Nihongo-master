-- =============================================================================
-- J-CUSTOM DECK - DATABASE SCHEMA
-- Target DB: MySQL (Version 5.7+ / 8.0+)
-- Character Set: utf8mb4 (Fully supports Japanese Kanji, Hiragana, Katakana & Emojis)
-- =============================================================================


-- Disable foreign key checks temporarily to drop tables in any order
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `quiz_details`;
DROP TABLE IF EXISTS `quiz_sessions`;
DROP TABLE IF EXISTS `questions`;
DROP TABLE IF EXISTS `study_sets`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- 1. Table: users
-- -----------------------------------------------------------------------------
CREATE TABLE `users` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `role` VARCHAR(100) DEFAULT 'USER'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Table: study_sets
-- -----------------------------------------------------------------------------
CREATE TABLE `study_sets` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `user_id` BIGINT NULL,
  CONSTRAINT `fk_studyset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Table: questions
-- -----------------------------------------------------------------------------
CREATE TABLE `questions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `prompt` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hint` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mnemonic` VARCHAR(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Optional memorization tip text',
  `level` VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'JLPT level: N5, N4, N3, N2, N1',
  `type` VARCHAR(50) NOT NULL COMMENT 'Values: VOCAB, KANJI, GRAMMAR',
  `study_set_id` BIGINT NOT NULL,
  CONSTRAINT `fk_question_studyset` FOREIGN KEY (`study_set_id`) REFERENCES `study_sets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Table: quiz_sessions
-- -----------------------------------------------------------------------------
CREATE TABLE `quiz_sessions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT NULL,
  `study_set_id` BIGINT NOT NULL,
  `mode` VARCHAR(50) NOT NULL COMMENT 'Values: TYPING, MCQ, GENIUS',
  `score` INT DEFAULT 0,
  `total_questions` INT DEFAULT 0,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_session_studyset` FOREIGN KEY (`study_set_id`) REFERENCES `study_sets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Table: quiz_details
-- -----------------------------------------------------------------------------
CREATE TABLE `quiz_details` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `quiz_session_id` BIGINT NOT NULL,
  `question_id` BIGINT NOT NULL,
  `user_answer` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `is_correct` TINYINT(1) NOT NULL,
  CONSTRAINT `fk_detail_session` FOREIGN KEY (`quiz_session_id`) REFERENCES `quiz_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_detail_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- SAMPLE DATA FOR TESTING
-- =============================================================================

-- Seed Users (password: student is 'password', admin is 'admin123', guest1 is 'guest123')
INSERT INTO `users` (`id`, `username`, `password`, `email`, `role`) VALUES
(1, 'student', '$2a$10$8.UnVuG9HHgffUDAlk8GPuOC6r0.z.t/6tq1V9mF75v8eD42044675', 'student@japanese.edu', 'USER'),
(2, 'admin', '$2a$10$SQzeLXgpbhyB4n/LMdRwmeqAqpDAJH6couq6LrNPYZjvjKYX6M6ty', 'admin@japanese.edu', 'ADMIN'),
(3, 'guest1', '$2a$10$A9JkjDxAlX/P7dX35swTNOqeKQQUOzLH.mhz0TXhQ61G6PBva5Nte', 'guest1@japanese.edu', 'GUEST');
