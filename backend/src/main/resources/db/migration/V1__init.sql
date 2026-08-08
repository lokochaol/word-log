CREATE TABLE word (
    id             UUID PRIMARY KEY,
    owner_sub      VARCHAR(255)             NOT NULL,
    text           VARCHAR(255)             NOT NULL,
    meaning        TEXT,
    encountered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at     TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_word_owner_text UNIQUE (owner_sub, text)
);

CREATE INDEX idx_word_owner_encountered_at ON word (owner_sub, encountered_at);

CREATE TABLE word_relation (
    id           UUID PRIMARY KEY,
    word_id      UUID                     NOT NULL REFERENCES word (id) ON DELETE CASCADE,
    related_text VARCHAR(255)             NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_word_relation UNIQUE (word_id, related_text)
);

CREATE INDEX idx_word_relation_word_id ON word_relation (word_id);
