//This js file that contains all our logic for all our campground routes

const Campground = require("../models/campground");

//require the configured cloudinary instance we made in which we configured the instance with our cloudinary account, set which folder
//to save the file on cloudinary, delete files such as campground images from cloudinary, etc..
const { cloudinary } = require("../cloudinary/cloudinaryIndex");

//for mapbox geocoding of locations so we can get latitude and longitude of each of our campground location
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const geocodeService = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });

//when its at the /campgrounds url, it stores all the data in the Campground model in the variable campgrounds, then sends it off to the
//index.ejs file in the campgrounds folder and it renders the website in the /campgrounds url based on that
//Also we have added catchAsync wrapper around this and all other async functions to be able to catch any errors from this due to express
//requiring a specific format to catch any async errors
module.exports.index = async (req, res, next) => {
  const campgrounds = await Campground.find({});
  res.render("campgrounds/index", { campgrounds });
};

//when its at the /campgrounds/new url, it renders the website based on the new.ejs file in the campgrounds folder
module.exports.renderNewForm = (req, res) => {
  res.render("campgrounds/new");
};

// Once a post request is sent to /campgrounds validation of data used to send post request will be completed and if all required
// data is not there it will throw an error and if it is there, it saves the info/data from the post request and creates a new instance of a
//model . The data in the post request is stored with the key matching the key in the model schema so it can be used to create a new instance
//  of the model. Then the new instance is saved and then we get redirected to the webpage displaying details of the new campground
module.exports.createNewCampground = async (req, res, next) => {
  // the below creates an instance and then based on looking at the geocode docs, we can use our location of the campground and ask for 1 query
  //and the response in the body object will contain some latitude and longitude coordinates of the location in geoJSON format
  const geoData = await geocodeService
    .forwardGeocode({
      query: req.body.location,
      limit: 1,
    })
    .send();

  //gets whatever is submitted from the post request form in the new.ejs file and uses that info to create a new instance of campground.
  const newCampground = new Campground(req.body);
  //when user submits details for a new campground we are now submitting a post request with data type of multipart/form data and using
  //multer to parse this data. The req object now will contain req.body like we had for urlencoded and also now it will have req.files
  //which contains all the info for the images/attachment that was uploaded including the path (url) of file stored on cloudinary and a filename
  //which can be used to eventually delete the uploaded image from cloudinary as required.
  img_details = req.files;
  //since we spcified upload.array in our post route in campgroundRoutes, there will be an array storing each images detail. Below we use
  //.map to go through each element of the array and then store the url and filename and then we create an object with the url and filename
  //to store in the image portion of the newCampgground which in the campground schema we defined as having url and filename as required string
  newCampground.image = img_details.map((img) => {
    const url = img.path;
    const filename = img.filename;
    return { url, filename };
  });
  //campgroundSchema is updated to add the geoJSON format for location (we call it geometry in the schema) and below uses mapbox to get this
  //location data and store it in geometry variable in our campground model
  newCampground.geometry = geoData.body.features[0].geometry;
  //passport stores user details in the req object if a user is logged in and undefined if a user is not logged in. But to create a new
  //campground a user has to be logged in based on all the authentication we added so we can assume we will have the user details. In our
  //case we have the campground model and the user model connected so we can get the objectId of the user currently logged in and connect
  //it to our campground author (see campground schema to see user model connected to campground model through user object Id) and then
  //we can save the user that was logged in currently that made the campground to the new campground we just created
  newCampground.author = req.user;
  await newCampground.save();
  console.log(newCampground);
  //creates a key value pair for a flash message, in this case key is success and value is the message, which will be stored in a local
  //variable based on our flash middleware in the app.js file
  req.flash("success", "Successfully made a new campground!");
  res.redirect(`/campgrounds/${newCampground._id}`);
};

