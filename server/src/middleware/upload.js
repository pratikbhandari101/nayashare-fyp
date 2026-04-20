import multer from "multer";
import { dirname, extname, resolve } from "path";
import { existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const uploadRoot = resolve(__dirname, "../../uploads");

if (!existsSync(uploadRoot)) {
  mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadRoot);
  },
  filename: (req, file, cb) => {
    const extension = extname(file.originalname).toLowerCase();
    cb(null, `${req.user._id}-${Date.now()}${extension}`);
  }
});

function imageFileFilter(req, file, cb) {
  if (!file.mimetype.startsWith("image/")) {
    const error = new Error("Only image uploads are allowed");
    error.statusCode = 400;
    return cb(error);
  }

  return cb(null, true);
}

export const uploadProfileImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024
  }
});
