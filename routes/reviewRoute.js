//Moved all the routes for review from the main app.js file to this new file, see campgroundRoute file for more notes on routes

const express = require("express");
const router = express.Router();

//below imports file with all the logic that was in our routes in order to make this file consise and clear with a clear name for what
//each route does but the actual logic is in the campgroundController file
const reviewController = require("../controllers/reviewController");

//requires our catchasync error handler so we can use it in this file
const catchAsync = require("../utils/catchAsync");

const Campground = require("../models/campground");
const Review = require("../models/review");

//middleware to validate reviews and to check if the user is logged in
const {
  validateReviews,
  isLoggedIn,
  isReviewAuthor,
} = require("../middleware.js");
const { createNewReview } = require("../controllers/reviewController");

router.post(
  "/campgrounds/:id/review",
  //want to check if the user is logged so if a user is not logged in, there is no way to send a post request to create a new review.
  isLoggedIn,
  validateReviews,
  catchAsync(reviewController.createNewReview)
);

router.delete(
  "/campgrounds/:campgroundId/reviews/:reviewId",
  //want to check if the user is logged so if a user is not logged in, there is no way to send a delete request to create a new review.
  isLoggedIn,
  //checks if the logged in user is the user associated with the review trying to be deleted and if not review cannot be deleted through the
  //delete route
  isReviewAuthor,
  catchAsync(reviewController.deleteReview)
);

module.exports = router;
