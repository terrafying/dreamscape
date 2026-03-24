-- Growth features: email preferences, notifications, dream circles, invites
-- Depends on: 001_create_user_dreams.sql, 002_social_schema.sql

-- ═══ Tables ═══

CREATE TABLE IF NOT EXISTS email_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_digest BOOLEAN NOT NULL DEFAULT TRUE,
  transit_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  new_follower BOOLEAN NOT NULL DEFAULT TRUE,
  dream_reaction BOOLEAN NOT NULL DEFAULT TRUE,
  circle_activity BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('transit_alert', 'weekly_digest', 'new_follower', 'dream_reaction', 'circle_invite', 'circle_dream')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dream_circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS circle_members (
  circle_id UUID NOT NULL REFERENCES dream_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS circle_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES dream_circles(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_by UUID REFERENCES auth.users(id),
  max_uses INT NOT NULL DEFAULT 1,
  use_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS circle_dreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES dream_circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dream_data JSONB NOT NULL,
  symbols TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (circle_id, user_id, created_at)
);

-- ═══ Indexes ═══

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read, created_at DESC);
CREATE INDEX idx_circle_members_user ON circle_members(user_id);
CREATE INDEX idx_circle_invites_code ON circle_invites(code);
CREATE INDEX idx_circle_dreams_circle ON circle_dreams(circle_id, created_at DESC);

-- ═══ RLS ═══

ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE dream_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_dreams ENABLE ROW LEVEL SECURITY;

-- ═══ Policies (all tables exist, safe to cross-reference) ═══

CREATE POLICY "Users manage own email preferences" ON email_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Circles visible to members" ON dream_circles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM circle_members WHERE circle_id = id AND user_id = auth.uid())
  );
CREATE POLICY "Creator manages circle" ON dream_circles
  FOR ALL USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Members see circle membership" ON circle_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM circle_members cm WHERE cm.circle_id = circle_members.circle_id AND cm.user_id = auth.uid())
  );
CREATE POLICY "Creators manage membership" ON circle_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM dream_circles WHERE id = circle_members.circle_id AND created_by = auth.uid())
  );

CREATE POLICY "Invite codes readable by anyone authenticated" ON circle_invites
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Circle members create invites" ON circle_invites
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM circle_members WHERE circle_id = circle_invites.circle_id AND user_id = auth.uid())
  );

CREATE POLICY "Circle members see circle dreams" ON circle_dreams
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM circle_members WHERE circle_id = circle_dreams.circle_id AND user_id = auth.uid())
  );
CREATE POLICY "Members share to their circles" ON circle_dreams
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM circle_members WHERE circle_id = circle_dreams.circle_id AND user_id = auth.uid())
  );
