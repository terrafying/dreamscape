-- Dream Alchemy & Collective Zeitgeist features
-- Depends on: 001_create_user_dreams.sql, 003_growth_schema.sql

-- ═══ Tables ═══

CREATE TABLE IF NOT EXISTS dream_fusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID NOT NULL REFERENCES dream_circles(id) ON DELETE CASCADE,
  user_id_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol_1 TEXT NOT NULL,
  symbol_2 TEXT NOT NULL,
  fusion_name TEXT NOT NULL,
  fusion_meaning TEXT NOT NULL,
  fusion_emoji TEXT NOT NULL,
  archetype TEXT NOT NULL,
  archetype_meaning TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (circle_id, user_id_1, user_id_2, symbol_1, symbol_2)
);

CREATE TABLE IF NOT EXISTS symbol_frequency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  count INT NOT NULL DEFAULT 1,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archetype TEXT,
  category TEXT,
  UNIQUE (symbol)
);

CREATE TABLE IF NOT EXISTS zeitgeist_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  top_symbols JSONB NOT NULL,
  trending_themes JSONB NOT NULL,
  astrological_context JSONB NOT NULL,
  total_dreams INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (snapshot_date)
);

-- ═══ Indexes ═══

CREATE INDEX idx_dream_fusions_circle ON dream_fusions(circle_id, created_at DESC);
CREATE INDEX idx_dream_fusions_users ON dream_fusions(user_id_1, user_id_2);
CREATE INDEX idx_symbol_frequency_count ON symbol_frequency(count DESC);
CREATE INDEX idx_symbol_frequency_symbol ON symbol_frequency(symbol);
CREATE INDEX idx_zeitgeist_snapshots_date ON zeitgeist_snapshots(snapshot_date DESC);

-- ═══ RLS ═══

ALTER TABLE dream_fusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE symbol_frequency ENABLE ROW LEVEL SECURITY;
ALTER TABLE zeitgeist_snapshots ENABLE ROW LEVEL SECURITY;

-- ═══ Policies ═══

CREATE POLICY "Circle members see fusions" ON dream_fusions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM circle_members WHERE circle_id = dream_fusions.circle_id AND user_id = auth.uid())
  );

CREATE POLICY "Circle members create fusions" ON dream_fusions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM circle_members WHERE circle_id = dream_fusions.circle_id AND user_id = auth.uid())
  );

CREATE POLICY "Symbol frequency readable by all authenticated users" ON symbol_frequency
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Zeitgeist snapshots readable by all authenticated users" ON zeitgeist_snapshots
  FOR SELECT USING (auth.uid() IS NOT NULL);
