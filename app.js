// checks if the environment is not in production mode then based on that it requires the dotenv package which allows us to use the env
// variables in our .env file. when environment is in production mode, there is a separate way to use values in our env file
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");

const flash = require("connect-flash");
//requring the 2 passports and then required the passport-local-mongoose in the file where our user model was created
const passport = require("passport");
const LocalStrategy = require("passport-local");
const mongoSanitize = require("express-mongo-sanitize");

const session = require("express-session");
//require our connect-mongo so we can use it to store our session info about the user in a mongo db instead of the memory store
//of the browser that express does by default
const MongoStore = require("connect-mongo");

//require the user model to use with passport for authentication
const User = require("./models/user");

const methodOverride = require("method-override");
//requires our custom error handler error handler so we can use it in this file
const ExpressError = require("./utils/expressError");

//require files for our new routing files we made
const campgroundRoutes = require("./routes/campgroundRoute");
const reviewRoutes = require("./routes/reviewRoute");
const userRoutes = require("./routes/userRoute");

//dbUrl should be process.env.MONGODB_URI when we want to use mongo atlas to save all the data to the mongo atlas servers online in production env
//dbUrl should be "mongodb://localhost:27017/yelp-camp" when we want to use our local databse to store data in dev env
//const dbUrl = "mongodb://localhost:27017/yelp-camp";
const dbUrl = process.env.MONGODB_URI;
//in production mode it should be .connect(dbUrl, { dbName: "Yelp-Camp" })
mongoose
  .connect(dbUrl, { dbName: "Yelp-Camp" })
  .then(() => {
    console.log("MONGO CONNECTION OPEN!!!");
  })
  .catch((err) => {
    console.log("OH NO MONGO CONNECTION ERROR!!!!");
    console.log(err);
  });

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
//configures the express framework to serve ejs files that we have stored in the views directory. Express by default serves EJS files in
//the views directory after we have configured it with the below
app.set("views", path.join(__dirname, "views"));

//uses the express-mongo-sanitize package to sanitize things such as query string or params to remove characters such as $ and . that can
//be used for mongo injection purposes and replaces them with a _
app.use(
  mongoSanitize({
    replaceWith: "_",
  })
);

//tells express to use our static files in the public folder on each request. Express by default serves static assets in the public directory
//Static files are the website content that won't be changed, mainly images, JS files (for ex to validate forms) and CSS files
app.use(express.static(path.join(__dirname, "public")));

//app.use allows us to run code on every request so everytime any url is called on this server. This is telling express to use
//urlendedcode and methodoverride on every request
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: "thisshouldbeabettersecret!",
  },
  //the below just updates the session every 24 hours in mongodb instead of everytime the user refreses the page if they are logged in
  //so if the data in the session has not changed it will not update and only update every 24 hours
  touchAfter: 24 * 60 * 60,
});

//if there are any errors from trying to store the session, the below will capture it
store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});

//session setup
const sessionConfig = {
  //stores the session in the store variable we created above to help us store the session in the mongoDb database instead of the
  //memory store of the browser in which express stores it by default if we don't identify any other database
  store: store,
  name: "session",
  secret: "thisshouldbeabettersecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    //sets the session cookie expiry date for 1 week from now
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    //sets the max age of the session cookie to 7 days
    maxAge: 1000 * 60 * 60 * 24 * 7,
    //an extra security function for the session cookie, make sure cookies are only accessible through http and not JS so if someone wrote
    //some script that extracts cookies, they would not be able to see the cookies as they are not accessible through JS
    httpOnly: true,
    //the below ensures that cookies are only able to be configured through Https or through a secure connection. On localhost this does not
    //apply so its commented out but when deploying, this should be true. So only require the below when we are deploying and want the
    //access to cookies only through a secure connection
    //secure: true,
  },
};
app.use(session(sessionConfig));

//flash setup
app.use(flash());

//required to initiliaze passport as per the passport docs
app.use(passport.initialize());
//required to keep persistent login sessions instead of being required to log in every time
app.use(passport.session());
//in passport used to authenticate from the user model
passport.use(new LocalStrategy(User.authenticate()));

//strategy on the user model from passport to store a user in a session
passport.serializeUser(User.serializeUser());
//strategy on the user model from passport to take a user out of a session
passport.deserializeUser(User.deserializeUser());

//middleware to use flash variables throughout all the files such as ejs files. The messages are stored in a key value pair so the key is success
//and error and there will be a message associated with it. The key value pair would be placed in pages you want to show a flash message for
//example when creating a new campground successfully, we would put req.flash("success", "Successfully made a new campground!") in
//the router.post in campgrounds route section for this flash message to show each time a new campground was creted successfully
app.use((req, res, next) => {
  //if there is any flash message stored under the key of success for any request, it will be stored in a local variable called success
  //and be able to be accessed by all the next() middlewares of that request
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  //passport stores the signed in users details such as username, email etc.. in the req object if a user is signed in and if a user is
  //not signed in then its its undefined. We will store this data in the signedInUser variable so we can have user data available to all
  //our templates when there is a request sent. For example we will user signedInUser info to show either login and register in the navbar
  //if there is no user logged in and show only logout in the navbar if a user is logged in
  res.locals.signedInUser = req.user;
  next();
});

//to use the routes from our routing files for the campground routes and the review routes
app.use("/campgrounds", campgroundRoutes);
app.use("/", reviewRoutes);
app.use("/user", userRoutes);

app.get("/", async (req, res) => {
  res.render("home");
});

//using the "*", for any urls we don't recognize it will go to this and create an error and pass it on to our error middlware
//(next(err) format)
app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found!", 404));
});

app.use((err, req, res, next) => {
  //the below deconstructs from err to set status to whatver err.status is but if there is no err.status then it makes the variable
  //status = 500. But this doesn't mean err.status in the err object is 500. If we wanted err.status to be 500 if it didn't exist in
  //the err object we would have to follow the path of err.message where we actually manually set it if it doesn't exist.
  const { status = 500 } = err;
  if (!err.message) {
    err.message = "Something Went Wrong!";
  }
  res.status(status).render("error", { err });
});

//when deployed, it will use the port that the deployment website uses and if there is no port then it will use 3000 which would mean we are
//testing on our local database with port 3000
const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("APP IS LISTENING ON PORT 3000!");
});
