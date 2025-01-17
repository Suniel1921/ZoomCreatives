const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');


// Configure Cloudinary
cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET,
});

// Set up Cloudinary storage engine
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'Zoom Creatives',  // Ensure this folder exists or Cloudinary allows it to be created
      allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],  // Allowed formats
      transformation: [{ width: 500, height: 500, crop: 'limit' }]  // For images
    },
  });
  

const upload = multer({ storage: storage });

module.exports = upload;











