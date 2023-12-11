//Moved all the routes for campground from the main app.js file to this new file
const express = require("express");
const router = express.Router();
//require multer so we are able to parse multipart data so for example when a user uploads an image of the campground while making the new
// campground, we can work with the image, store it on cloudinary, store the cloudinary url on mongo and so forth and display that campground
// image that the user uploaded
const multer = require("multer");
//require the configured cloudinary storage instance we made in which we configured the instance with our cloudinary account, set which folder
//to save the file on cloudinary, etc..
const { cloudinaryStorage } = require("../cloudinary/cloudinaryIndex");
const upload = multer({ storage: cloudinaryStorage });

//below imports file with all the logic that was in our routes in order to make this file consise and clear with a clear name for what
//each route does but the actual logic is in the campgroundController file
const campgroundController = require("../controllers/campgroundController");

//requires our catchasync error handler so we can use it in this file
const catchAsync = require("../utils/catchAsync");

const Campground = require("../models/campground");

//requires our isLoggedIn middleware to protect our routes that we require the user to be logged in to use. See middleware file for more
//info on how that middleware works. IsAuthor and validateCampground also middleware, see middleware file for more info on them
const {
  isLoggedIn,
  isAuthor,
  validateCampground,
} = require("../middleware.js");

//calls the index function in the campgroundController file (see details on the function with comments in that file) which displays all
//campgrounds
router.get("/", catchAsync(campgroundController.index));

router.get("/new", isLoggedIn, campgroundController.renderNewForm);

router.post(
  "/",
  isLoggedIn,
  //multer code to help us parse the multipart data when user enters details of new campground including any campground image. With the below
  //we are able to store multiple images from a user and then the details about the images is stored in req.files while the details about any
  //text that user enters in the form is stored in req.body. The upload.array also helps us store the image to cloudinary in our YelpCamp
  //cloudinary folder as that is how we configured const upload = multer({ storage: cloudinaryStorage }); and cloudinaryStorage in the
  //cloudinaryIndex file
  upload.array("image"),
  validateCampground,
  catchAsync(campgroundController.createNewCampground)
);

router.get("/:id", catchAsync(campgroundController.showCampgrounds));

router.get(
  "/:id/edit",
  isLoggedIn,
  //isAuthor middleware helps us check if the current user logged in is the same as the campground user author and only then we can access edit
  isAuthor,
  catchAsync(campgroundController.renderEditForm)
);

router.put(
  "/:id",
  isLoggedIn,
  //isAuthor middleware helps us check if the current user logged in is the same as the campground user author and only then we can access edit put request
  isAuthor,
  //multer code to help us parse the multipart data when user enters details of edit campground including any campground image. With the below
  //we are able to store multiple images from a user and then the details about the images is stored in req.files while the details about any
  //text that user enters in the form is stored in req.body. The upload.array also helps us store the image to cloudinary in our YelpCamp
  //cloudinary folder as that is how we configured const upload = multer({ storage: cloudinaryStorage }); and cloudinaryStorage in the
  //cloudinaryIndex file
  upload.array("image"),
  validateCampground,
  catchAsync(campgroundController.updateCampground)
);

router.delete(
  "/:id",
  isLoggedIn,
  //isAuthor middleware helps us check if the current user logged in is the same as the campground user author and only then we can access delete request
  isAuthor,
  catchAsync(campgroundController.deleteCampground)
);

module.exports = router;
