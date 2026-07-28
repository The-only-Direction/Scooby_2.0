import { supabase } from "@/lib/supabase";

export async function POST(request){
    const formData = await request.formData();
    const file = formData.get('file');
    const assignmentId = formData.get('assignmentId');

    const filePath = `assignment-${assignmentId}-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
        .from('enriched')
        .upload(filePath, file, { upsert: true });
    if (uploadError) {
        return Response.json({ success: false, error: uploadError.message }, { status: 500 });
    }

    const { data } = supabase.storage.from('enriched').getPublicUrl(filePath);

    const { error } = await supabase.from('assignments')
        .update({ file_url: data.publicUrl, status: 'completed' })
        .eq('id', assignmentId);
    if (error) {
        return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, fileUrl: data.publicUrl });
}