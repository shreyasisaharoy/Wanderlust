// app.js (cleaned)

if (process.env.NODE_ENV !== "production") {
  console.log("before require dotenv");
  require("dotenv").config();
  console.log("after require dotenv");
}

console.log("before require express");
const express = require("express");
console.log("after require express");
const app = express();

console.log("before require mongoose");
const mongoose = require("mongoose");
console.log("after require mongoose");

console.log("before require path");
const path = require("path");
console.log("after require path");

console.log("before require method-override");
const methodOverride = require("method-override");
console.log("after require method-override");

console.log("before require ejs-mate");
const engine = require("ejs-mate");
console.log("after require ejs-mate");

console.log("before require ./utils/ExError.js");
const ExError = require("./utils/ExError.js");
console.log("after require ./utils/ExError.js");

console.log("before require ./routes/listing.js");
const listingRouter = require("./routes/listing.js");
console.log("after require ./routes/listing.js");

console.log("before require ./routes/review.js");
const reviewRouter = require("./routes/review.js");
console.log("after require ./routes/review.js");

console.log("before require ./routes/user.js");
const userRouter = require("./routes/user.js");
console.log("after require ./routes/user.js");

console.log("before require express-session");
const session = require("express-session");
console.log("after require express-session");

console.log("before require connect-mongo");
const MongoStore = require("connect-mongo");
console.log("after require connect-mongo");

console.log("before require connect-flash");
const flash = require("connect-flash");
console.log("after require connect-flash");

console.log("before require passport");
const passport = require("passport");
console.log("after require passport");

console.log("before require passport-local");
const LocalStrategy = require("passport-local");
console.log("after require passport-local");

console.log("before require ./models/user.js");
const User = require("./models/user.js");
console.log("after require ./models/user.js");



/*if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const engine = require("ejs-mate");
const ExError = require("./utils/ExError.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js"); */

// -------------------- DB URL and mongoose connect --------------------
const dbUrl = process.env.ATLAS_DB || "mongodb://127.0.0.1:27017/Airbnb";

console.log("Using Mongo DB URL:", dbUrl);

async function main() {
  await mongoose.connect(dbUrl, {
    // optional mongoose options if you want them
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

main()
  .then(() => {
    console.log("Successfully Connected Mongoose");
  })
  .catch((err) => {
    console.error("Mongoose connection error:", err);
  });

// -------------------- app config --------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.engine("ejs", engine);

app.use(express.urlencoded({ extended: true })); // parse form data
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "/public")));

// -------------------- session store (connect-mongo) --------------------
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET || "devsecret_replace_in_prod",
  },
  touchAfter: 24 * 3600, // seconds
});

store.on("error", (err) => {
  console.error("Error in MongoDB session store:", err);
});

// -------------------- session options --------------------
const sessionOption = {
  store,
  secret: process.env.SECRET || "devsecret_replace_in_prod",
  resave: false,
  saveUninitialized: true,
  cookie: {
    // expires must be a Date
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    // secure: true // enable in production with HTTPS
  },
};

app.use(session(sessionOption));
app.use(flash());

// -------------------- passport --------------------
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// -------------------- locals for flash & currentUser --------------------
app.use((req, res, next) => {
  res.locals.errorMsg = req.flash("error");
  res.locals.successMsg = req.flash("success");
  res.locals.currentUser = req.user;
  next();
});

// -------------------- routes --------------------
app.use("/listings", listingRouter);
app.use("/listings", reviewRouter);
app.use("/", userRouter);

// -------------------- fallback 404 handler --------------------
app.all("*", (req, res, next) => {
  next(new ExError(404, "Page Not Found !!!"));
});

// -------------------- error handling middleware --------------------
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something Went Wrong..." } = err;
  res.status(statusCode).render("error.ejs", { message });
});

// -------------------- start server --------------------
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
