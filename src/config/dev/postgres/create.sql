-- Copyright (C) 2022 - present Juergen Zimmermann, Hochschule Karlsruhe
--
-- This program is free software: you can redistribute it and/or modify
-- it under the terms of the GNU General Public License as published by
-- the Free Software Foundation, either version 3 of the License, or
-- (at your option) any later version.
--
-- This program is distributed in the hope that it will be useful,
-- but WITHOUT ANY WARRANTY; without even the implied warranty of
-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
-- GNU General Public License for more details.
--
-- You should have received a copy of the GNU General Public License
-- along with this program.  If not, see <https://www.gnu.org/licenses/>.

-- docker compose exec postgres bash
-- psql --dbname=buch --username=buch --file=/scripts/create-table-buch.sql

-- https://www.postgresql.org/docs/devel/app-psql.html
-- https://www.postgresql.org/docs/current/ddl-schemas.html
-- https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-CREATE
-- "user-private schema" (Default-Schema: public)
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
    erzeugt     timestamp NOT NULL DEFUALT NOW(),
    aktualisiert     timestamp NOT NULL DEFAULT NOW()
) TABLESPACE vereinspace;

CREATE TABLE IF NOT EXISTS adresse(
    id  integer GENERATED ALWAYS AS IDENTITY(START WITH 1000) PRIMARY KEY USING INDEX TABLESPACE vereinspace,
    postleitzahl    varchar(5) NOT NULL,
    ort varchar(40)
) TABLESPACE vereinspace;