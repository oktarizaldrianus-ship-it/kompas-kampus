// netlify/functions/save-response.js
const admin = require('firebase-admin');
const axios = require('axios');

// Inisialisasi Firestore (gunakan environment variable)
if (!admin.apps.length) {
    const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    admin.initializeApp({
        credential: admin.credential.cert(credentials)
    });
}
const db = admin.firestore();

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);
        
        // 1. Simpan ke Firestore
        const docRef = await db.collection('responses').add({
            ...data,
            timestamp: new Date().toISOString()
        });

        // 2. Jika bersedia dihubungi (q6 = Ya), kirim WA otomatis
        if (data.q6 === 'Ya') {
            const FONNTE_API_KEY = process.env.FONNTE_API_KEY;
            
            // Template pesan berdasarkan profil (santuy untuk siswa)
            const templateMap = {
                'SIAP_MELUNCUR': '🚀 Halo {nama}, kamu masuk kategori SIAP MELUNCUR! Langsung daftar aja, kami Guru BK bantu proses sampai dapat NIM. Buka dan klik web pendaftaran kampus favoritmu',
                'PEJUANG_POTENSIAL': '💰 Halo {nama}, semangatmu tinggi! Yuk cek info beasiswa KIP-K dan bantuan biaya di sini: [link-beasiswa]. Kami siap bantu berkas!',
                'PEJUANG_RESTU': '👨‍👩‍👧‍👦 Halo {nama}, kami siap bantu kamu meyakinkan orang tua. Cek brosur khusus untuk orang tua di WA ini. Yuk diskusi!',
                'PEMILIH_BERKUALITAS': '🔍 Halo {nama}, kamu teliti! Lihat fasilitas dan prestasi kampus kami di sini: [link-fasilitas]. Kami tunggu kamu!',
                'THE_DRIFTER': '🌊 Halo {nama}, masih eksplorasi? Kami akan kirimkan info menarik setiap minggu. Pantau terus WA-mu!'
            };
            
            let message = templateMap[data.profileId] || 'Terima kasih telah mengisi diagnosa. Tim kami akan menghubungi.';
            message = message.replace(/{nama}/g, data.nama);

            // Kirim via Fonnte
            const payload = {
                target: data.wa, // sudah diformat 62xxx
                message: message,
            };

            await axios.post('https://api.fonnte.com/send', payload, {
                headers: { Authorization: FONNTE_API_KEY }
            });
            
            console.log(`✅ WA otomatis terkirim ke ${data.wa}`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, id: docRef.id })
        };
    } catch (error) {
        console.error('Error save-response:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
