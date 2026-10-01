-- Event RSVPs (POST /api/rsvp). Run once against the production database.
CREATE TABLE IF NOT EXISTS event_rsvps (
    id          VARCHAR(36)  PRIMARY KEY,
    event_slug  VARCHAR(120) NOT NULL,
    event_name  VARCHAR(255) NOT NULL,
    event_date  VARCHAR(40),
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    major       VARCHAR(255),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_event_rsvps_event_email UNIQUE (event_slug, email)
);
CREATE INDEX IF NOT EXISTS ix_event_rsvps_event_slug ON event_rsvps (event_slug);
