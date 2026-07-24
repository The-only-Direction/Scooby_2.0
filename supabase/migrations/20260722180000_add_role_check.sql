alter table users 
add constraint role_check check (role in ('admin','lead uploader'));