// functions/api/save-response.js
// Endpoint: POST /api/save-response

export async function onRequest(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const data = await request.json();

        // Validasi
        if (!data.nama || !data.wa) {
            return new Response(JSON.stringify({ error: 'Nama dan WA wajib diisi' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Simpan ke Supabase
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);
        const { error } = await supabase
            .from('responses')
            .insert([{
                nama: data.nama,
                sekolah: data.sekolah,
                wa: data.wa,
                kampus_tujuan: data.kampusTujuan,
                q1_sikap: data.q1,
                q2_norma: data.q2,
                q3_kemudahan: data.q3,
                q4_hambatan: data.q4,
                q5_niat: data.q5,
                q6_bersediadihubungi: data.q6,
                q7_brand_awareness: data.q7,
                q8_attention_check: data.q8,
                attention_check_passed: data.attentionCheckPassed,
                skor_pbc: data.pbc,
                skor_sikap: data.sikap,
                skor_norma: data.norma,
                skor_niat: data.niat,
                kode_profil: data.profileId,
                label_profil: data.profileLabel,
                timestamp: new Date().toISOString()
            }]);

        if (error) throw error;

        // Kirim WA otomatis jika bersedia
        if (data.q6 === 'Ya') {
            const templateMap = {
                'SIAP_MELUNCUR': `🚀 Halo {nama}, kamu masuk kategori SIAP MELUNCUR! Langsung daftar, kami bantu proses.`,
                'PEJUANG_POTENSIAL': `💰 Halo {nama}, semangatmu tinggi! Yuk cek info beasiswa KIP-K.`,
                'PEJUANG_RESTU': `👨‍👩‍👧 Halo {nama}, kami siap bantu kamu meyakinkan orang tua.`,
                'PEMILIH_BERKUALITAS': `🔍 Halo {nama}, kamu teliti! Lihat fasilitas dan prestasi kampus.`,
                'THE_DRIFTER': `🌊 Halo {nama}, masih eksplorasi? Kami kirim info menarik setiap minggu.`
            };
            const message = (templateMap[data.profileId] || 'Terima kasih telah mengisi diagnosa.')
                .replace(/{nama}/g, data.nama);
            
            await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                headers: {
                    'Authorization': env.FONNTE_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ target: data.wa, message })
            });
        }

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
