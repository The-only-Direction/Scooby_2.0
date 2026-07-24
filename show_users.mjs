import {createClient} from '@supabase/supabase-js';
const supabase=createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);
const {data,error}=await supabase
.from('users')
.select('id, name, team, role, password');
console.log(error ?? data);

