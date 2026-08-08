CREATE TABLE word_meaning_block (
    id         UUID PRIMARY KEY,
    word_id    UUID         NOT NULL REFERENCES word (id) ON DELETE CASCADE,
    position   INT          NOT NULL,
    block_type VARCHAR(20)  NOT NULL,
    content    TEXT         NOT NULL,
    language   VARCHAR(50),
    caption    VARCHAR(255)
);

CREATE INDEX idx_word_meaning_block_word_id ON word_meaning_block (word_id, position);
