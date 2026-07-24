create table users(
    ID bigint generated always as identity primary key,
    name text not null,
    team text unique not null,
    role text not null,
    password text unique not null,
    created_at timestamptz not null default now()
);

insert into users(name, team, role, password) values('Admin','A','admin', 'GSXJ5cAYoMt6');


