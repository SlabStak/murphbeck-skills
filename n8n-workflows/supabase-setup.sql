-- ============================================
-- SOCIAL MEDIA CONTENT PIPELINE - FULL SETUP
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- 1. BRANDS TABLE
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  voice_guidelines TEXT,
  tone TEXT,
  brand_colors JSONB,
  default_hashtags TEXT[],
  target_audience TEXT,
  approval_email TEXT,
  instagram_handle TEXT,
  linkedin_page TEXT,
  tiktok_handle TEXT,
  twitter_handle TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CONTENT DRAFTS TABLE
CREATE TABLE IF NOT EXISTS content_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT UNIQUE NOT NULL,
  brand_id UUID REFERENCES brands(id),
  platform TEXT NOT NULL,
  content_type TEXT NOT NULL,
  topic TEXT NOT NULL,
  content_idea JSONB,
  platform_content JSONB,
  status TEXT DEFAULT 'pending',
  workflow_stage TEXT DEFAULT 'ideation',
  priority TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  approval_internal JSONB DEFAULT '{"status": "pending", "reviewer": null, "date": null}',
  approval_client JSONB DEFAULT '{"status": "pending", "reviewer": null, "date": null}',
  notes TEXT
);

-- 3. CONTENT CALENDAR TABLE
CREATE TABLE IF NOT EXISTS content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id),
  content_draft_id UUID REFERENCES content_drafts(id),
  platform TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  status TEXT DEFAULT 'scheduled',
  published_at TIMESTAMPTZ,
  post_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ENGAGEMENT LOG TABLE
CREATE TABLE IF NOT EXISTS engagement_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES brands(id),
  platform TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  original_message TEXT,
  response_sent TEXT,
  sentiment TEXT,
  priority TEXT,
  handled_by TEXT,
  escalated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ============================================
-- SAMPLE BRANDS - READY TO USE
-- ============================================

-- Brand 1: MurphbeckTech (Tech/SaaS)
INSERT INTO brands (
  id, name, voice_guidelines, tone, brand_colors, default_hashtags,
  target_audience, approval_email, instagram_handle, linkedin_page, twitter_handle
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'MurphbeckTech',
  'Professional yet approachable. Use clear, jargon-free language. Be helpful and solution-oriented. Show expertise without being condescending.',
  'Confident, innovative, trustworthy',
  '{"primary": "#2563EB", "secondary": "#1E40AF", "accent": "#3B82F6"}',
  ARRAY['#TechInnovation', '#AI', '#Automation', '#SaaS', '#MurphbeckTech'],
  'Tech professionals, startup founders, and business owners looking for AI and automation solutions. Age 28-50.',
  'mike@murphbeck.com',
  '@murphbecktech',
  'murphbeck-tech',
  '@murphbecktech'
);

-- Brand 2: Mural Ride (Creative/Art)
INSERT INTO brands (
  id, name, voice_guidelines, tone, brand_colors, default_hashtags,
  target_audience, approval_email, instagram_handle, tiktok_handle
) VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'Mural Ride',
  'Creative, inspiring, and community-focused. Celebrate art and artists. Use vibrant, expressive language. Be inclusive and encouraging.',
  'Artistic, passionate, community-driven',
  '{"primary": "#EC4899", "secondary": "#8B5CF6", "accent": "#F59E0B"}',
  ARRAY['#StreetArt', '#Murals', '#ArtCommunity', '#MuralRide', '#UrbanArt'],
  'Art enthusiasts, street art lovers, urban explorers, creative professionals. Age 22-45.',
  'mike@muralride.com',
  '@muralride',
  '@muralride'
);

-- Brand 3: Licenr (Business/Licensing)
INSERT INTO brands (
  id, name, voice_guidelines, tone, brand_colors, default_hashtags,
  target_audience, approval_email, linkedin_page, twitter_handle
) VALUES (
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'Licenr',
  'Professional, authoritative, and clear. Focus on value and ROI. Use business language but remain accessible. Emphasize trust and compliance.',
  'Professional, reliable, expert',
  '{"primary": "#059669", "secondary": "#047857", "accent": "#10B981"}',
  ARRAY['#Licensing', '#IPManagement', '#Royalties', '#BusinessSolutions', '#Licenr'],
  'Business owners, licensing managers, IP professionals, content creators with licensable assets. Age 30-55.',
  'mike@licenr.com',
  'licenr',
  '@licenr'
);

-- Brand 4: StoreScorer (Retail/Analytics)
INSERT INTO brands (
  id, name, voice_guidelines, tone, brand_colors, default_hashtags,
  target_audience, approval_email, linkedin_page, instagram_handle
) VALUES (
  'd4e5f6a7-b8c9-0123-defa-456789012345',
  'StoreScorer',
  'Data-driven and insightful. Make analytics accessible and actionable. Be helpful and educational. Focus on results and improvements.',
  'Analytical, helpful, results-focused',
  '{"primary": "#7C3AED", "secondary": "#6D28D9", "accent": "#A78BFA"}',
  ARRAY['#RetailAnalytics', '#StorePerformance', '#RetailTech', '#StoreScorer', '#DataDriven'],
  'Retail store owners, operations managers, franchise owners, retail consultants. Age 32-55.',
  'mike@storescorer.com',
  'storescorer',
  '@storescorer'
);

-- Brand 5: AsherAI (AI/Personal)
INSERT INTO brands (
  id, name, voice_guidelines, tone, brand_colors, default_hashtags,
  target_audience, approval_email, instagram_handle, tiktok_handle, twitter_handle
) VALUES (
  'e5f6a7b8-c9d0-1234-efab-567890123456',
  'AsherAI',
  'Friendly, curious, and helpful. Speak like a knowledgeable friend. Be enthusiastic about AI possibilities. Make complex topics simple and fun.',
  'Friendly, curious, enthusiastic',
  '{"primary": "#F97316", "secondary": "#EA580C", "accent": "#FB923C"}',
  ARRAY['#AI', '#ArtificialIntelligence', '#AsherAI', '#AIAssistant', '#FutureOfAI'],
  'AI enthusiasts, early adopters, tech-curious individuals, professionals exploring AI tools. Age 25-45.',
  'mike@asherai.com',
  '@asherai',
  '@asherai',
  '@asherai'
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_content_drafts_brand ON content_drafts(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_drafts_status ON content_drafts(status);
CREATE INDEX IF NOT EXISTS idx_content_drafts_platform ON content_drafts(platform);
CREATE INDEX IF NOT EXISTS idx_content_calendar_brand ON content_calendar(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_calendar_date ON content_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_engagement_log_brand ON engagement_log(brand_id);

-- ============================================
-- ROW LEVEL SECURITY (Optional but recommended)
-- ============================================

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_log ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can restrict later)
CREATE POLICY "Allow all on brands" ON brands FOR ALL USING (true);
CREATE POLICY "Allow all on content_drafts" ON content_drafts FOR ALL USING (true);
CREATE POLICY "Allow all on content_calendar" ON content_calendar FOR ALL USING (true);
CREATE POLICY "Allow all on engagement_log" ON engagement_log FOR ALL USING (true);

-- ============================================
-- DONE! Your brands are ready:
--
-- MurphbeckTech: a1b2c3d4-e5f6-7890-abcd-ef1234567890
-- Mural Ride:    b2c3d4e5-f6a7-8901-bcde-f23456789012
-- Licenr:        c3d4e5f6-a7b8-9012-cdef-345678901234
-- StoreScorer:   d4e5f6a7-b8c9-0123-defa-456789012345
-- AsherAI:       e5f6a7b8-c9d0-1234-efab-567890123456
-- ============================================
