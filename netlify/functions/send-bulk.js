// netlify/functions/send-bulk.js
const axios = require('axios');

exports.handler = async (event) => {
    // Cek password
    const password = event.headers['x-admin-password'];
    if (password !== process.env.ADMIN_PASSWORD) {
        return { statusCode: 401, body: 'Unauthorized' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { students, message, schedule } = JSON.parse(event.body);
        
        if (!students || students.length === 0) {
            return { statusCode: 400, body: 'No students selected' };
        }

        const FONNTE_API_KEY = process.env.FONNTE_API_KEY;
        let sentCount = 0;

        // Loop satu-satu untuk personalisasi pesan (ganti {nama})
        for (const student of students) {
            let personalMsg = message.replace(/{nama}/g, student.nama);
            
            await axios.post('https://api.fonnte.com/send', {
                target: student.wa,
                message: personalMsg,
                schedule: schedule || null // jika ada jadwal, kirim nanti
            }, {
                headers: { Authorization: FONNTE_API_KEY }
            });
            
            sentCount++;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, sent: sentCount })
        };
    } catch (error) {
        console.error('Bulk send error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};