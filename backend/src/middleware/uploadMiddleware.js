const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ekub_receipts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'] // <-- webp እዚህ መካተት አለበት
  }
});

const upload = multer({ storage });

module.exports = upload;