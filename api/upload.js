import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { file, folder } = req.body || {};

    if (!file) {
      return res.status(400).json({ ok: false, error: 'No file provided' });
    }

    const result = await cloudinary.uploader.upload(file, {
      folder: folder || 'promohub/banners',
      resource_type: 'image',
    });

    return res.status(200).json({
      ok: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
};
