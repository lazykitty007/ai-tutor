INSERT INTO users (id, email, display_name, auth_provider)
VALUES ('user_seed_parent', 'parent@example.com', '小宇家长', 'password');

INSERT INTO user_credentials (user_id, password_hash, password_salt, password_algorithm)
VALUES (
  'user_seed_parent',
  '89a6c3ec876706c2a064dbf8610692153af42f6a948935ca2db892679022a59f2ec6b47257b82220aab857811ae6051bcbec79df1f6b0ca953515a0e1181b1e0',
  'seed_parent_salt_20260620',
  'scrypt-sha256-v1'
);

INSERT INTO child_profiles (
  id, user_id, nickname, age_band, stage, daily_minutes, goals, baseline, is_active
) VALUES (
  'child_seed',
  'user_seed_parent',
  '小宇',
  '5-6 岁',
  '幼小衔接',
  20,
  JSON_ARRAY('literacy', 'pinyin', 'math'),
  JSON_OBJECT('source', 'seed', 'level', 'early-bridge'),
  TRUE
);

INSERT INTO parent_preferences (
  child_id, gate_type, relaxed_mode_default, report_push_enabled, allow_new_knowledge, max_daily_minutes
) VALUES (
  'child_seed', 'hold_button', FALSE, TRUE, TRUE, 30
);

INSERT INTO content_packages (id, subject, version, title, description, is_active)
VALUES
  ('pkg_literacy_v1', 'literacy', 'v1', '幼小衔接识字包', '木字旁与常见独体字', TRUE),
  ('pkg_pinyin_v1', 'pinyin', 'v1', '拼音听说启蒙包', '声母 l/m 与基础听辨', TRUE),
  ('pkg_math_v1', 'math', 'v1', '数感启蒙包', '数量比较、点数和十格阵', TRUE);

INSERT INTO knowledge_nodes (
  id, package_id, type, title, meaning, pinyin, difficulty, content_version, enabled
) VALUES
  ('char-mu', 'pkg_literacy_v1', 'literacy', '木', '树木', 'mù', 1, 'v1', TRUE),
  ('char-lin', 'pkg_literacy_v1', 'literacy', '林', '树林', 'lín', 2, 'v1', TRUE),
  ('char-sen', 'pkg_literacy_v1', 'literacy', '森', '森林', 'sēn', 3, 'v1', TRUE),
  ('char-xiu', 'pkg_literacy_v1', 'literacy', '休', '休息', 'xiū', 4, 'v1', TRUE),
  ('char-ming', 'pkg_literacy_v1', 'literacy', '明', '明亮', 'míng', 3, 'v1', TRUE),
  ('pinyin-l', 'pkg_pinyin_v1', 'pinyin', 'l', '声母 l', NULL, 2, 'v1', TRUE),
  ('pinyin-m', 'pkg_pinyin_v1', 'pinyin', 'm', '声母 m', NULL, 2, 'v1', TRUE),
  ('math-compare', 'pkg_math_v1', 'math', '数量比较', '比较多少', NULL, 2, 'v1', TRUE),
  ('math-counting', 'pkg_math_v1', 'math', '点数', '一一对应地点数', NULL, 1, 'v1', TRUE),
  ('math-ten-frame', 'pkg_math_v1', 'math', '十格阵', '用十格阵快速看数量', NULL, 3, 'v1', TRUE);

INSERT INTO knowledge_relations (id, from_knowledge_id, to_knowledge_id, relation_type)
VALUES
  ('rel_lin_mu', 'char-lin', 'char-mu', 'prerequisite'),
  ('rel_sen_mu', 'char-sen', 'char-mu', 'prerequisite'),
  ('rel_sen_lin', 'char-sen', 'char-lin', 'prerequisite'),
  ('rel_xiu_mu', 'char-xiu', 'char-mu', 'related'),
  ('rel_compare_counting', 'math-compare', 'math-counting', 'prerequisite'),
  ('rel_ten_counting', 'math-ten-frame', 'math-counting', 'prerequisite');

