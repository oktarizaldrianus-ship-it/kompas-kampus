// netlify/functions/report.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
    const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    admin.initializeApp({
        credential: admin.credential.cert(credentials)
    });
}
const db = admin.firestore();

// ----- FUNGSI NORMALISASI NAMA SEKOLAH -----
function normalizeSchool(name) {
    if (!name) return 'tidak diketahui';
    return name
        .trim()                          // hapus spasi di awal/akhir
        .replace(/\s+/g, ' ')            // ganti banyak spasi jadi satu
        .toLowerCase();                  // ubah jadi huruf kecil semua
}

exports.handler = async (event) => {
    // Proteksi dengan password
    const password = event.headers['x-admin-password'];
    if (password !== process.env.ADMIN_PASSWORD) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    try {
        // Ambil parameter filter sekolah dari query string
        const { sekolah } = event.queryStringParameters || {};
        
        let query = db.collection('responses');
        
        // Jika ada filter sekolah dan bukan 'all', terapkan filter (tetapi filter harus pakai data mentah, tidak dinormalisasi)
        if (sekolah && sekolah !== 'all' && sekolah !== 'undefined') {
            // Note: filter di Firestore tetap case-sensitive, tapi karena kita grouping nanti, 
            // kita filter sesuai apa yang dipilih user di dropdown.
            query = query.where('sekolah', '==', sekolah);
        }
        
        const snapshot = await query.get();
        
        if (snapshot.empty) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Belum ada data', data: [] })
            };
        }

        const docs = snapshot.docs.map(doc => doc.data());

        // --- Agregasi dengan Normalisasi ---
        const schoolMap = new Map();

        docs.forEach(d => {
            const rawName = d.sekolah || 'Tidak diketahui';
            const normalizedKey = normalizeSchool(rawName);
            
            if (!schoolMap.has(normalizedKey)) {
                schoolMap.set(normalizedKey, {
                    original: rawName, // simpan nama asli pertama kali muncul
                    total: 0,
                    profiles: {
                        SIAP_MELUNCUR: 0,
                        PEJUANG_POTENSIAL: 0,
                        PEJUANG_RESTU: 0,
                        PEMILIH_BERKUALITAS: 0,
                        THE_DRIFTER: 0
                    },
                    attentionPassed: 0,
                    attentionFailed: 0,
                    bersedia: 0,
                    tidakBersedia: 0
                });
            }

            const entry = schoolMap.get(normalizedKey);
            entry.total++;

            // Profil
            const prof = d.profileId || 'THE_DRIFTER';
            if (entry.profiles[prof] !== undefined) entry.profiles[prof]++;

            // Attention Check
            if (d.attentionCheckPassed === true) entry.attentionPassed++;
            else if (d.attentionCheckPassed === false) entry.attentionFailed++;
            // Jika tidak ada nilai, diabaikan

            // Kesediaan
            if (d.q6 === 'Ya') entry.bersedia++;
            else if (d.q6 === 'Tidak') entry.tidakBersedia++;
        });

        // Ubah Map ke array untuk frontend, gunakan 'original' sebagai nama tampilan
        const reportData = Array.from(schoolMap.entries()).map(([key, stats]) => ({
            sekolah: stats.original,  // tampilkan nama asli yang pertama kali muncul
            total: stats.total,
            profiles: stats.profiles,
            attentionPassed: stats.attentionPassed,
            attentionFailed: stats.attentionFailed,
            bersedia: stats.bersedia,
            tidakBersedia: stats.tidakBersedia
        }));

        // Urutkan berdasarkan total terbanyak (descending)
        reportData.sort((a, b) => b.total - a.total);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reportData)
        };
    } catch (error) {
        console.error('Error report:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
