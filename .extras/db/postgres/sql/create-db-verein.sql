CREATE ROLE verein LOGIN PASSWORD 'p';
CREATE DATABASE verein;
GRANT ALL ON DATABASE verein TO verein;
CREATE TABLESPACE vereinspace OWNER verein LOCATION '/var/lib/postgresql/tablespace/verein';