INSERT INTO question_bank (
  id, package_id, subject, module, prompt, display, choices, answer, hint_levels,
  difficulty, estimated_seconds, content_version, enabled
) VALUES
  (
    'q_char_lintone', 'pkg_literacy_v1', 'literacy', 'char_shape',
    '选出和“林”结构相同的字',
    JSON_OBJECT('symbol', '林', 'visual', 'character'),
    JSON_ARRAY('从', '双', '日'),
    JSON_OBJECT('value', '双'),
    JSON_ARRAY('看看这个字是不是由两个一样的部分组成。', '林是两个木，双也是左右两个一样的部分。'),
    2, 20, 'v1', TRUE
  ),
  (
    'q_char_mu_meaning', 'pkg_literacy_v1', 'literacy', 'meaning_match',
    '“木”最接近下面哪个意思？',
    JSON_OBJECT('symbol', '木', 'visual', 'character'),
    JSON_ARRAY('树木', '太阳', '小河'),
    JSON_OBJECT('value', '树木'),
    JSON_ARRAY('想一想树干和树枝。'),
    1, 15, 'v1', TRUE
  ),
  (
    'q_char_sen_build', 'pkg_literacy_v1', 'literacy', 'char_structure',
    '三个“木”组成哪个字？',
    JSON_OBJECT('parts', JSON_ARRAY('木', '木', '木'), 'visual', 'composition'),
    JSON_ARRAY('林', '森', '明'),
    JSON_OBJECT('value', '森'),
    JSON_ARRAY('两个木是林，三个木更多。'),
    3, 25, 'v1', TRUE
  ),
  (
    'q_pinyin_l_sound', 'pkg_pinyin_v1', 'pinyin', 'sound_match',
    '听到 /l/ 时选择哪个声母？',
    JSON_OBJECT('audioKey', 'seed_l', 'visual', 'speaker'),
    JSON_ARRAY('l', 'm', 'b'),
    JSON_OBJECT('value', 'l'),
    JSON_ARRAY('舌尖轻轻顶住上牙龈。'),
    2, 20, 'v1', TRUE
  ),
  (
    'q_pinyin_m_sound', 'pkg_pinyin_v1', 'pinyin', 'sound_match',
    '听到 /m/ 时选择哪个声母？',
    JSON_OBJECT('audioKey', 'seed_m', 'visual', 'speaker'),
    JSON_ARRAY('n', 'm', 'l'),
    JSON_OBJECT('value', 'm'),
    JSON_ARRAY('发 m 时嘴唇先轻轻闭上。'),
    2, 20, 'v1', TRUE
  ),
  (
    'q_math_compare_7_5', 'pkg_math_v1', 'math', 'quantity_compare',
    '哪一边更多？',
    JSON_OBJECT('leftCount', 7, 'rightCount', 5, 'visual', 'counters', 'layout', 'pairable', 'showNumeralsInitially', false),
    JSON_ARRAY('左边更多', '右边更多', '一样多'),
    JSON_OBJECT('value', '左边更多'),
    JSON_ARRAY('一个一个点数，7 比 5 多。', '可以把左右圆片一一配对，左边会多出来。'),
    2, 25, 'v1', TRUE
  ),
  (
    'q_math_count_6', 'pkg_math_v1', 'math', 'counting',
    '图上一共有几个圆片？',
    JSON_OBJECT('count', 6, 'visual', 'counters'),
    JSON_ARRAY('5', '6', '8'),
    JSON_OBJECT('value', '6'),
    JSON_ARRAY('从左到右点数，每个圆片只数一次。'),
    1, 20, 'v1', TRUE
  ),
  (
    'q_math_ten_frame_8', 'pkg_math_v1', 'math', 'ten_frame',
    '十格阵里有几个点？',
    JSON_OBJECT('filled', 8, 'visual', 'ten_frame'),
    JSON_ARRAY('7', '8', '9'),
    JSON_OBJECT('value', '8'),
    JSON_ARRAY('上面一排 5 个，下面再数 3 个。'),
    3, 30, 'v1', TRUE
  );

INSERT INTO question_knowledge_nodes (id, question_id, knowledge_id)
VALUES
  ('qkn_lintone_lin', 'q_char_lintone', 'char-lin'),
  ('qkn_lintone_mu', 'q_char_lintone', 'char-mu'),
  ('qkn_mu_meaning', 'q_char_mu_meaning', 'char-mu'),
  ('qkn_sen_build', 'q_char_sen_build', 'char-sen'),
  ('qkn_pinyin_l', 'q_pinyin_l_sound', 'pinyin-l'),
  ('qkn_pinyin_m', 'q_pinyin_m_sound', 'pinyin-m'),
  ('qkn_compare', 'q_math_compare_7_5', 'math-compare'),
  ('qkn_counting', 'q_math_count_6', 'math-counting'),
  ('qkn_ten_frame', 'q_math_ten_frame_8', 'math-ten-frame');

