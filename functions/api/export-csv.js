// functions/api/export-csv.js
// Endpoint: GET /api/export-csv (dengan password)

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
        if (!data || data.length === 0) {
            return new Response('Belum ada data', { status: 404, headers: corsHeaders });
        }

        const headers = [
            'Nama', 'Sekolah', 'NoWA', 'KampusTujuan',
            'Q1_Sikap', 'Q2_Norma', 'Q3_Kemudahan', 'Q4_Hambatan', 'Q5_Niat',
            'Q6_BersediaDihubungi', 'Q7_BrandAwareness', 'Q8_AttentionCheck',
            'Lulus_AttentionCheck', 'Skor_PBC', 'Skor_Sikap', 'Skor_Norma', 'Skor_Niat',
            'Kode_Profil', 'Label_Profil', 'Waktu_Isi'
        ];

        let csvRows = [headers.join(',')];
        data.forEach(row => {
            const values = [
                `"${row.nama || ''}"`,
                `"${row.sekolah || ''}"`,
                `"${row.wa || ''}"`,
                `"${row.kampus_tujuan || ''}"`,
                row.q1_sikap || 0,
                row.q2_norma || 0,
                row.q3_kemudahan || 0,
                row.q4_hambatan || 0,
                row.q5_niat || 0,
                `"${row.q6_bersediadihubungi || ''}"`,
                `"${row.q7_brand_awareness || ''}"`,
                row.q8_attention_check || 0,
                row.attention_check_passed ? 'TRUE' : 'FALSE',
                row.skor_pbc || 0,
                row.skor_sikap || 0,
                row.skor_norma || 0,
                row.skor_niat || 0,
                `"${row.kode_profil || ''}"`,
                `"${row.label_profil || ''}"`,
                `"${row.timestamp || ''}"`
            ];
            csvRows.push(values.join(','));
        });

        return new Response(csvRows.join('\n'), {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="laporan_kompas_kampus.csv"',
                ...corsHeaders
            }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
}
