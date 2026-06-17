// netlify/functions/export-csv.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
    const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    admin.initializeApp({
        credential: admin.credential.cert(credentials)
    });
}
const db = admin.firestore();

exports.handler = async (event) => {
    // Proteksi dengan password yang sama dengan dashboard
    const password = event.headers['x-admin-password'];
    if (password !== process.env.ADMIN_PASSWORD) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    try {
        const snapshot = await db.collection('responses')
            .orderBy('timestamp', 'desc')
            .get();

        if (snapshot.empty) {
            return {
                statusCode: 404,
                body: 'Belum ada data responden.'
            };
        }

        const data = snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                nama: d.nama || '',
                sekolah: d.sekolah || '',
                wa: d.wa || '',
                kampusTujuan: d.kampusTujuan || '',
                q1: d.q1 || 0,
                q2: d.q2 || 0,
                q3: d.q3 || 0,
                q4: d.q4 || 0,
                q5: d.q5 || 0,
                q6: d.q6 || '',
                q7: d.q7 || '',
                q8: d.q8 || 0,
                attentionCheckPassed: d.attentionCheckPassed ? 'TRUE' : 'FALSE',
                pbc: d.pbc ? d.pbc.toFixed(2) : 0,
                sikap: d.sikap || 0,
                norma: d.norma || 0,
                niat: d.niat || 0,
                profileId: d.profileId || '',
                profileLabel: d.profileLabel || '',
                timestamp: d.timestamp || ''
            };
        });

        const headers = [
            'Nama','Sekolah','NoWA','KampusTujuan',
            'Q1_Sikap','Q2_Norma','Q3_Kemudahan','Q4_Hambatan','Q5_Niat',
            'Q6_BersediaDihubungi','Q7_BrandAwareness','Q8_AttentionCheck',
            'Lulus_AttentionCheck','Skor_PBC','Skor_Sikap','Skor_Norma','Skor_Niat',
            'Kode_Profil','Label_Profil','Waktu_Isi'
        ];

        const csvRows = [];
        csvRows.push(headers.join(','));

        data.forEach(row => {
            const values = [
                `"${row.nama}"`,
                `"${row.sekolah}"`,
                `"${row.wa}"`,
                `"${row.kampusTujuan}"`,
                row.q1, row.q2, row.q3, row.q4, row.q5,
                `"${row.q6}"`,
                `"${row.q7}"`,
                row.q8,
                row.attentionCheckPassed,
                row.pbc,
                row.sikap,
                row.norma,
                row.niat,
                `"${row.profileId}"`,
                `"${row.profileLabel}"`,
                `"${row.timestamp}"`
            ];
            csvRows.push(values.join(','));
        });

        const csvString = csvRows.join('\n');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="laporan_kompas_kampus.csv"'
            },
            body: csvString
        };
    } catch (error) {
        console.error('Error export-csv:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
