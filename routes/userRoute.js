const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

//requires our catchasync error handler so we can use it in this file
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/expressError");

const User = require("../models/user");

const passport = require("passport");
const LocalStrategy = require("passport-local");

const { storeReturnTo } = require("../middleware");

router.get("/register", userController.renderRegisterForm);

router.post("/register", catchAsync(userController.registerNewUser));

router.get("/login", userController.renderLoginForm);

router.post(
  "/login",
  storeReturnTo,
  //authenticates the login details using the local strategy, flash a failure message if login fails and redirects to login page if login fails
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/user/login",
  }),
  catchAsync(userController.loginUser)
);

router.get("/logout", userController.logoutUser);

module.exports = router;