INSERT INTO daily_plans (
  id, child_id, target_date, total_minutes, headline, reason, source, generated_from
) VALUES (
  'plan_seed_today',
  'child_seed',
  CURDATE(),
  20,
  '识字为主，数感巩固',
  JSON_ARRAY('最近字形混淆需要先复习', '听音选字表现稳定，可以保持节奏', '今日可加入少量新知识'),
  'seed',
  JSON_OBJECT('masterySnapshot', 'seed', 'overrideApplied', false)
);

INSERT INTO daily_plan_tasks (
  id, plan_id, task_id, type, title, description, minutes, progress, total,
  knowledge_ids, question_ids, status, sort_order
) VALUES
  (
    'plan_task_literacy', 'plan_seed_today', 'literacy-review', 'literacy',
    '先复习林、木、森', '观察字形，理解意思，能读会用。', 6, 6, 10,
    JSON_ARRAY('char-lin', 'char-mu', 'char-sen'),
    JSON_ARRAY('q_char_lintone', 'q_char_mu_meaning', 'q_char_sen_build'),
    'in_progress', 1
  ),
  (
    'plan_task_pinyin', 'plan_seed_today', 'pinyin-speaking', 'pinyin',
    '拼音与听说', '听辨 l / m，练发音，能听会说。', 4, 4, 10,
    JSON_ARRAY('pinyin-l', 'pinyin-m'),
    JSON_ARRAY('q_pinyin_l_sound', 'q_pinyin_m_sound'),
    'in_progress', 2
  ),
  (
    'plan_task_math', 'plan_seed_today', 'math-sense', 'math',
    '数感小游戏', '理解数量，比较多少，解决问题。', 4, 3, 10,
    JSON_ARRAY('math-compare', 'math-counting'),
    JSON_ARRAY('q_math_compare_7_5', 'q_math_count_6', 'q_math_ten_frame_8'),
    'in_progress', 3
  ),
  (
    'plan_task_new_words', 'plan_seed_today', 'new-words', 'literacy',
    '新字学习', '学习 1-2 个和木字旁相关的新字。', 6, 0, 10,
    JSON_ARRAY('char-xiu'),
    JSON_ARRAY('q_char_sen_build'),
    'not_started', 4
  );

INSERT INTO plan_overrides (
  id, child_id, target_date, relaxed_mode, pause_new_knowledge, daily_minutes, focus_knowledge_ids, status, reason
) VALUES (
  'override_seed_tomorrow',
  'child_seed',
  DATE_ADD(CURDATE(), INTERVAL 1 DAY),
  TRUE,
  TRUE,
  20,
  JSON_ARRAY('char-lin', 'char-sen'),
  'active',
  '周末轻松复习'
);

INSERT INTO learning_sessions (
  id, child_id, mode, task_id, plan_id, subject, started_at, ended_at, status, device_info
) VALUES (
  'sess_seed_today',
  'child_seed',
  'daily_task',
  'literacy-review',
  'plan_seed_today',
  'literacy',
  TIMESTAMP(CURDATE(), '09:00:00'),
  TIMESTAMP(CURDATE(), '09:18:00'),
  'completed',
  JSON_OBJECT('source', 'seed')
);

INSERT INTO learning_events (
  id, client_event_id, child_id, session_id, plan_id, task_id, question_id,
  event_type, knowledge_ids, payload, created_at
) VALUES
  (
    'evt_seed_start', 'client_evt_seed_start', 'child_seed', 'sess_seed_today',
    'plan_seed_today', 'literacy-review', NULL, 'task_started',
    JSON_ARRAY(), JSON_OBJECT('taskId', 'literacy-review'),
    TIMESTAMP(CURDATE(), '09:00:00')
  ),
  (
    'evt_seed_answer_1', 'client_evt_seed_answer_1', 'child_seed', 'sess_seed_today',
    'plan_seed_today', 'literacy-review', 'q_char_lintone', 'item_answered',
    JSON_ARRAY('char-lin', 'char-mu'),
    JSON_OBJECT('selectedAnswer', '双', 'correctAnswer', '双', 'isCorrect', true, 'durationMs', 8200, 'hintCount', 1, 'wrongStreak', 0),
    TIMESTAMP(CURDATE(), '09:05:00')
  ),
  (
    'evt_seed_answer_2', 'client_evt_seed_answer_2', 'child_seed', 'sess_seed_today',
    'plan_seed_today', 'math-sense', 'q_math_compare_7_5', 'item_answered',
    JSON_ARRAY('math-compare'),
    JSON_OBJECT('selectedAnswer', '左边更多', 'correctAnswer', '左边更多', 'isCorrect', true, 'durationMs', 7600, 'hintCount', 0, 'wrongStreak', 0),
    TIMESTAMP(CURDATE(), '09:12:00')
  ),
  (
    'evt_seed_completed', 'client_evt_seed_completed', 'child_seed', 'sess_seed_today',
    'plan_seed_today', 'literacy-review', NULL, 'task_completed',
    JSON_ARRAY('char-lin', 'char-mu', 'char-sen'),
    JSON_OBJECT('progress', 10, 'total', 10),
    TIMESTAMP(CURDATE(), '09:18:00')
  );

