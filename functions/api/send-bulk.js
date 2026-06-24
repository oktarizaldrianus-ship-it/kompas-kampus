// functions/api/send-bulk.js
// Endpoint: POST /api/send-bulk

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
        const { students, message, schedule } = await request.json();

        if (!students || students.length === 0) {
            return new Response(JSON.stringify({ error: 'No students selected' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        let sentCount = 0;
        for (const student of students) {
            const personalMsg = message.replace(/{nama}/g, student.nama);
            await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                headers: {
                    'Authorization': env.FONNTE_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    target: student.wa,
                    message: personalMsg,
                    schedule: schedule || null
                })
            });
            sentCount++;
        }

        return new Response(JSON.stringify({ success: true, sent: sentCount }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}
