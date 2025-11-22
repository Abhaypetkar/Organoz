const mongoose = require("mongoose");
const Tenant = require("../models/Tenant");

const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/organoz";

async function run() {
  await mongoose.connect(MONGO);
  console.log("Connected.");

  const exists = await Tenant.findOne({ slug: "village1" });
  if (exists) {
    console.log("Tenant already exists:", exists);
    process.exit(0);
  }

  const tenant = await Tenant.create({
    name: "Village One",
    slug: "village1",
    adminContact: "9876543210",
    address: {
      line1: "Village One Center",
      city: "Village One",
      state: "MH",
      pincode: "413000",
    },
  });

  console.log("Created tenant:", tenant);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
