// functions/api/report.js
// Endpoint: GET /api/report?sekolah=... (dengan password)

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
        const url = new URL(request.url);
        const filterSekolah = url.searchParams.get('sekolah') || 'all';

        let query = supabase.from('responses').select('*');
        if (filterSekolah !== 'all') {
            query = query.eq('sekolah', filterSekolah);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Agregasi per sekolah
        const schoolMap = new Map();
        data.forEach(row => {
            const school = row.sekolah || 'Tidak diketahui';
            if (!schoolMap.has(school)) {
                schoolMap.set(school, {
                    total: 0,
                    profiles: { SIAP_MELUNCUR: 0, PEJUANG_POTENSIAL: 0, PEJUANG_RESTU: 0, PEMILIH_BERKUALITAS: 0, THE_DRIFTER: 0 },
                    bersedia: 0,
                    tidakBersedia: 0
                });
            }
            const entry = schoolMap.get(school);
            entry.total++;
            const prof = row.kode_profil || 'THE_DRIFTER';
            if (entry.profiles[prof] !== undefined) entry.profiles[prof]++;
            if (row.q6_bersediadihubungi === 'Ya') entry.bersedia++;
            else entry.tidakBersedia++;
        });

        const reportData = Array.from(schoolMap.entries()).map(([school, stats]) => ({
            sekolah: school,
            total: stats.total,
            profiles: stats.profiles,
            bersedia: stats.bersedia,
            tidakBersedia: stats.tidakBersedia
        }));

        return new Response(JSON.stringify(reportData), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}
