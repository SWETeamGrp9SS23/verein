-- (0) Ornder Tabelspace Verein einfügen
-- (1) user "postgres" in docker-compose.yaml auskommentieren,
--     damit der PostgreSQL-Server implizit mit dem Linux-User "root" gestartet wird
-- (2) PowerShell:
--     cd <Verzeichnis-mit-docker-compose.yaml>
--     docker compose up postgres
-- (3) 2. PowerShell:
--     cd <Verzeichnis-mit-docker-compose.yaml>
--     docker compose exec postgres bash
--         chown postgres:postgres /var/lib/postgresql/tablespace
--         chown postgres:postgres /var/lib/postgresql/tablespace/verein
--         exit
--     docker compose down
-- (3) in docker-compose.yaml den User "postgres" wieder aktivieren, d.h. Kommentar entfernen
-- (4) 1. PowerShell:
--     docker compose up 
-- (5) 2. PowerShell:
--     docker compose exec postgres bash
--        psql --dbname=postgres --username=postgres --file=/sql/create-db-verein.sql
--        psql --dbname=verein --username=verein --file=/sql/create-schema-verein.sql
--        exit
--     docker compose down
CREATE ROLE verein LOGIN PASSWORD 'p';
CREATE DATABASE verein;
GRANT ALL ON DATABASE verein TO verein;
CREATE TABLESPACE vereinspace OWNER verein LOCATION '/var/lib/postgresql/tablespace/verein';