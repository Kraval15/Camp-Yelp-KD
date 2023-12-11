const mongoose = require("mongoose");
const Schema = mongoose.Schema;
//require passport local mongoose
const passportLocalMongoose = require("passport-local-mongoose");

//create new schema for user, no username or password required in user schema as using passport plugin below takes care of that.
//Passport local mongoose will add a username,hash and salt field to store the username, hashed password and salt value automatically
//only email is required in the schema
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
