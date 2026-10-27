CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS monitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  interval_seconds integer NOT NULL DEFAULT 300 CHECK (interval_seconds >= 60),
  expected_status integer NOT NULL DEFAULT 200,
  timeout_ms integer NOT NULL DEFAULT 10000,
  consecutive_failures integer NOT NULL DEFAULT 0,
  next_check_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS monitors_due_idx ON monitors (next_check_at);

CREATE TABLE IF NOT EXISTS checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id uuid NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  ok boolean NOT NULL,
  status_code integer,
  response_time_ms integer,
  error_message text,
  checked_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS checks_monitor_time_idx ON checks (monitor_id, checked_at DESC);

CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id uuid NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  opened_at timestamptz NOT NULL DEFAULT now(),
  recovered_at timestamptz,
  failure_message text
);

CREATE UNIQUE INDEX IF NOT EXISTS one_open_incident_per_monitor
  ON incidents (monitor_id) WHERE recovered_at IS NULL;
