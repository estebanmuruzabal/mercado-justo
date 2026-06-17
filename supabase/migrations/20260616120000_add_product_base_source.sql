-- Track provenance of Product Base registry rows (seed vs admin vs community).

ALTER TABLE public.product_base
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin'
  CHECK (source IN ('seed', 'community', 'admin'));

COMMENT ON COLUMN public.product_base.source IS
  'Origin: seed (generated taxonomy), admin (staff UI), community (future crowdsourcing).';

CREATE INDEX IF NOT EXISTS product_base_source_idx ON public.product_base (source);
