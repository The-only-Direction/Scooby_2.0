create table assignments(
    id bigint generated always as identity primary key,
    vendor_id bigint references users(id), 
    link text not null,
    status text not null default 'pending',
    uploaded_at timestamptz not null default now()
);