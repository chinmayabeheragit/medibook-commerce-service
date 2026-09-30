import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  items: [
    {
      medicineId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "medicine",
        required: true
      },
      name:     { type: String, required: true }, // snapshot at time of order
      price:    { type: Number, required: true }, // snapshot at time of order
      quantity: { type: Number, required: true, min: 1 }
    }
  ],
  totalAmount:     { type: Number, required: true },
  deliveryAddress: { type: String, required: true },
  paymentMethod:   { type: String, enum: ["COD", "Online"], default: "COD" },
  paymentStatus:   { type: String, enum: ["Unpaid", "Paid"], default: "Unpaid" },
  status: {
    type: String,
    enum: ["Pending", "Shipped", "Delivered", "Cancelled"],
    default: "Pending"
  },
  cancelledAt: { type: Date },
  createdAt:   { type: Date, default: Date.now }
});

const orderModel =
  mongoose.models.order || mongoose.model("order", orderSchema);

export default orderModel;