//This js file that contains all our logic for all our user routes

const Review = require("../models/review");
const Campground = require("../models/campground");
const User = require("../models/user");

//when its at the /user/register( /user due to our router in app.js having /user as the start), it renders the website based on the
// register.ejs file in the login users folder
module.exports.renderRegisterForm = (req, res) => {
  res.render("users/register");
};

//sends a post request to once user submits their email, username and password. Checks if the all the details entered are valid for example
// if all the details entered are unqiue and not already used or any other errors in the details if there is error then it dispalys an
//error message. If all details (username, email and password) are good then it registers the user using the register method avaialbe
//in passport. passport automatcially checks if the details are valid or have been reused and provides us an error message if there was
// an error for example if there was same username used as a previous registered user
module.exports.registerNewUser = async (req, res, next) => {
  try {
    const { email, username, password } = req.body;
    const user = new User({ email, username });
    const registeredUser = await User.register(user, password);
    //manually logging in the user after the user is successfully created. If we don't do this we would have to go to the login page
    //and enter the details of the user we just created in login page to login but this helps us automatically login the user after they
    //have been registered to improve user experience
    req.login(registeredUser, function (err) {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to Yelp Camp!");
      res.redirect("/campgrounds");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/user/register");
  }
};

//when its at the /user/login (/user due to our router in app.js having /user as the start), it renders the website based
//on the login.ejs file in the login users folder
module.exports.renderLoginForm = (req, res) => {
  res.render("users/login");
};

//sends a post request once the user submits their login details. Calls the storeReturnTo middleware first (see middleware file for info on that)
//and then authenticates the details to see if they were correct and if so then logs the user in and redirects them to a url based on our
//storeReturnTo middleware
module.exports.loginUser = async (req, res, next) => {
  req.flash("success", "welcome back!");
  //stores the local variable url from our storeReturnTo middeware if available or stores /campgrounds in the variable. See middleware.js
  //file for big comment with all the explaination the login redirect url stuff
  const redirectUrl = res.locals.returnTo || "/campgrounds";
  res.redirect(redirectUrl);
};

//when its at users/logout, there is a logout method on the req object that automatically comes with passport that helps us logout the
//current user and their details that is stored in the req object esentially logging out the current user. Once the logout method is called
//on the current req object, we log out the current user and have to login again to acess pages we have blocked off that require login through
//the isautenticated() method and the isLoggedIn middleware we put on each route that we want the user to be logged in for. The logout method
//requires us to have an error function so callback  error function (function inside a function). Inside this callback function helps us handle
//any potential errors
module.exports.logoutUser = (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("success", "Goodbye!");
    res.redirect("/campgrounds");
  });
};
