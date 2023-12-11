//This js file that contains all our logic for all our review routes

const Review = require("../models/review");
const Campground = require("../models/campground");

//see example in campgroundRoute.js of a post request for more detailed comments if needed, similar concept followed for this post request
module.exports.createNewReview = async (req, res, next) => {
  //gets whatever is submitted from the post request form in the show.ejs file and uses that info to create a new instance of review.
  //Review in this case should have 2 data, the body and the rating in req.body. Then saves the new review instance to the model.
  const newReview = new Review(req.body);
  //now that we added the author field to the review model, which connects to the user model, we are saving the current logged in users
  //user_id to the review model so we can access the author information and use this information to for example display author,
  //make sure only author can delete reviews associated with their account, etc..
  newReview.author = req.user._id;
  await newReview.save();

  //Saves the new review instance to the campground model based on the mongo relationship we established (one to many) for the campground
  //model and review model in the mongo schemas. In the mongo model, reviews are an array in the compground model so we use .push to
  //add the new review to the existing campground.
  const { id } = req.params;
  const campground = await Campground.findById(id);
  campground.reviews.push(newReview);
  await campground.save();
  req.flash("success", "Successfully added a new review!");
  res.redirect(`/campgrounds/${campground._id}`);
};

//helps delete an instance of a review from review method and that particular review from the campground databse as well
//So on the show campground page, there are reviews populated for the certain campground which we can delete through a delete button.
//When a delete button is pressed for a certain review, show.ejs sends that delete request to the url below which contains the campground Id and review Id.
module.exports.deleteReview = async (req, res, next) => {
  const { campgroundId, reviewId } = req.params;
  //review instance deleted from the review model
  const reviewDelete = await Review.findByIdAndDelete(reviewId);
  //$pull method to remove an element of an array was gotten by searching remove an element of an array in mongo. Helps delete the deleted
  //review from the campground model as the review model databse and the campground model database are connected through one to many relationship
  const campgroundReviewDelete = await Campground.updateMany(
    { _id: campgroundId },
    { $pull: { reviews: reviewId } }
  );
  req.flash("success", "Successfully deleted the review!");
  res.redirect(`/campgrounds/${campgroundId}`);
};
