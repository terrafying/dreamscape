-- Dream Matching & Synchronicity feature
-- Depends on: 001_create_user_dreams.sql, 003_growth_schema.sql

-- ═══ Tables ═══

CREATE TABLE IF NOT EXISTS dream_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol_name TEXT NOT NULL,
  match_date DATE NOT NULL,
  dreamer_ids UUID[] NOT NULL,
  dreamer_count INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (symbol_name, match_date)
);

CREATE TABLE IF NOT EXISTS match_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES dream_matches(id) ON DELETE CASCADE,
  symbol_name TEXT NOT NULL,
  matched_dreamer_ids UUID[] NOT NULL,
  matched_count INT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══ Indexes ═══

CREATE INDEX idx_dream_matches_date ON dream_matches(match_date DESC);
CREATE INDEX idx_dream_matches_symbol ON dream_matches(symbol_name);
CREATE INDEX idx_dream_matches_dreamers ON dream_matches USING GIN (dreamer_ids);
CREATE INDEX idx_match_notifications_user ON match_notifications(user_id, created_at DESC);
CREATE INDEX idx_match_notifications_read ON match_notifications(user_id, read);

-- ═══ RLS Policies ═══

ALTER TABLE dream_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_notifications ENABLE ROW LEVEL SECURITY;

-- Dream matches are public (anyone can view)
CREATE POLICY "dream_matches_select_public" ON dream_matches
  FOR SELECT USING (true);

-- Match notifications are private (users can only see their own)
CREATE POLICY "match_notifications_select_own" ON match_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "match_notifications_insert_own" ON match_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "match_notifications_update_own" ON match_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ═══ Functions ═══

-- Function to find and create dream matches
CREATE OR REPLACE FUNCTION find_dream_matches(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  symbol_name TEXT,
  dreamer_count INT,
  dreamer_ids UUID[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.name as symbol_name,
    COUNT(DISTINCT d.user_id)::INT as dreamer_count,
    ARRAY_AGG(DISTINCT d.user_id) as dreamer_ids
  FROM dreams d
  JOIN dream_extractions de ON d.id = de.dream_id
  JOIN jsonb_to_recordset(de.symbols) AS s(name TEXT, relevance FLOAT) ON true
  WHERE DATE(d.created_at) = target_date
  GROUP BY s.name
  HAVING COUNT(DISTINCT d.user_id) >= 2
  ORDER BY COUNT(DISTINCT d.user_id) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to create match notifications for all matched dreamers
CREATE OR REPLACE FUNCTION create_match_notifications(
  p_match_id UUID,
  p_symbol_name TEXT,
  p_dreamer_ids UUID[]
)
RETURNS void AS $$
DECLARE
  v_dreamer_id UUID;
BEGIN
  FOREACH v_dreamer_id IN ARRAY p_dreamer_ids
  LOOP
    INSERT INTO match_notifications (user_id, match_id, symbol_name, matched_dreamer_ids, matched_count)
    VALUES (
      v_dreamer_id,
      p_match_id,
      p_symbol_name,
      ARRAY_REMOVE(p_dreamer_ids, v_dreamer_id), -- Other dreamers (not self)
      ARRAY_LENGTH(ARRAY_REMOVE(p_dreamer_ids, v_dreamer_id), 1)
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
