import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true // one wishlist doc per user
    },
    medicines: [{ type: mongoose.Schema.Types.ObjectId, ref: "medicine" }]
  },
  { timestamps: true }
);

const wishlistModel =
  mongoose.models.wishlist || mongoose.model("wishlist", wishlistSchema);

export default wishlistModel;