// gets the campground based on the id, saves it in the variable called campground and then renders the website based on
// show.ejs file in the campgrounds folder.
module.exports.showCampgrounds = async (req, res, next) => {
  //deconstructs so stores the params which in this case is anything after the /campgrounds/ of the url into a variable called id
  const { id } = req.params;
  //we add the .populate because currently campground model stores reviews objectIDs (array of review objectIDs are stored based on the
  //one of many relationship, see model file for campground and review for more info) and as we learned earlier, using the .populate
  //allows us to expand from the objectID to get the information we require from it. In this case we want to access each reviews body (description)
  //and rating so we can display them to the user by accessing the data in show.ejs. But later on we added author to the reviews model so
  //we can add the logged in user as the author to each review and to access this review author we populate reviews in the campground model
  //and then populate again to populate the author from the reviews we just populated so its a nested populate to access the review author
  // as well so we can pass this info to our ejs template through the campground variable. Also use .populate on author in campground model
  //which is associated with the user model so this allows us to access each users model body which contains a field called username
  //which we can access to display to the user by accessing this data in show.ejs similar to reviews data.
  const campground = await Campground.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("author");
  //checks if there is a campground that was found based on the id and if there wasn't then it flashs an error message saying no campground
  //and redirects to the main page
  if (!campground) {
    req.flash("error", "Cannot find that campground!");
    res.redirect("/campgrounds");
  }
  res.render("campgrounds/show", { campground });
};

// when its the /campgrounds/id/edit url, it finds the campground by id stores it in campground variable and then renders the webpage using
// edit.ejs and also passes the campground variable to that ejs file
module.exports.renderEditForm = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  //checks if there is a campground to edit that was found based on the id and if there wasn't then it flashs an error message saying
  //no campground and redirects to the main page
  if (!campground) {
    req.flash("error", "Cannot find that campground!");
    res.redirect("/campgrounds");
  }
  res.render("campgrounds/edit", { campground });
};

// once a put request is sent to /campgrounds/:id, validation of data used to send post request will be completed and if all required
// data is not there it throws an error and if it is there, it saves the info from the edit request, finds the current instance
// of the model by id and updates it using the info from the put request. The data in the put request is stored with the key matching the
// key in the model schema so it can be used to update the current id instance. Then we get redirected to the webpage displaying details
// of the edited campground
module.exports.updateCampground = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findByIdAndUpdate(id, req.body, {
    runValidators: true,
    new: true,
  });
  //when user submits details for edit campground, we are now submitting a put request with data type of multipart/form data and using
  //multer to parse this data. The req object now will contain req.body like we had for urlencoded and also now it will have req.files
  //which contains all the info for the images/attachment that was uploaded including the path (url) of file stored on cloudinary and a filename
  //which can be used to eventually delete the uploaded image from cloudinary as required.
  img_details = req.files;
  //since we specified upload.array in our put route in campgroundRoutes, there will be an array storing each images detail. Below we use
  //.map to go through each element of the array and then store the url and filename and then we create an overall array with objects containing
  // the url and filename. We want to add this new array into the existing array of images as we are editing the campground and not creating
  //a new campground so since we don't want to replace the existing image array in the campground, we can't just do campground.image = img_details_array
  //We need to push this new new array of image onto the existing array so we use .push to add things to existing array and we use spread operator
  //to push each item (object containting url and filename) from img_details_array into campground.image and then we save it to update the
  //campground with these new images.
  img_details_array = img_details.map((img) => {
    const url = img.path;
    const filename = img.filename;
    return { url, filename };
  });
  campground.image.push(...img_details_array);
  await campground.save();
  //based on the edit.ejs page where delete images was added, when user submits form, the images the user selected gets added to deleteImages
  //array which is passed through req.body of this put request. The below checks if there is deleteImages array and that would only be the case
  //if the user deleted any images
  if (req.body.deleteImages) {
    //goes through each image in the array and gets it filename. Then calls on cloudinary to delete that image on cloudinary
    for (let filename of req.body.deleteImages) {
      await cloudinary.uploader.destroy(filename);
    }
    //pulls out the images from the existing campground image array if deleteImages array has any file name that are matching. This effectively
    //removes the image from the existing campground array
    await campground.updateOne({
      $pull: { image: { filename: { $in: req.body.deleteImages } } },
    });
  }
  req.flash("success", "Successfully updated your campground!");
  res.redirect(`/campgrounds/${campground._id}`);
};

// once a delete request is sent to /campgrounds/:id using the delete button based on the show.ejs file, it finds the current campground by
// id and deletes it in our model.
module.exports.deleteCampground = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findByIdAndDelete(id);
  req.flash("success", "Successfully deleted your campground!");
  res.redirect("/campgrounds");
};
