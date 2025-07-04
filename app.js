if(process.env.NODE_ENV !="production"){
    require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const ejsMate = require("ejs-mate");
const methodOverride = require("method-override");
const ExpressError =require("./utils/ExpressError.js");
const session= require("express-session");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const flash =require("connect-flash");
const listingRouter= require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require('./models/user');

main()
    .then(() => console.log("connected to db"))
    .catch((err) => console.log(err));

async function main() {
    await mongoose.connect(MONGO_URL);
}

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.engine("ejs", ejsMate);

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));
const sessionOptions = {
    secret: "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie:{
        expires:Date.now() + 7*24*60*60*1000,
        maxAge:7*24*60*60*1000,
        httpOnly: true,//to prevent from  cross scripting attacks
    },
};

// Root route
app.get("/",async(req, res) => {
    res.send("hi i am root");
});

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req,res,next)=>{//this is middleware
    res.locals.success =req.flash("success");
    res.locals.error =req.flash("error");
    res.locals.currUser =req.user;

    next();
});


app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);
// Test route
/*app.get("/testListing", async (req, res) => {
    const sampleListing = new Listing({
        title: "My New Villa",
        description: "By the beach",
        price: 1200,
        location: "Calangute, Goa",
        country: "India",
    });
    await sampleListing.save();
    res.send("successful testing");
});*/

/*app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});*/
/*app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).send(message);
});*/

app.use((err, req, res, next)=>{// error handling middleware 
    let{statusCode=500, message="something went wrong"}=err;
    res.status(statusCode).render("error.ejs",{message});
    //res.status(statusCode).send(message);
    //res.send("something went wrong");
});
app.listen(8080, () => {
    console.log("server is listening to port 8080");
});
