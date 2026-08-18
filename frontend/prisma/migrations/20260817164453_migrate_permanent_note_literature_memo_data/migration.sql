-- Copies each PermanentNote's single literature_memo_id into the new
-- many-to-many join table before that column is dropped by the next
-- migration. Verifies the row count before allowing this to commit —
-- mirrors the discipline used for the earlier QuickNote/PermanentNote and
-- literature_memo data migrations in this project.

DO $$
DECLARE
  source_count integer;
  linked_count integer;
BEGIN
  SELECT count(*) INTO source_count FROM permanent_note WHERE literature_memo_id IS NOT NULL;

  INSERT INTO permanent_note_literature_memo (id, permanent_note_id, literature_memo_id, created_at)
  SELECT gen_random_uuid(), id, literature_memo_id, now()
  FROM permanent_note
  WHERE literature_memo_id IS NOT NULL;

  SELECT count(*) INTO linked_count
  FROM permanent_note pn
  JOIN permanent_note_literature_memo j
    ON j.permanent_note_id = pn.id AND j.literature_memo_id = pn.literature_memo_id
  WHERE pn.literature_memo_id IS NOT NULL;

  IF linked_count <> source_count THEN
    RAISE EXCEPTION 'permanent_note literature_memo migration mismatch: % rows had literature_memo_id but only % were copied to the join table', source_count, linked_count;
  END IF;

  RAISE NOTICE 'permanent_note literature_memo migration: % rows copied to permanent_note_literature_memo', source_count;
END $$;