INSERT INTO question_attempts (
  id, child_id, session_id, task_id, question_id, knowledge_ids,
  selected_answer, correct_answer, is_correct, duration_ms, hint_count, attempt_index, created_at
) VALUES
  (
    'attempt_seed_1', 'child_seed', 'sess_seed_today', 'literacy-review', 'q_char_lintone',
    JSON_ARRAY('char-lin', 'char-mu'), JSON_OBJECT('value', '双'), JSON_OBJECT('value', '双'),
    TRUE, 8200, 1, 1, TIMESTAMP(CURDATE(), '09:05:00')
  ),
  (
    'attempt_seed_2', 'child_seed', 'sess_seed_today', 'math-sense', 'q_math_compare_7_5',
    JSON_ARRAY('math-compare'), JSON_OBJECT('value', '左边更多'), JSON_OBJECT('value', '左边更多'),
    TRUE, 7600, 0, 1, TIMESTAMP(CURDATE(), '09:12:00')
  );

INSERT INTO mastery_records (
  id, child_id, knowledge_id, type, mastery_score, exposure_count, correct_count,
  wrong_count, hint_count, last_practiced_at, weakness_tags, updated_from_event_id
) VALUES
  ('mastery_char_lin', 'child_seed', 'char-lin', 'literacy', 64, 8, 5, 3, 2, TIMESTAMP(CURDATE(), '09:05:00'), JSON_ARRAY('字形混淆'), 'evt_seed_answer_1'),
  ('mastery_char_mu', 'child_seed', 'char-mu', 'literacy', 82, 12, 10, 2, 1, DATE_SUB(TIMESTAMP(CURDATE(), '09:00:00'), INTERVAL 1 DAY), JSON_ARRAY(), 'evt_seed_answer_1'),
  ('mastery_char_sen', 'child_seed', 'char-sen', 'literacy', 58, 5, 3, 2, 3, DATE_SUB(TIMESTAMP(CURDATE(), '09:00:00'), INTERVAL 3 DAY), JSON_ARRAY('结构复杂'), NULL),
  ('mastery_pinyin_l', 'child_seed', 'pinyin-l', 'pinyin', 70, 6, 4, 2, 1, DATE_SUB(TIMESTAMP(CURDATE(), '09:00:00'), INTERVAL 2 DAY), JSON_ARRAY('听辨稍慢'), NULL),
  ('mastery_math_compare', 'child_seed', 'math-compare', 'math', 76, 10, 8, 2, 0, TIMESTAMP(CURDATE(), '09:12:00'), JSON_ARRAY(), 'evt_seed_answer_2');

INSERT INTO reports (
  id, child_id, report_date, summary, strengths, tomorrow_suggestion, stats, generated_from, generated_at
) VALUES (
  'report_seed_today',
  'child_seed',
  CURDATE(),
  '小宇今天完成 4 个任务，识字表现稳定。',
  JSON_ARRAY('听音选字完成较快', '能坚持完成 18 分钟学习', '数感比较题正确率稳定'),
  '明天建议先复习木字旁相关汉字，再安排少量新字。',
  JSON_OBJECT('totalMinutes', 18, 'completedTaskCount', 4, 'answeredCount', 12, 'correctRate', 0.86, 'hintCount', 2),
  JSON_OBJECT('planId', 'plan_seed_today', 'eventIds', JSON_ARRAY('evt_seed_answer_1', 'evt_seed_answer_2')),
  TIMESTAMP(CURDATE(), '10:00:00')
);

INSERT INTO report_weaknesses (
  id, report_id, knowledge_id, title, reason, evidence_event_ids
) VALUES
  (
    'weak_seed_literacy', 'report_seed_today', 'char-lin',
    '林 / 木', '字形混淆，需要继续通过部件观察巩固。',
    JSON_ARRAY('evt_seed_answer_1')
  ),
  (
    'weak_seed_structure', 'report_seed_today', 'char-sen',
    '森的结构', '三个木的结构复杂，容易和林混淆。',
    JSON_ARRAY('evt_seed_answer_1')
  );
