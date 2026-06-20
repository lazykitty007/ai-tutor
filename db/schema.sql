CREATE TABLE users (
  id VARCHAR(36) NOT NULL,
  email VARCHAR(191) NULL,
  display_name VARCHAR(64) NULL,
  auth_provider VARCHAR(32) NOT NULL DEFAULT 'anonymous',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE user_credentials (
  user_id VARCHAR(36) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  password_salt VARCHAR(64) NOT NULL,
  password_algorithm VARCHAR(32) NOT NULL DEFAULT 'scrypt-sha256-v1',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_credentials_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE user_sessions (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  user_agent VARCHAR(255) NULL,
  expires_at DATETIME(3) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_seen_at DATETIME(3) NULL,
  revoked_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_sessions_token_hash (token_hash),
  KEY idx_user_sessions_user_expires (user_id, expires_at),
  CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE child_profiles (
  id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  nickname VARCHAR(64) NOT NULL,
  age_band VARCHAR(16) NOT NULL,
  stage VARCHAR(32) NOT NULL,
  daily_minutes TINYINT UNSIGNED NOT NULL,
  goals JSON NOT NULL,
  baseline JSON NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  deleted_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  KEY idx_child_profiles_user_active (user_id, is_active),
  CONSTRAINT fk_child_profiles_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE parent_preferences (
  child_id VARCHAR(36) NOT NULL,
  gate_type VARCHAR(32) NOT NULL DEFAULT 'hold_button',
  relaxed_mode_default BOOLEAN NOT NULL DEFAULT FALSE,
  report_push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  allow_new_knowledge BOOLEAN NOT NULL DEFAULT TRUE,
  max_daily_minutes TINYINT UNSIGNED NOT NULL DEFAULT 20,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (child_id),
  KEY idx_parent_preferences_updated_at (updated_at),
  CONSTRAINT fk_parent_preferences_child FOREIGN KEY (child_id) REFERENCES child_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE content_packages (
  id VARCHAR(36) NOT NULL,
  subject VARCHAR(16) NOT NULL,
  version VARCHAR(32) NOT NULL,
  title VARCHAR(128) NOT NULL,
  description VARCHAR(500) NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_content_packages_subject_version (subject, version),
  KEY idx_content_packages_subject_active (subject, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE knowledge_nodes (
  id VARCHAR(36) NOT NULL,
  package_id VARCHAR(36) NOT NULL,
  type VARCHAR(16) NOT NULL,
  title VARCHAR(128) NOT NULL,
  meaning VARCHAR(255) NOT NULL,
  pinyin VARCHAR(64) NULL,
  difficulty TINYINT UNSIGNED NOT NULL,
  content_version VARCHAR(32) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_knowledge_nodes_type_difficulty (type, difficulty),
  KEY idx_knowledge_nodes_content_version (content_version),
  CONSTRAINT fk_knowledge_nodes_package FOREIGN KEY (package_id) REFERENCES content_packages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE knowledge_relations (
  id VARCHAR(36) NOT NULL,
  from_knowledge_id VARCHAR(36) NOT NULL,
  to_knowledge_id VARCHAR(36) NOT NULL,
  relation_type VARCHAR(32) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_knowledge_relations_pair (from_knowledge_id, to_knowledge_id, relation_type),
  KEY idx_knowledge_relations_to (to_knowledge_id),
  CONSTRAINT fk_knowledge_relations_from FOREIGN KEY (from_knowledge_id) REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  CONSTRAINT fk_knowledge_relations_to FOREIGN KEY (to_knowledge_id) REFERENCES knowledge_nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE question_bank (
  id VARCHAR(36) NOT NULL,
  package_id VARCHAR(36) NOT NULL,
  subject VARCHAR(16) NOT NULL,
  module VARCHAR(32) NOT NULL,
  prompt VARCHAR(500) NOT NULL,
  display JSON NOT NULL,
  choices JSON NULL,
  answer JSON NOT NULL,
  hint_levels JSON NOT NULL,
  difficulty TINYINT UNSIGNED NOT NULL,
  estimated_seconds SMALLINT UNSIGNED NOT NULL,
  content_version VARCHAR(32) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_question_bank_subject_module_difficulty (subject, module, difficulty),
  KEY idx_question_bank_content_version (content_version),
  CONSTRAINT fk_question_bank_package FOREIGN KEY (package_id) REFERENCES content_packages(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE question_knowledge_nodes (
  id VARCHAR(36) NOT NULL,
  question_id VARCHAR(36) NOT NULL,
  knowledge_id VARCHAR(36) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_question_knowledge_nodes_pair (question_id, knowledge_id),
  KEY idx_question_knowledge_nodes_knowledge (knowledge_id),
  CONSTRAINT fk_question_knowledge_nodes_question FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE CASCADE,
  CONSTRAINT fk_question_knowledge_nodes_knowledge FOREIGN KEY (knowledge_id) REFERENCES knowledge_nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE daily_plans (
  id VARCHAR(36) NOT NULL,
  child_id VARCHAR(36) NOT NULL,
  target_date DATE NOT NULL,
  total_minutes SMALLINT UNSIGNED NOT NULL,
  headline VARCHAR(128) NOT NULL,
  reason JSON NOT NULL,
  source VARCHAR(32) NOT NULL,
  generated_from JSON NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_daily_plans_child_date (child_id, target_date),
  CONSTRAINT fk_daily_plans_child FOREIGN KEY (child_id) REFERENCES child_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE daily_plan_tasks (
  id VARCHAR(36) NOT NULL,
  plan_id VARCHAR(36) NOT NULL,
  task_id VARCHAR(64) NOT NULL,
  type VARCHAR(16) NOT NULL,
  title VARCHAR(128) NOT NULL,
  description VARCHAR(255) NOT NULL,
  minutes SMALLINT UNSIGNED NOT NULL,
  progress SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  total SMALLINT UNSIGNED NOT NULL,
  knowledge_ids JSON NOT NULL,
  question_ids JSON NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'not_started',
  sort_order SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY idx_daily_plan_tasks_plan_order (plan_id, sort_order),
  KEY idx_daily_plan_tasks_task_id (task_id),
  CONSTRAINT fk_daily_plan_tasks_plan FOREIGN KEY (plan_id) REFERENCES daily_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE plan_overrides (
  id VARCHAR(36) NOT NULL,
  child_id VARCHAR(36) NOT NULL,
  target_date DATE NOT NULL,
  relaxed_mode BOOLEAN NULL,
  pause_new_knowledge BOOLEAN NULL,
  daily_minutes TINYINT UNSIGNED NULL,
  focus_knowledge_ids JSON NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  reason VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_plan_overrides_child_date_status (child_id, target_date, status),
  CONSTRAINT fk_plan_overrides_child FOREIGN KEY (child_id) REFERENCES child_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE learning_sessions (
  id VARCHAR(36) NOT NULL,
  child_id VARCHAR(36) NOT NULL,
  mode VARCHAR(16) NOT NULL,
  task_id VARCHAR(64) NULL,
  plan_id VARCHAR(36) NULL,
  subject VARCHAR(16) NULL,
  started_at DATETIME(3) NOT NULL,
  ended_at DATETIME(3) NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'active',
  device_info JSON NULL,
  PRIMARY KEY (id),
  KEY idx_learning_sessions_child_started (child_id, started_at),
  KEY idx_learning_sessions_status (status),
  KEY idx_learning_sessions_plan (plan_id),
  CONSTRAINT fk_learning_sessions_child FOREIGN KEY (child_id) REFERENCES child_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_learning_sessions_plan FOREIGN KEY (plan_id) REFERENCES daily_plans(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE learning_events (
  id VARCHAR(36) NOT NULL,
  client_event_id VARCHAR(64) NOT NULL,
  child_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  plan_id VARCHAR(36) NULL,
  task_id VARCHAR(64) NULL,
  question_id VARCHAR(36) NULL,
  event_type VARCHAR(32) NOT NULL,
  knowledge_ids JSON NOT NULL,
  payload JSON NOT NULL,
  created_at DATETIME(3) NOT NULL,
  server_received_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_learning_events_client_event_id (client_event_id),
  KEY idx_learning_events_child_created (child_id, created_at),
  KEY idx_learning_events_session_created (session_id, created_at),
  KEY idx_learning_events_plan (plan_id),
  KEY idx_learning_events_question (question_id),
  CONSTRAINT fk_learning_events_child FOREIGN KEY (child_id) REFERENCES child_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_learning_events_session FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_learning_events_plan FOREIGN KEY (plan_id) REFERENCES daily_plans(id) ON DELETE SET NULL,
  CONSTRAINT fk_learning_events_question FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE question_attempts (
  id VARCHAR(36) NOT NULL,
  child_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36) NOT NULL,
  task_id VARCHAR(64) NOT NULL,
  question_id VARCHAR(36) NOT NULL,
  knowledge_ids JSON NOT NULL,
  selected_answer JSON NOT NULL,
  correct_answer JSON NOT NULL,
  is_correct BOOLEAN NOT NULL,
  duration_ms INT UNSIGNED NOT NULL,
  hint_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  attempt_index SMALLINT UNSIGNED NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_question_attempts_child_question_created (child_id, question_id, created_at),
  KEY idx_question_attempts_session (session_id),
  KEY idx_question_attempts_question (question_id),
  CONSTRAINT fk_question_attempts_child FOREIGN KEY (child_id) REFERENCES child_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_question_attempts_session FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_question_attempts_question FOREIGN KEY (question_id) REFERENCES question_bank(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE mastery_records (
  id VARCHAR(36) NOT NULL,
  child_id VARCHAR(36) NOT NULL,
  knowledge_id VARCHAR(36) NOT NULL,
  type VARCHAR(16) NOT NULL,
  mastery_score TINYINT UNSIGNED NOT NULL,
  exposure_count INT UNSIGNED NOT NULL DEFAULT 0,
  correct_count INT UNSIGNED NOT NULL DEFAULT 0,
  wrong_count INT UNSIGNED NOT NULL DEFAULT 0,
  hint_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_practiced_at DATETIME(3) NULL,
  weakness_tags JSON NOT NULL,
  updated_from_event_id VARCHAR(36) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_mastery_records_child_knowledge (child_id, knowledge_id),
  KEY idx_mastery_records_knowledge (knowledge_id),
  KEY idx_mastery_records_updated_event (updated_from_event_id),
  CONSTRAINT fk_mastery_records_child FOREIGN KEY (child_id) REFERENCES child_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_mastery_records_knowledge FOREIGN KEY (knowledge_id) REFERENCES knowledge_nodes(id) ON DELETE RESTRICT,
  CONSTRAINT fk_mastery_records_updated_event FOREIGN KEY (updated_from_event_id) REFERENCES learning_events(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE reports (
  id VARCHAR(36) NOT NULL,
  child_id VARCHAR(36) NOT NULL,
  report_date DATE NOT NULL,
  summary TEXT NOT NULL,
  strengths JSON NOT NULL,
  tomorrow_suggestion TEXT NOT NULL,
  stats JSON NOT NULL,
  generated_from JSON NOT NULL,
  generated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_reports_child_date (child_id, report_date),
  CONSTRAINT fk_reports_child FOREIGN KEY (child_id) REFERENCES child_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE report_weaknesses (
  id VARCHAR(36) NOT NULL,
  report_id VARCHAR(36) NOT NULL,
  knowledge_id VARCHAR(36) NOT NULL,
  title VARCHAR(128) NOT NULL,
  reason VARCHAR(500) NOT NULL,
  evidence_event_ids JSON NOT NULL,
  PRIMARY KEY (id),
  KEY idx_report_weaknesses_report (report_id),
  KEY idx_report_weaknesses_knowledge (knowledge_id),
  CONSTRAINT fk_report_weaknesses_report FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  CONSTRAINT fk_report_weaknesses_knowledge FOREIGN KEY (knowledge_id) REFERENCES knowledge_nodes(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
