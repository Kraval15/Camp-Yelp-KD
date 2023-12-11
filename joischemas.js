//require joi to use as our JS data validator tool
const Joi = require("joi");

//creates our joi schema used to validate our data before we involve mongoose. This is the data we want to make sure is entered by user
module.exports.campgroundJoiSchema = Joi.object({
  title: Joi.string().required(),
  price: Joi.number().min(0).required(),
  //image: Joi.string().required(),
  location: Joi.string().required(),
  description: Joi.string().required(),
  //see edit.ejs file where we added code to show images currently in campground and checkboxes that allow user to submit what images they
  //want to delete. These images user wants to delete are stored in an array called deleteImages. Since its a user input and will be compared
  //with the campground model to see if any images user selected are currently in campground model image array and then if they are overlapping,
  //the overlapping images will be pulled from campground image array so they get removed from the campground
  deleteImages: Joi.array(),
});

//creates our joi schema used to validate our data before we involve mongoose. This is the data we want to make sure is entered by user
module.exports.reviewJoiSchema = Joi.object({
  body: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
});
