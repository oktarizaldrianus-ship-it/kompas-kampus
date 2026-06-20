// netlify/functions/save-test-score.js
const admin = require('firebase-admin');

// Inisialisasi Firebase Admin SDK
if (!admin.apps.length) {
    const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    admin.initializeApp({
        credential: admin.credential.cert(credentials)
    });
}
const db = admin.firestore();

exports.handler = async (event) => {
    // 1. Proteksi dengan password yang sama dengan dashboard
    const password = event.headers['x-admin-password'];
    if (password !== process.env.ADMIN_PASSWORD) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Unauthorized' })
        };
    }

    // 2. Hanya menerima metode POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // 3. Parsing data dari body request
        const data = JSON.parse(event.body);

        // 4. Validasi minimal: pastikan ada skor dan tipe tes
        if (data.score === undefined || !data.testType) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields: score, testType' })
            };
        }

        // 5. Simpan ke Firestore (koleksi: teacher_tests)
        const docRef = await db.collection('teacher_tests').add({
            teacherName: data.teacherName || 'Anonim',
            testType: data.testType, // 'pre' atau 'post'
            score: data.score,       // 0-100
            timestamp: data.timestamp || new Date().toISOString()
        });

        // 6. Kembalikan response sukses
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                id: docRef.id,
                message: 'Skor tes berhasil disimpan'
            })
        };

    } catch (error) {
        console.error('Error saving test score:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Gagal menyimpan skor tes: ' + error.message
            })
        };
    }
};
await db.collection('teacher_tests').add({
    teacherName: data.teacherName || 'Anonim',
    teacherSchool: data.teacherSchool || '',
    teacherWa: data.teacherWa || '',
    teacherGender: data.teacherGender || '',
    testType: data.testType,
    score: data.score,
    timestamp: data.timestamp || new Date().toISOString()
});
