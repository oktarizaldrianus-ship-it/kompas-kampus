// netlify/functions/get-responses.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
    const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
    admin.initializeApp({
        credential: admin.credential.cert(credentials)
    });
}
const db = admin.firestore();

exports.handler = async (event) => {
    // Cek password dari header
    const password = event.headers['x-admin-password'];
    if (password !== process.env.ADMIN_PASSWORD) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    try {
        const snapshot = await db.collection('responses')
            .orderBy('timestamp', 'desc')
            .get();
        
        const data = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        }));
        
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Error get-responses:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};