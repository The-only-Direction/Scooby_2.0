alter table users drop column active;
alter table users add column status text not null default 'inactive'
check(status in ('active','inactive','deactivated'));
