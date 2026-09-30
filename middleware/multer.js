import multer from "multer";

// memoryStorage — file lives in memory as a Buffer.
// Controller streams it directly to Cloudinary.
// No local file written, no fs.unlinkSync needed.
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and WEBP images are allowed"), false);
    }
  }
});

export default upload;