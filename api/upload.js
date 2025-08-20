// promo-hub/api/upload.js
import { IncomingForm } from 'formidable';
import cloudinary from 'cloudinary';

// =============================================================
// KONFIGURASI CLOUDINARY
// Mengambil kredensial dari variabel lingkungan Vercel.
// =============================================================
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// =============================================================
// KONFIGURASI VERCEL
// Menonaktifkan bodyParser Vercel agar formidable dapat bekerja.
// =============================================================
export const config = {
  api: {
    bodyParser: false,
  },
};

// =============================================================
// FUNGSI BANTUAN
// Mem-parsing permintaan multipart/form-data menggunakan formidable.
// =============================================================
const parseMultipart = (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("Formidable parsing error:", err);
        return reject(err);
      }
      if (!files.file || !files.file[0]) {
        return reject(new Error("No file uploaded or file object is invalid."));
      }
      resolve(files.file[0]);
    });
  });
};

// =============================================================
// FUNGSI UTAMA (HANDLER)
// Logika utama untuk menangani permintaan unggahan file.
// =============================================================
export default async function handler(req, res) {
  // Tambahkan header CORS untuk mengizinkan permintaan dari origin lain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Tangani preflight request dari browser
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Pastikan permintaan menggunakan metode POST
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const uploadedFile = await parseMultipart(req);
    
    // Unggah file ke Cloudinary
    const result = await cloudinary.v2.uploader.upload(uploadedFile.filepath, {
      folder: 'promohub_banners', // Ubah ke folder yang sesuai
      resource_type: 'image'
    });
    
    // Kirim respons sukses dalam format JSON
    res.status(200).json({
      message: 'File berhasil diunggah',
      url: result.secure_url
    });
    
  } catch (error) {
    // Tangani dan kirim respons error dalam format JSON
    console.error('Error in Vercel Function:', error);
    res.status(500).json({
      message: 'Gagal mengunggah file. Silakan periksa log Vercel untuk detail.',
      error: error.message
    });
  }
}
