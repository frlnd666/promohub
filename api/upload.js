// promo-hub/api/upload.js
import { IncomingForm } from 'formidable';
import cloudinary from 'cloudinary';

// Konfigurasi Cloudinary dari variabel lingkungan
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Baris ini memberi tahu Vercel untuk tidak mem-parsing body
export const config = {
  api: {
    bodyParser: false,
  },
};

const parseMultipart = (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("Formidable parsing error:", err);
        return reject(err);
      }
      if (!files.file || !files.file[0]) {
        console.error("No file object found after parsing.");
        return reject(new Error("No file uploaded or file object is invalid."));
      }
      resolve(files.file[0]);
    });
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  // Log untuk debugging: Pastikan kredensial terbaca
  console.log("Cloudinary Config Status:", {
    cloud_name_set: !!process.env.CLOUDINARY_CLOUD_NAME,
    api_key_set: !!process.env.CLOUDINARY_API_KEY,
    api_secret_set: !!process.env.CLOUDINARY_API_SECRET
  });
  
  try {
    const uploadedFile = await parseMultipart(req);
    
    // Unggah file ke Cloudinary
    const result = await cloudinary.v2.uploader.upload(uploadedFile.filepath, {
      folder: 'promohub_banners', // Ganti folder jika diperlukan
      resource_type: 'image'
    });
    
    // Kirim respons dengan URL file yang berhasil diunggah
    res.status(200).json({
      message: 'File berhasil diunggah',
      url: result.secure_url
    });
    
  } catch (error) {
    console.error('Error in Vercel Function:', error);
    res.status(500).json({
      message: 'Gagal mengunggah file. Silakan periksa log Vercel untuk detail.',
      error: error.message
    });
  }
}
