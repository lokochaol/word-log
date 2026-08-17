-- Phase 3 of the literature-memo rearchitecture: drop the legacy inline
-- columns now that every QuickNote's literature data has been copied into
-- literature_memo and verified by the previous data-migration.
ALTER TABLE "quick_note" DROP COLUMN "literature_citation";
ALTER TABLE "quick_note" DROP COLUMN "literature_url";
ALTER TABLE "quick_note" DROP COLUMN "literature_zotero_key";
ALTER TABLE "quick_note" DROP COLUMN "literature_summary";
