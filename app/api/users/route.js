import {supabase} from '@/lib/supabase';
export async function GET(request){
    const {data,error}=await supabase
    .from('users')
    .select('id,name,team,username, role, password, created_at, last_login, status');
    if(error){
        return Response.json({users:[]});
    }
    return Response.json({users:data});
}
export async function POST(request){
    const{name} = await request.json();
    const username= name.trim().toLowerCase().replace(/\s+/g,'')+ Math.floor(Math.random()*1000);
    const password= Math.random().toString(36).slice(-8);
    const {count} = await supabase
    .from('users')
    .select('*', {count:'exact', head:true});
    const team= String.fromCharCode(65+count);
    const {error}= await supabase
    .from('users')
    .insert({name, team, username, role:'lead uploader', password});
    if (error){
        return Response.json({success:false, error:error.message},{status:500});
    }
    return Response.json({success:true});
}
export async function PATCH(request){
    const{id, ...updates}= await request.json();
    const{error}=await supabase
    .from('users')
    .update(updates)
    .eq('id',id);
    if(error){
        return Response.json({success: false, error:error.message},{status:500});
    }
    return Response.json({success:true});
}
