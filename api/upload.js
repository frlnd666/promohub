// promo-hub/api/upload.js
import { IncomingForm } from 'formidable';
import cloudinary from 'cloudinary';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Baris ini sangat penting
export const config = {
  api: {
    bodyParser: false,
  },
};

const parseMultipart = (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm();
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve(files.file[0]);
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
    
    const result = await cloudinary.v2.uploader.upload(uploadedFile.filepath, {
      folder: 'promohub_invoices',
      resource_type: 'image'
    });
    
    res.status(200).json({
      message: 'File berhasil diunggah',
      url: result.secure_url
    });
    
  } catch (error) {
    console.error('Error unggah file:', error);
    res.status(500).json({ message: 'Gagal mengunggah file', error: error.message });
  }
}
