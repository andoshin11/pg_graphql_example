create role anon;
create extension if not exists "uuid-ossp";
create extension if not exists pg_graphql cascade;


grant usage on schema public to postgres, anon;
alter default privileges in schema public grant all on tables to postgres, anon;
alter default privileges in schema public grant all on functions to postgres, anon;
alter default privileges in schema public grant all on sequences to postgres, anon;

grant usage on schema gql to postgres, anon;
grant all on function gql.resolve to postgres, anon;

alter default privileges in schema gql grant all on tables to postgres, anon;
alter default privileges in schema gql grant all on functions to postgres, anon;
alter default privileges in schema gql grant all on sequences to postgres, anon;


-- GraphQL Entrypoint
create function graphql("operationName" text default null, query text default null, variables jsonb default null)
    returns jsonb
    language sql
as $$
    select gql.resolve(query, variables);
$$;
