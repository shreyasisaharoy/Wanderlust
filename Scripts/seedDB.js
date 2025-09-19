// scripts/seedDB.js
const mongoose = require("mongoose");
const Listing = require("../models/listing");
const { data: sampleListings } = require("../init/data");

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/Airbnb");
  console.log("Connected to MongoDB");

  await Listing.deleteMany({});

  const docs = sampleListings.map(item => {
    let imageObj = null;
    if (!item.image) {
      imageObj = { url: "", filename: "" };
    } else if (typeof item.image === "string") {
      imageObj = { url: item.image, filename: "" };
    } else if (typeof item.image === "object") {
      imageObj = {
        url: item.image.url || "",
        filename: item.image.filename || ""
      };
    }

    return {
      title: item.title,
      description: item.description,
      price: item.price,
      location: item.location,
      country: item.country,
      // IMPORTANT: do NOT insert "General" here; use empty string to match schema enum [""].
      category: item.category || "",
      owner: item.owner || undefined,
      reviews: item.reviews || [],
      image: imageObj
    };
  });

  try {
    await Listing.insertMany(docs);
    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Insert error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
