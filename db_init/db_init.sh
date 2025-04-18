#!/bin/sh
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE "engine" LOGIN PASSWORD 'engine' NOINHERIT;
    GRANT CREATE ON DATABASE "engine" TO "engine";
    --
    CREATE ROLE "read_model" LOGIN PASSWORD 'read_model_pwd' NOINHERIT;
    GRANT CONNECT ON DATABASE "engine" TO "read_model";
    --
    CREATE ROLE "history" LOGIN PASSWORD 'history_pwd' NOINHERIT;
    GRANT CREATE ON DATABASE "engine" TO "history";
EOSQL