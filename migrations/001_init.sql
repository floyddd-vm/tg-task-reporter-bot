CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY,   
  user_name TEXT,
  login TEXT,
  full_name TEXT,
  current_step INT DEFAULT 0,
  data jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  users_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bitrix_id TEXT,
  location TEXT,
  address TEXT,
  remark_type TEXT,
  cargo_id TEXT,
  photo_base64 TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE INDEX IF NOT EXISTS idx_message_log_user_created_at
  ON tasks (users_id, created_at DESC);
