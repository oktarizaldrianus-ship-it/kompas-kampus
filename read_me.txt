# 🧠 Behavioral Audit App - Decision Architecture for BK Teachers

Aplikasi ini adalah alat diagnosa kesiapan kuliah berbasis *Theory of Planned Behavior* (Ajzen, 1991) yang dikemas dalam web app sederhana. 
Siswa mengisi form, langsung mendapat profil + sains perilaku, dan (jika mengizinkan) menerima WA otomatis. Guru BK bisa memantau dashboard dan mengirim WA massal.

## 🚀 Deploy ke Netlify

1. Fork/clone repo ini.
2. Buat project di **Firebase Console** → Aktifkan **Firestore Database**.
3. Download **Service Account Key** (JSON) dari Firebase → Settings → Service Accounts → Generate New Private Key.
4. Dapatkan **API Key** dari [Fonnte](https://fonnte.com).
5. Di Netlify, hubungkan repo, lalu isi Environment Variables:
   - `FONNTE_API_KEY`
   - `FIREBASE_CREDENTIALS` (isi dengan isi file JSON utuh, jangan di-encode)
   - `ADMIN_PASSWORD` (password untuk masuk dashboard guru)
6. Deploy! Aplikasi akan live.

## 🔧 Penggunaan

- **Siswa**: Buka URL root (`/`). Isi form.
- **Guru**: Buka `/dashboard.html`. Masukkan password `ADMIN_PASSWORD`.