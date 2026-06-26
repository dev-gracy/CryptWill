const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const getCleanExt = (filename) => {
  let name = filename.toLowerCase();
  if (name.endsWith('.enc')) {
    name = name.slice(0, -4);
  }
  return path.extname(name);
};

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.txt'];
  const ext = getCleanExt(file.originalname);
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} not allowed. Allowed: ${allowed.join(', ')}`), false);
  }
};

const vaultUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const kycUpload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = getCleanExt(file.originalname);
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, JPG, PNG allowed for KYC'), false);
  },
});

module.exports = { vaultUpload, kycUpload };
