//require the below based on multer-cloudinary-storage docs to use cloudinary in conjuction with multer
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

//from cloudinary docs, we need to configure cloudinary based on our account info such as the api key and other info we stored in env variables
//to be able to use it
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

//create an instance of the cloudinary storage while setting some parameters for this instance. Images for this program will be stored on the
//YelpCamp folder in cloudinary
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "YelpCamp",
    allowedFormats: ["jpeg", "png", "jpg"],
  },
});

module.exports = {
  cloudinary,
  cloudinaryStorage,
};
