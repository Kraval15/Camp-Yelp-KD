const Campground = require("./models/campground");
const Review = require("./models/review");

const ExpressError = require("./utils/expressError");

//require our Joi schema to use for validation of user entered data
const { campgroundJoiSchema, reviewJoiSchema } = require("./joischemas");

//the below checks that the related object ids of the current campground and the current logged in user are equal
//and only if they are equal then we allow them to access for example edit page through next(). If they are not equal then the campground
//was not created by this user so they can't edit or delete it. We use .equals as this is the mongoose way of comparing object ids.
//We can't use === to compare because when comparing objects such as the object id, they compare references to the object and not
//the actual object ids so they will never be equal if we compared the two ids with ===
module.exports.isAuthor = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  if (!campground.author._id.equals(req.user._id)) {
    req.flash("error", "You do not have permission to do that!");
    return res.redirect(`/campgrounds/${id}`);
  }
  next();
};

//the below checks that the related object ids of the current review author and the current logged in user are equal
//and only if they are equal then we allow them to delete the review. If they are not equal then the review
//was not created by this user so they can't delete it. We use .equals as this is the mongoose way of comparing object ids.
//We can't use === to compare because when comparing objects such as the object id, they compare references to the object and not
//the actual object ids so they will never be equal if we compared the two ids with ===
module.exports.isReviewAuthor = async (req, res, next) => {
  //will looked for reviewId = and campgroundId = in the url parameters and store that in a variable called reviewId and campgroundId,
  //this middleware is used in the delete post route to make sure the review the user is trying to delete is associated with the user. Check
  //that delete post route URL in reviewRoute page to see that reviewId and campgroundId are in the parameters of the URL
  const { reviewId, campgroundId } = req.params;
  const review = await Review.findById(reviewId);
  if (!review.author._id.equals(req.user._id)) {
    req.flash("error", "You do not have permission to do that!");
    return res.redirect(`/campgrounds/${campgroundId}`);
  }
  next();
};

//server side validation: validation middleware created which can be used in other middleware when we are required to validate data.
//Joi schema created in joischema.js file and imported to app.js to use
module.exports.validateCampground = (req, res, next) => {
  //validates data in req.body against our campgroundJoiSchema to ensure we have the required data. validate function returns
  // an object that includes any error that occured during the validation. If validation is successful, error will be undefined.
  //if not, it will be an error object containing details about what went wrong
  const { error } = campgroundJoiSchema.validate(req.body);
  //checks if there was any error
  if (error) {
    //error.details is an array containing one object for each validation error that occured and each object has a messsage property which
    //is a string describing the error, map is used to create a new array with just these error messages. el argument is an element
    //from the error.details array. The new array stored in errormsg will use join method to convert array of messages to a single string
    const errormsg = error.details.map(function (el) {
      return el.message;
    });
    //join() method on this errormsg array to get one string separated by commas.
    throw new ExpressError(errormsg.join("'"), 400);
  } else {
    //if no error is found then we call next() to go to the next middleware. For example we will put this validateCampground middleware in
    //an argument like: app.post("/campgrounds", validateCampground, catchAsync(async (req, res, next) => {. So for this, validateCampground
    //will run first and if there is an error it will throw the error then the error middleware would run after but if there is no error
    //the else part of the if statement completes next() which means the catchAsync middleware would run.
    next();
  }
};
//server side validation: validation middleware created for validating reviews similar to validation of campgrounds above. See above
//campground middleware for more details/notes
module.exports.validateReviews = (req, res, next) => {
  const { error } = reviewJoiSchema.validate(req.body);

  if (error) {
    const errormsg = error.details.map(function (el) {
      return el.message;
    });

    throw new ExpressError(errormsg.join("'"), 400);
  } else {
    next();
  }
};

//2 scenerios to support going to the same webpage after user logs in for example if user clicks create new campground when the user is not
//logged in, then the user is asked to login and after the user logs in, the goal is to direct them to add new campground webpage or whatever
//url they orginally came from instead of a generic webpage:
//1. User goes to a route such as create new campground. The request triggers the get route in the campgroundRoute file and in there the
//1st middleware checks if the user is logged in using the isLoggedIn middleware below. If the user is logged in then they redirected to
//the new campground page but if they are not loggen in then a session variable stores the URL the user came from and then the user is
//redirected to the login page which is a get route in the userRoute page. Once you submit the login details through a post route in the userRoute
//file, it first calls the storeReturnTo middleware which stores the session variable where we have the original url to a local variable. This
//is done because after this the post route authenticates the login details and if autehnticated and the user is logged in, passport automatically
//deletes all the info that was in the session prior to login so if we kept our URL stored in the session variable, it would be wiped and we
//would have no trace of it. So thats why we store it in a local variable and then the user is redirected  to the stored URL in that post
//route code. Follow an example path through the code to get clairty on how the code connects with each other similar to the new campground
//example discussed in the above note.
//2. User clicks login button in the navbar then the isLoggedIn is not called as the login button in the navbar leads straight to the login
//get route in the userRoute file. This means that req.session.returnTo will be undefined as we never call isLoggedIn to store the orginalUrl
//in the session variable which means once we submit the login details and then it triggers the post route of login in the userRoute file,
//the local returnTo variable will also be undefined so in that case in the post route of login,
//const redirectUrl = res.locals.returnTo || "/campgrounds"; will be equal to /campgorunds so we will be directed to /campgrounds after login.

//checks if the user in the current request is autehnticated and if they aren't then it saves the url that the user came from and then
//redirects the user to the login page
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    //stores the URL that the user currently is requesting for example if they request to go to create new campground it orginalUrl below
    //would be /campgrounds/new and this value is stored in a session variable called returnTo.
    req.session.returnTo = req.originalUrl;
    req.flash("error", "You must be signed in first!");
    return res.redirect("/user/login");
  }
  next();
};

//The below middleware helps store the url the user came from in a local vairable as currently when this middleware is triggered its stored
//in a session variable. See huge comment above for more info on this.
module.exports.storeReturnTo = (req, res, next) => {
  if (req.session.returnTo) {
    res.locals.returnTo = req.session.returnTo;
  }
  next();
};
