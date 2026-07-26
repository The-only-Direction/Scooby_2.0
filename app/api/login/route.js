import {supabase} from '@/lib/supabase';
export async function POST(request){
    const {password} = await request.json();
    const {data,error} = await supabase
    .from('users')
    .select('id, name, team, role')
    .eq('password',password)
    .single();
    if (error||!data){
        return Response.json({'success':false}, {'status':401});
    }
    return Response.json({'success':true,'user':data});
}