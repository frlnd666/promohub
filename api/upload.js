// promo-hub/api/upload.js
import { IncomingForm } from 'formidable';
import cloudinary from 'cloudinary';

// Ini PENTING: Menonaktifkan bodyParser bawaan Vercel untuk rute ini
export const config = {
  api: {
    bodyParser: false,
  },
};

// Konfigurasi Cloudinary dari environment variables
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Fungsi untuk mem-parsing request file
const parseMultipart = (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      // 'files.file' adalah nama field dari FormData di sisi client
      // formidable v3 mengembalikan array, jadi kita ambil elemen pertama
      if (files.file && files.file.length > 0) {
        resolve(files.file[0]);
      } else {
        reject(new Error('No file found in the request.'));
      }
    });
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  try {
    const uploadedFile = await parseMultipart(req);
    
    // Unggah file ke Cloudinary
    const result = await cloudinary.v2.uploader.upload(uploadedFile.filepath, {
      folder: 'promohub_uploads', // Anda bisa ganti nama folder
      resource_type: 'image'
    });
    
    // Kirim respons JSON yang berhasil
    res.status(200).json({
      message: 'File berhasil diunggah',
      url: result.secure_url
    });
    
  } catch (error) {
    console.error('Error unggah file:', error);
    res.status(500).json({ message: 'Gagal mengunggah file', error: error.message });
  }
}
