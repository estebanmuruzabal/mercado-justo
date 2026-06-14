-- Additive indexes for publication_relation graph traversals and future Discovery queries.

CREATE INDEX IF NOT EXISTS publication_relation_source_id_idx
  ON public.publication_relation(source_publication_id);

CREATE INDEX IF NOT EXISTS publication_relation_target_id_idx
  ON public.publication_relation(target_publication_id);

-- Future Discovery queries: WHERE relation_type = 'uses' | 'hosted_at' | ...
CREATE INDEX IF NOT EXISTS publication_relation_type_idx
  ON public.publication_relation(relation_type);

COMMENT ON TABLE public.publication_relation IS
  'Graph edges between publications. Duplicates prevented by UNIQUE (source, target, relation_type).';
