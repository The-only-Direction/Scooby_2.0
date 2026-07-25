import {supabase} from '@/lib/supabase';
export async function GET(request){
    const {data,error}=await supabase
    .from('users')
    .select('id,name,team,role, created_at, last_login, active');
    return Response.json({users:data});
}
export async function POST(request){
    const{name} = await request.json();
    const password= Math.random().toString(36).slice(-8);
    const {count} = await supabase
    .from('users')
    .select('*', {count:'exact', head:true});
    const team= String.fromCharCode(65+count);
    const {error}= await supabase
    .from('users')
    .insert({name, team, role:'lead uploader', password});
    if (error){
        return Response.json({success:false, error:error.message},{status:500});
    }
    return Response.json({success:true});
}

