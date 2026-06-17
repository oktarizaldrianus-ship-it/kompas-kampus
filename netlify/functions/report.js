// netlify/functions/report.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
    const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    admin.initializeApp({
        credential: admin.credential.cert(credentials)
    });
}
const db = admin.firestore();

exports.handler = async (event) => {
    // Proteksi dengan password
    const password = event.headers['x-admin-password'];
    if (password !== process.env.ADMIN_PASSWORD) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    try {
        // Ambil semua data
        const snapshot = await db.collection('responses').get();
        if (snapshot.empty) {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Belum ada data', data: [] })
            };
        }

        const docs = snapshot.docs.map(doc => doc.data());

        // --- Agregasi per sekolah ---
        const schoolMap = new Map();

        docs.forEach(d => {
            const school = d.sekolah || 'Tidak diketahui';
            if (!schoolMap.has(school)) {
                schoolMap.set(school, {
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

            const entry = schoolMap.get(school);
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

        // Ubah Map ke array untuk frontend
        const reportData = Array.from(schoolMap.entries()).map(([school, stats]) => ({
            sekolah: school,
            total: stats.total,
            profiles: stats.profiles,
            attentionPassed: stats.attentionPassed,
            attentionFailed: stats.attentionFailed,
            bersedia: stats.bersedia,
            tidakBersedia: stats.tidakBersedia
        }));

        // Urutkan berdasarkan total terbanyak
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
