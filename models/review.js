const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
  body: String,
  rating: Number,
  //creating a relationship between the review model and the user model by allowing a user object Id from the user model
  //to be stored in the review model. It should only be one user per one review that is made so don't need an array like for
  //reviews in the campground model
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

//compliles the model
const Review = mongoose.model("Review", ReviewSchema);

//below can export the model so it can be used in other file
module.exports = Review;
