// scripts/migrateImagesToString.js
const mongoose = require('mongoose');
const Listing = require('../models/listing'); // adjust path if needed

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/Airbnb'); // replace "Airbnb" if DB name is different
  console.log("Connected to MongoDB");

  const listings = await Listing.find({});
  for (const l of listings) {
    if (l.image && typeof l.image === 'object' && l.image.url) {
      l.image = l.image.url; // flatten object to string
      await l.save();
      console.log("Updated listing:", l._id.toString());
    }
  }

  await mongoose.disconnect();
  console.log("Migration complete!");
}

main().catch(err => {
  console.error("Error:", err);
});
