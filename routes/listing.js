// const express = require('express');
// const router = express.Router();
// const wrapAsync = require('../utils/wrapAsync');
// const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
// const listingController = require('../controllers/listings.js');
// const multer  = require('multer');
// const { storage } = require('../cloudConfig.js');
// const upload = multer({ storage });


// // Index Route and Create Post Route using (router.route) ↓
// router
//  .route("/")
//  .get( wrapAsync( listingController.index ))
//  .post( isLoggedIn, upload.single('listing[image]'), validateListing, wrapAsync ( listingController.createListing ));


// // Create New Page Route ↓
// router.get("/new", isLoggedIn, listingController.renderNewForm );


// // Listing Show with Reviews, Listing Update and Listing Delete Route using (router.route) ↓
// router
//  .route("/:id")
//  .get( wrapAsync( listingController.showListing ))
//  .put( isLoggedIn, isOwner, upload.single('listing[image]'), validateListing, wrapAsync( listingController.updateListing ))
//  .delete( isLoggedIn, isOwner,  wrapAsync( listingController.destroyListing ));


// // Edit Page Route ↓
// router.get("/edit/:id", isLoggedIn, isOwner, wrapAsync( listingController.renderEditForm ));


// module.exports = router;

const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require('../controllers/listings.js');

const multer  = require('multer');
const path = require('path');

// ---------- Multer disk storage (store uploaded files in public/uploads) ----------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // projectRoot/public/uploads
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    // produce a unique filename: <timestamp>-<originalName>
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Only image files are allowed!'), false);
    } else {
      cb(null, true);
    }
  }
});
// -------------------------------------------------------------------------------

// Middleware to map the uploaded file to req.body.listing so your controller can use it.
// If your form uses name="listing[image]" this will work; it creates/uses req.body.listing object.
function attachUploadedImageToBody(req, res, next) {
  // ensure listing object exists
  req.body.listing = req.body.listing || {};

  if (req.file) {
    // Public path that the browser can request (because /public is served statically)
    req.body.listing.image = `/uploads/${req.file.filename}`;

    // If your controllers expect images as an array, you could instead set:
    // req.body.listing.images = [{ url: `/uploads/${req.file.filename}`, filename: req.file.filename }];
  }
  next();
}

// Index Route and Create Post Route using (router.route) ↓
// router
//  .route("/")
//  .get( wrapAsync( listingController.index ))
//  // note: upload.single(...) will parse the file from the form field named listing[image]
//  .post( isLoggedIn, upload.single('listing[image]'), attachUploadedImageToBody, validateListing, wrapAsync ( listingController.createListing ));

// router
//   .route("/")
//   .get(wrapAsync(listingController.index))
//   .post(
//     isLoggedIn,
//     upload.single('image'),  // parse file field from form
//     async (req, res, next) => {
//       try {
//         const listingData = req.body.listing || {};
//         if (req.file) {
//           // Save relative path so browser can fetch it
//           listingData.image = `/uploads/${req.file.filename}`;
//         }
//         const listing = new (require('../models/listing'))(listingData);
//         await listing.save();
//         res.redirect('/listings');
//       } catch (err) {
//         console.error(err);
//         next(err); // let your error handler handle it
//       }
//     }
//   );
function attachUploadedImageToBody(req, res, next) {
  req.body.listing = req.body.listing || {};
  if (req.file) {
    // Public path (since /public is served statically by app.js)
    req.body.listing.image = `/uploads/${req.file.filename}`;
  }
  next();
}

router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single('image'),         // <- multer listens for <input name="image">
    attachUploadedImageToBody,      // <- maps req.file -> req.body.listing.image
    validateListing,
    wrapAsync(listingController.createListing)
  );

// Create New Page Route ↓
router.get("/new", isLoggedIn, listingController.renderNewForm );

// Listing Show with Reviews, Listing Update and Listing Delete Route using (router.route) ↓
router
 .route("/:id")
 .get( wrapAsync( listingController.showListing ))
//  .put( isLoggedIn, isOwner, upload.single('listing[image]'), attachUploadedImageToBody, validateListing, wrapAsync( listingController.updateListing ))
.put(
  isLoggedIn,
  isOwner,
  upload.single('image'),         // changed here as well
  attachUploadedImageToBody,
  validateListing,
  wrapAsync(listingController.updateListing)
)

 .delete( isLoggedIn, isOwner,  wrapAsync( listingController.destroyListing ));

// Edit Page Route ↓
router.get("/edit/:id", isLoggedIn, isOwner, wrapAsync( listingController.renderEditForm ));

module.exports = router;
