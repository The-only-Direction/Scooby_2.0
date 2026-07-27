import {supabase} from '@/lib/supabase';

export async function POST(request){
    const {vendor_id,link}=await request.json();
    const {error}= await supabase.from('assignments').insert({vendor_id,link});
    if(error){
        return Response.json({success:false, error:error.message},{status:500})
    
    } return Response.json({success:true});
}

export async function GET(){
    const {data,error}=await supabase.from('assignments').select('*');
    if (error){
        return Response.json({assignments:[]});
    }
    return Response.json({assignments:data});
}