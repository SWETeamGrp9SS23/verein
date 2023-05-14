-- Revoke privileges
REVOKE ALL ON DATABASE verein FROM verein;

-- Drop tables and schema
DROP SCHEMA IF EXISTS verein CASCADE;

-- Drop tablespace
DROP TABLESPACE IF EXISTS vereinspace;

-- Drop database
DROP DATABASE IF EXISTS verein;

-- Drop role
DROP ROLE IF EXISTS verein;
