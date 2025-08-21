// promohub/api/upload.js
import formidable from "formidable";
import { v2 as cloudinary } from "cloudinary";

export const config = {
  api: { bodyParser: false }, // wajib dimatikan agar formidable bisa mem-parsing multipart/form-data
};

// Konfigurasi Cloudinary via ENV (jangan hardcode!)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("Formidable parse error:", err);
        return res.status(400).json({ error: "Invalid form data" });
      }

      // `files.file` bisa berupa object atau array tergantung versi/node
      let file = files?.file;
      if (Array.isArray(file)) file = file[0];

      if (!file?.filepath) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      try {
        const upload = await cloudinary.uploader.upload(file.filepath, {
          folder: "promohub",
          resource_type: "image",
        });

        return res.status(200).json({
          url: upload.secure_url,
          public_id: upload.public_id,
        });
      } catch (cloudErr) {
        console.error("Cloudinary upload error:", cloudErr);
        return res.status(502).json({ error: "Cloudinary upload failed" });
      }
    });
  } catch (e) {
    console.error("Upload handler error:", e);
    return res.status(500).json({ error: "Server error" });
  }
}
