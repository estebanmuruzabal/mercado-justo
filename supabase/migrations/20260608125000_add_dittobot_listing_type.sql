ALTER TYPE public.listing_type ADD VALUE IF NOT EXISTS 'dittobot';

COMMENT ON TYPE public.listing_type IS
  'Canonical listing kind. DittoBots are identified only by listing_type = dittobot.';
