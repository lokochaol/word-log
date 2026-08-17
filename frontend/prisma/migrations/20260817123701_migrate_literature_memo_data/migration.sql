-- Phase 2 of the literature-memo rearchitecture: data-only migration, no
-- schema changes. Copies every QuickNote's inline literature_* fields into
-- the new literature_memo table and points quick_note.literature_memo_id at
-- the result, then verifies row counts before this migration is allowed to
-- commit. The legacy columns are left in place — dropped only by the
-- following migration, once this one is known to have succeeded.
--
-- Dedup rule: rows sharing the same (owner_sub, zotero_key) with a non-null
-- zotero_key collapse into a single LiteratureMemo (oldest by created_at
-- wins as the representative citation/url/summary — mirrors the "reuse an
-- existing Zotero-linked memo" rule the app enforces going forward). Rows
-- with no zotero_key (manually entered, never deduped) each get their own
-- standalone LiteratureMemo row.

DO $$
DECLARE
  source_count integer;
  inserted_count integer;
  linked_count integer;
BEGIN
  SELECT count(*) INTO source_count FROM quick_note WHERE literature_citation IS NOT NULL;

  -- Zotero-linked groups: one LiteratureMemo per (owner_sub, zotero_key).
  WITH dedup AS (
    SELECT DISTINCT ON (owner_sub, literature_zotero_key)
      gen_random_uuid() AS new_id,
      owner_sub,
      literature_zotero_key AS zotero_key,
      literature_citation AS citation,
      literature_url AS url,
      literature_summary AS summary,
      created_at
    FROM quick_note
    WHERE literature_citation IS NOT NULL AND literature_zotero_key IS NOT NULL
    ORDER BY owner_sub, literature_zotero_key, created_at ASC
  ),
  ins AS (
    INSERT INTO literature_memo (id, owner_sub, zotero_key, citation, url, summary, created_at, updated_at)
    SELECT new_id, owner_sub, zotero_key, citation, url, summary, created_at, now()
    FROM dedup
    RETURNING id
  )
  UPDATE quick_note qn
  SET literature_memo_id = dedup.new_id
  FROM dedup
  WHERE qn.literature_citation IS NOT NULL
    AND qn.owner_sub = dedup.owner_sub
    AND qn.literature_zotero_key = dedup.zotero_key;

  -- Manual entries (no zotero_key): one standalone LiteratureMemo per row.
  WITH src AS (
    SELECT id AS quick_note_id, owner_sub, literature_citation AS citation, literature_url AS url,
           literature_summary AS summary, created_at, gen_random_uuid() AS new_id
    FROM quick_note
    WHERE literature_citation IS NOT NULL AND literature_zotero_key IS NULL
  ),
  ins AS (
    INSERT INTO literature_memo (id, owner_sub, zotero_key, citation, url, summary, created_at, updated_at)
    SELECT new_id, owner_sub, NULL, citation, url, summary, created_at, now()
    FROM src
    RETURNING id
  )
  UPDATE quick_note qn
  SET literature_memo_id = src.new_id
  FROM src
  WHERE qn.id = src.quick_note_id;

  SELECT count(*) INTO inserted_count FROM literature_memo;
  SELECT count(*) INTO linked_count FROM quick_note WHERE literature_citation IS NOT NULL AND literature_memo_id IS NOT NULL;

  IF linked_count <> source_count THEN
    RAISE EXCEPTION 'literature memo migration mismatch: % quick_note rows had a citation but only % were linked to a literature_memo', source_count, linked_count;
  END IF;

  RAISE NOTICE 'literature memo migration: % source quick_note rows with a citation -> % literature_memo rows created, % linked', source_count, inserted_count, linked_count;
END $$;
