CREATE SCHEMA IF NOT EXISTS AUTHORIZATION verein;

ALTER ROLE verein SET search_path = 'verein';

-- https://www.postgresql.org/docs/current/sql-createtable.html
-- https://www.postgresql.org/docs/current/datatype.html
CREATE TABLE IF NOT EXISTS verein (
    id   integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE vereinspace,
    version  integer NOT NULL DEFAULT 0,
    mitgliedsbeitrag    decimal(8,2) NOT NULL,
    name     varchar(40) NOT NULL,
    entstehungsdatum    date,
    homepage    varchar(40),
    erzeugt     timestamp NOT NULL DEFAULT NOW(),
    aktualisiert     timestamp NOT NULL DEFAULT NOW()
) TABLESPACE vereinspace;

CREATE TABLE IF NOT EXISTS adresse(
    id  integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE vereinspace,
    postleitzahl    varchar(5) NOT NULL,
    ort varchar(40),
    verein_id integer NOT NULL
) TABLESPACE vereinspace;
