// functions/api/save-test-score.js
// Endpoint: POST /api/save-test-score (dengan password)

import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-password',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    const password = request.headers.get('x-admin-password');
    if (password !== env.ADMIN_PASSWORD) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    try {
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
        const data = await request.json();

        const { error } = await supabase
            .from('teacher_tests')
            .insert([{
                teacher_name: data.teacherName || 'Anonim',
                teacher_school: data.teacherSchool || '',
                teacher_wa: data.teacherWa || '',
                teacher_gender: data.teacherGender || '',
                test_type: data.testType,
                score: data.score,
                timestamp: data.timestamp || new Date().toISOString()
            }]);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}
