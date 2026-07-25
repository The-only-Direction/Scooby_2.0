alter table users 
add column active boolean default true, 
add column last_login timestamptz;