import { IncomingForm } from 'formidable';
import cloudinary from 'cloudinary';

// Konfigurasi Cloudinary dari variabel lingkungan
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
      resolve(files.file[0]); // Perbaikan di sini, files.file bisa berupa array
    });
  });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  
  try {
    const uploadedFile = await parseMultipart(req);
    
    if (!uploadedFile) {
      res.status(400).send('No file uploaded');
      return;
    }
    
    // Unggah file ke Cloudinary
    const result = await cloudinary.v2.uploader.upload(uploadedFile.filepath, {
      folder: 'promohub_invoices',
      resource_type: 'image'
    });
    
    // Kirim respons dengan URL file yang berhasil diunggah
    res.status(200).json({
      message: 'File berhasil diunggah',
      url: result.secure_url
    });
    
  } catch (error) {
    console.error('Error unggah file:', error);
    res.status(500).json({ message: 'Gagal mengunggah file', error: error.message });
  }
}
