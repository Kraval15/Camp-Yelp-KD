const mongoose = require("mongoose");
//imports the campground model we created in the campground.js file
const Campground = require("../models/campground");

const cities = require("./cities");
//gets the places and descriptions data from the seedHelpers file. In the seedHelpers file the code is exporting palces and descriptors
//variables using module.expoers.descriptors and module.export.places
const { descriptors, places } = require("./seedHelpers");

mongoose
  .connect("mongodb://localhost:27017/yelp-camp")
  .then(() => {
    console.log("MONGO CONNECTION OPEN!!!");
  })
  .catch((err) => {
    console.log("OH NO MONGO CONNECTION ERROR!!!!");
    console.log(err);
  });

//async function to create seed data that we will add to our database to use for yelp-camp.
const seedDB = async () => {
  //deletes any data currently in the db
  await Campground.deleteMany({});

  for (let i = 0; i < 200; i++) {
    //gives a random number between 1 to 1000 that we will then use data from cities.js file and get the value of cities at the random number.
    //Basically to get a random city from the city file as there are 1000 cities in the city file
    const random1000 = Math.floor(Math.random() * 1000);
    //gives a random number between 1-18 and then it will be used to get a random description and place as there are 18 of each in the
    //seedsHelpers.js file that we access descritors and palces from.
    const randomDescriptorNumber = Math.floor(Math.random() * 18);
    //creates a random price for us to use for our model below
    const randomPrice = Math.floor(Math.random() * 20) + 10;
    //creates new instance of the model, image currently is a url from unsplash website which generates a random image from collection
    //483251 each time the url is requested, a random image will be displayed
    const camp = new Campground({
      location: `${cities[random1000].city}, ${cities[random1000].state}`,
      //after we updated our schema to add geometry so we can use mapbox, we are adding the below as a geometry seed data just so all
      //our campgrounds in the seed data also have a latitude and longitude so all the interactive maps show up
      geometry: {
        type: "Point",
        coordinates: [
          cities[random1000].longitude,
          cities[random1000].latitude,
        ],
      },
      title: `${descriptors[randomDescriptorNumber]}, ${places[randomDescriptorNumber]}`,
      //now that we are using cloudinary, using sample images uploaded to cloudinary url and their filename to seed the database
      image: [
        {
          url: "https://res.cloudinary.com/da2lqe7dv/image/upload/v1699577639/YelpCamp/ysk6iuhiehjf4apnazhp.jpg",
          filename: "YelpCamp/ysk6iuhiehjf4apnazhp",
        },
        {
          url: "https://res.cloudinary.com/da2lqe7dv/image/upload/v1699577639/YelpCamp/ebkibbf3vccxcmjbvgiw.jpg",
          filename: "YelpCamp/ebkibbf3vccxcmjbvgiw",
        },
        {
          url: "https://res.cloudinary.com/da2lqe7dv/image/upload/v1699577639/YelpCamp/ssfacfp20r3cmxl2fo0z.jpg",
          filename: "YelpCamp/ssfacfp20r3cmxl2fo0z",
        },
      ],
      description:
        "This is the current campsite description. It is currently the same for all campsites hahaha!!!",
      price: randomPrice,
      //this is objectId for user kuldeep that was created in the users model/schema. as seen in campground schema, we are tying author
      // or user from users model to the campground model so we can associated each campground with an author. For the seeds data, we are
      //associating all the data with author kuldeep but for every new campground that is created from the website after, it will show the
      //user that created the campground
      author: "654405aaf27274137203d7b8",
    });
    //saves the new instance of the model in the current Campground database
    await camp.save();
  }
};

//runs the seedDB function to first delete any data currently in the database and then add 50 new instance of data to the database. After
//this is done, it closes the mongoose connection so we don't manually have to do control c in the node shell to close the connection
seedDB().then(() => {
  mongoose.connection.close();
});
