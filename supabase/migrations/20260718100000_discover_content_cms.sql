-- Discover & Content CMS foundation
-- Enables admin-managed content without app redeploys.

CREATE TYPE public.discover_content_type AS ENUM (
  'article',
  'video',
  'recipe',
  'success_story',
  'challenge',
  'daily_tip',
  'platform_update',
  'promotional'
);

CREATE TYPE public.discover_content_status AS ENUM (
  'draft',
  'scheduled',
  'published',
  'unpublished',
  'archived'
);

CREATE TYPE public.discover_access_level AS ENUM ('free', 'premium');

CREATE TABLE public.discover_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'heart',
  image_path TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  seo_title TEXT,
  seo_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.discover_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type public.discover_content_type NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_description TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  category_id UUID REFERENCES public.discover_categories(id) ON DELETE SET NULL,
  cover_image_path TEXT,
  author_name TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  publish_at TIMESTAMPTZ,
  featured BOOLEAN NOT NULL DEFAULT false,
  access_level public.discover_access_level NOT NULL DEFAULT 'free',
  status public.discover_content_status NOT NULL DEFAULT 'draft',
  language TEXT NOT NULL DEFAULT 'ar',
  reading_time_minutes INT,
  video_duration_seconds INT,
  video_source TEXT,
  view_count INT NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  sort_priority INT NOT NULL DEFAULT 0,
  type_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  seo_title TEXT,
  seo_description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT discover_content_reading_time_check CHECK (reading_time_minutes IS NULL OR reading_time_minutes > 0),
  CONSTRAINT discover_content_video_duration_check CHECK (video_duration_seconds IS NULL OR video_duration_seconds > 0)
);

CREATE TABLE public.discover_content_saves (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.discover_content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);

CREATE TABLE public.discover_content_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES public.discover_content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, content_id)
);

CREATE TABLE public.discover_success_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL UNIQUE REFERENCES public.discover_content(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  allowed_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  approved_text TEXT NOT NULL,
  approved_channels TEXT[] NOT NULL DEFAULT '{}'::text[],
  consent_version TEXT NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_discover_content_status_publish ON public.discover_content(status, publish_at DESC);
CREATE INDEX idx_discover_content_type ON public.discover_content(content_type);
CREATE INDEX idx_discover_content_category ON public.discover_content(category_id);
CREATE INDEX idx_discover_content_featured ON public.discover_content(featured) WHERE featured = true;
CREATE INDEX idx_discover_categories_sort ON public.discover_categories(sort_order);

CREATE TRIGGER trg_discover_categories_updated_at
  BEFORE UPDATE ON public.discover_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_discover_content_updated_at
  BEFORE UPDATE ON public.discover_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.discover_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discover_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discover_content_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discover_content_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discover_success_consents ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.discover_categories TO authenticated, anon;
GRANT SELECT ON public.discover_content TO authenticated, anon;
GRANT SELECT, INSERT, DELETE ON public.discover_content_saves TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.discover_content_likes TO authenticated;
GRANT SELECT ON public.discover_success_consents TO authenticated, anon;

GRANT ALL ON public.discover_categories TO authenticated;
GRANT ALL ON public.discover_content TO authenticated;
GRANT ALL ON public.discover_success_consents TO authenticated;

-- Public feed: published + scheduled past publish_at only
CREATE POLICY "discover_categories_public_read" ON public.discover_categories
  FOR SELECT TO authenticated, anon
  USING (status = 'active');

CREATE POLICY "discover_content_public_read" ON public.discover_content
  FOR SELECT TO authenticated, anon
  USING (
    status = 'published'
    OR (status = 'scheduled' AND publish_at IS NOT NULL AND publish_at <= now())
  );

CREATE POLICY "discover_content_admin_all" ON public.discover_content
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "discover_categories_admin_all" ON public.discover_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "discover_saves_own" ON public.discover_content_saves
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "discover_likes_own" ON public.discover_content_likes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "discover_consents_admin" ON public.discover_success_consents
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "discover_consents_public_read" ON public.discover_success_consents
  FOR SELECT TO authenticated, anon
  USING (withdrawn_at IS NULL);

COMMENT ON TABLE public.discover_content IS 'CMS-backed discover magazine content';
COMMENT ON COLUMN public.discover_content.type_payload IS 'Recipe, challenge, success story, and other type-specific fields';
