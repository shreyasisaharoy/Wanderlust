// controllers/listings.js
const Listing = require('../models/listing.js');
const escapeRegex = require('../utils/escapeRegex'); // ensure this file is at /utils/escapeRegex.js

// ------------------- Index -------------------
module.exports.index = async (req, res, next) => {
  try {
    const search = req.query.search;
    let allListings;

    if (search && search.trim() !== '') {
      const safe = escapeRegex(search.trim());
      const regex = new RegExp(safe, 'i'); // case-insensitive

      allListings = await Listing.find({
        $or: [
          { title: regex },
          { description: regex },
          { location: regex },
        ],
      });
    } else {
      allListings = await Listing.find({});
    }

    res.render('listings/index.ejs', { allListings, searchQuery: search || '' });
  } catch (err) {
    next(err);
  }
};

// ------------------- Render New Form -------------------
module.exports.renderNewForm = (req, res) => {
  res.render('listings/new.ejs');
};

// ------------------- Show Listing -------------------
module.exports.showListing = async (req, res, next) => {
  try {
    let { id } = req.params;
    const listing = await Listing.findById(id)
      .populate({
        path: 'reviews',
        populate: { path: 'author' },
      })
      .populate('owner');
    if (!listing) {
      req.flash('error', 'Listing Your Requested For Does Not Exist !');
      return res.redirect('/listings');
    }
    res.render('listings/show.ejs', { listing });
  } catch (err) {
    next(err);
  }
};

// ------------------- Create Listing -------------------
module.exports.createListing = async (req, res, next) => {
  console.log('DEBUG req.file =', req.file);
  console.log('DEBUG req.body.listing =', req.body.listing);

  try {
    const newListing = new Listing(req.body.listing || {});
    newListing.owner = req.user && req.user._id ? req.user._id : undefined;

    if (req.file) {
      // ✅ Always save a web-accessible relative path
      const url = `/uploads/${req.file.filename}`;
      const filename = req.file.filename;
      newListing.image = { url, filename };
    } else if (req.body.listing && req.body.listing.image) {
      const imageVal = req.body.listing.image;
      if (typeof imageVal === 'string' && imageVal.trim()) {
        newListing.image = { url: imageVal, filename: imageVal.split('/').pop() };
      } else if (imageVal && imageVal.url) {
        newListing.image = imageVal;
      }
    }

    let savedListing = await newListing.save();
    console.log('Saved listing:', savedListing);
    req.flash('success', 'New Listing Created!');
    res.redirect('/listings');
  } catch (err) {
    next(err);
  }
};

// ------------------- Render Edit Form -------------------
module.exports.renderEditForm = async (req, res, next) => {
  try {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
      req.flash('error', 'Listing Your Requested For Does Not Exist !');
      return res.redirect('/listings');
    }
    let originalImageUrl = listing.image && listing.image.url ? listing.image.url : '';
    if (originalImageUrl && originalImageUrl.includes('/upload')) {
      originalImageUrl = originalImageUrl.replace(
        '/upload',
        '/upload/c_scale,h_250,w_370/',
      );
    }
    res.render('listings/edit.ejs', { listing, originalImageUrl });
  } catch (err) {
    next(err);
  }
};

// ------------------- Update Listing -------------------
module.exports.updateListing = async (req, res, next) => {
  try {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { new: true });

    if (req.file) {
      // ✅ Always save a web-accessible relative path
      const url = `/uploads/${req.file.filename}`;
      const filename = req.file.filename;
      listing.image = { url, filename };
      await listing.save();
    } else if (req.body.listing && req.body.listing.image) {
      const imageVal = req.body.listing.image;
      if (typeof imageVal === 'string' && imageVal.trim()) {
        listing.image = { url: imageVal, filename: imageVal.split('/').pop() };
        await listing.save();
      } else if (imageVal && imageVal.url) {
        listing.image = imageVal;
        await listing.save();
      }
    }

    req.flash('success', 'Updated Listing !');
    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err);
  }
};

// ------------------- Destroy Listing -------------------
module.exports.destroyListing = async (req, res, next) => {
  try {
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash('success', 'Deleted Listing !');
    res.redirect('/listings');
  } catch (err) {
    next(err);
  }
};
