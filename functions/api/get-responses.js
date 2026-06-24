// functions/api/get-responses.js
// Endpoint: GET /api/get-responses (dengan password)

import { createClient } from '@supabase/supabase-js';

export async function onRequest(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'x-admin-password',
    };

    const password = request.headers.get('x-admin-password');
    if (password !== env.ADMIN_PASSWORD) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
    }

    try {
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
        const { data, error } = await supabase
            .from('responses')
            .select('*')
            .order('timestamp', { ascending: false });

        if (error) throw error;

        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}
