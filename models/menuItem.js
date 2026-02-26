// menuItem.model.js
const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: Number,
  category: { type: String, required: true }, // drinks, snacks, desserts, lunch
});

module.exports = mongoose.model("MenuItem", menuItemSchema);
