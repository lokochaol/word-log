-- Backfills QuickNote.content / PermanentNote.content from the existing
-- QuickNoteBlock / PermanentNoteBlock rows before those tables are dropped
-- (see the next migration). CODE blocks become ```lang fences, MERMAID
-- blocks become ```mermaid fences, IMAGE blocks become ![caption](url)
-- markdown image syntax, and TEXT blocks pass through as-is — matching what
-- MarkdownNoteEditor.tsx / src/lib/embeddedContent.ts parse back out.
UPDATE quick_note qn
SET content = sub.content
FROM (
  SELECT
    qb.quick_note_id,
    string_agg(
      CASE qb.block_type
        WHEN 'CODE' THEN '```' || COALESCE(qb.language, '') || E'\n' || qb.content || E'\n```'
        WHEN 'MERMAID' THEN '```mermaid' || E'\n' || qb.content || E'\n```'
        WHEN 'IMAGE' THEN '![' || COALESCE(qb.caption, '') || '](' || qb.content || ')'
        ELSE qb.content
      END,
      E'\n\n' ORDER BY qb.position
    ) AS content
  FROM quick_note_block qb
  GROUP BY qb.quick_note_id
) sub
WHERE qn.id = sub.quick_note_id;

UPDATE permanent_note pn
SET content = sub.content
FROM (
  SELECT
    pb.permanent_note_id,
    string_agg(
      CASE pb.block_type
        WHEN 'CODE' THEN '```' || COALESCE(pb.language, '') || E'\n' || pb.content || E'\n```'
        WHEN 'MERMAID' THEN '```mermaid' || E'\n' || pb.content || E'\n```'
        WHEN 'IMAGE' THEN '![' || COALESCE(pb.caption, '') || '](' || pb.content || ')'
        ELSE pb.content
      END,
      E'\n\n' ORDER BY pb.position
    ) AS content
  FROM permanent_note_block pb
  GROUP BY pb.permanent_note_id
) sub
WHERE pn.id = sub.permanent_note_id;
