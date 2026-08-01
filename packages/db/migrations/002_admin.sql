-- Moderation + agent-company approval queue (T2 packets)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  subject_kind TEXT NOT NULL CHECK (subject_kind IN ('post','reply','car','member')),
  subject_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','actioned','dismissed')),
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reports_open_idx ON reports(status, created_at);

-- T2 approval packets from the agent company (Chief of Staff routes here)
CREATE TABLE IF NOT EXISTS approval_packets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent TEXT NOT NULL,                -- e.g. community_scout, lifecycle_mailer
  kind TEXT NOT NULL,                 -- external_post | email_campaign | budget_change | other
  title TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  decided_by TEXT,
  decided_at TIMESTAMPTZ,
  decision_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS packets_pending_idx ON approval_packets(status, created_at);
