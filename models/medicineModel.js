import mongoose from "mongoose";

const medicineSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  brand:       { type: String, trim: true },
  description: { type: String },
  price:       { type: Number, required: true, min: 0 },
  stock:       { type: Number, default: 0, min: 0 },
  image:       { type: String, default: "" },
  category:    { type: String },
  symptoms:    [{ type: String }], // ← ADDED — controller searches this field
  pharmacyLocation: {
    latitude:  Number,
    longitude: Number
  },
  createdAt:   { type: Date, default: Date.now }
});

const medicineModel =
  mongoose.models.medicine || mongoose.model("medicine", medicineSchema);

export default medicineModel;