const mongoose = require("mongoose");
//requiring the review model to be able to use in this file
const Review = require("./review");
const Schema = mongoose.Schema;

//By default mongoose does not include virtuals when you convert a document to json. We pass campground model and its virtuals
//through a JSON format in index.ejs as thats where we pass the campgrounds info to mapbox and mapbox requires it in JSON format
//so if we want to include the virtual in which we created an achor tag in below code virtual, then we need to pass tthis
//opts property to the schema.
const opts = { toJSON: { virtuals: true } };

const CampgroundSchema = new Schema(
  {
    title: String,
    // updated schema for image to include an array so we can have multiple images if need be and updated it from just one url string attribute
    // to url string attribute and filename string attribute as these details are what multer/cloudinary store in req object when an image is
    //uploaded to cloudinary and we need these attributes of the image to be able to show/delete the images that a user uploads
    image: [
      {
        url: String,
        filename: String,
      },
    ],
    price: Number,
    description: String,
    location: String,
    //below is added to be able to store lat and long in geoJSON format so we can use things such as mapbox to display maps of locations
    geometry: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    //creating a relationship between the campground model and review model (one to many relationship) by allowing an array of review
    //object IDs from the review model to be able to be stored in the campground model
    reviews: [
      {
        type: Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    //creating a relationship between the campground model and the user model by allowing a user object Id from the user model
    //to be stored in the campground model. It should only be one user per one campground that is made so don't need an array like for
    //reviews above
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  opts
);

//we use the below virtual with mapbox because when there is a campground clicked on the main page mapbox map, we want a pop up to have a link to that specific campground
//id page. So we create a virtual that will have this url and mapbox, looking at their documentation, it shows popup info through having the data stored under
// properties. That is why in the below we do properties.popIpMarkup so this means popUpMarkup is nested under properties. in the below we are
//returning an achor tag with the link to the campground, then a paragraph with the description of the campground.
CampgroundSchema.virtual("properties.popUpMarkup").get(function () {
  return `
  <strong><a href="/campgrounds/${this._id}">${this.title}</a><strong>
  <p>${this.description.substring(0, 20)}...</p>`;
});

//once a campground is deleted, the post mongo middleware is called. The argument in the middleware stores the item that was deleted
//This mongo middleware is to delete every review in the review model because once a campground is deleted, we have to be able to delete
//each review associated with the campground in the review model as well as the two models are linked through one to many relationship.
//Deleting a campground in app.js uses findByIDAndDelete and the associated string for that is 'findOneAndDelete' as per the mongo docs
//a different string would potentially be required if we used a different way to delete the campground
CampgroundSchema.post("findOneAndDelete", async function (campgroundDel) {
  //checks if there is actually any data in campgroundDel
  if (campgroundDel) {
    //from the Review model, it checks if any objectid is also in the deleted campground.reviews as if you look at campgroundSchema, the
    //objectId is stored under reviews
    const res = await Review.deleteMany({
      _id: { $in: campgroundDel.reviews },
    });
  }
});

//compliles the model
const Campground = mongoose.model("Campground", CampgroundSchema);

//below can export the model so it can be used in other file
module.exports = Campground;
