import { v2 as cloudinary } from "cloudinary";
import medicineModel from "../models/medicineModel.js";
import cartModel from "../models/cartModel.js";
import orderModel from "../models/orderModel.js";
import wishlistModel from "../models/wishlistModel.js";

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

// Upload a buffer (from memoryStorage) to Cloudinary
const uploadToCloudinary = (buffer, mimetype) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "image", folder: "medibook/medicines" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(buffer);
  });
};

// ─────────────────────────────────────────────
// MEDICINE CONTROLLERS
// ─────────────────────────────────────────────

// POST /api/medicines/add  [admin]
const addMedicine = async (req, res) => {
  try {
    const { name, brand, description, price, stock, category, symptoms, latitude, longitude } =
      req.body;

    if (!name || !price) {
      return res
        .status(400)
        .json({ success: false, message: "Required fields missing: name, price." });
    }

    let imageUrl = "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      imageUrl = result.secure_url;
    }

    const medicine = new medicineModel({
      name,
      brand,
      description,
      price: Number(price),
      stock: stock ? Number(stock) : 0,
      image: imageUrl,
      category,
      symptoms: symptoms ? JSON.parse(symptoms) : [], // array sent as JSON string from form
      pharmacyLocation: { latitude, longitude }
    });

    await medicine.save();
    res.status(201).json({ success: true, message: "Medicine added successfully.", data: medicine });
  } catch (error) {
    console.error("[addMedicine]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/medicines/update/:id  [admin]
const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    // If a new image is uploaded, update it on Cloudinary
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
      updates.image = result.secure_url;
    }

    const updated = await medicineModel.findByIdAndUpdate(id, updates, { new: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
    }

    res.json({ success: true, message: "Medicine updated.", data: updated });
  } catch (error) {
    console.error("[updateMedicine]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/medicines/delete/:id  [admin]
const deleteMedicine = async (req, res) => {
  try {
    const deleted = await medicineModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
    }
    res.json({ success: true, message: "Medicine deleted successfully." });
  } catch (error) {
    console.error("[deleteMedicine]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/medicines/all  [public]
const viewAllMedicines = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, inStock } = req.query;
    const filter = {};

    if (category) filter.category = new RegExp(category, "i");
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (inStock === "true") filter.stock = { $gt: 0 };

    const medicines = await medicineModel.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: medicines });
  } catch (error) {
    console.error("[viewAllMedicines]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/medicines/:id  [public]
const getSingleMedicine = async (req, res) => {
  try {
    const medicine = await medicineModel.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
    }
    res.json({ success: true, data: medicine });
  } catch (error) {
    console.error("[getSingleMedicine]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/medicines/search/ocr?text=paracetamol  [public]
const searchMedicineByOCR = async (req, res) => {
  try {
    const { text } = req.query;
    if (!text) {
      return res.status(400).json({ success: false, message: "Search text is required." });
    }

    const regex = new RegExp(text, "i");
    const results = await medicineModel.find({
      $or: [{ name: regex }, { brand: regex }, { description: regex }, { category: regex }]
    });

    if (!results.length) {
      return res.status(404).json({ success: false, message: "No medicine found matching the text." });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("[searchMedicineByOCR]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/medicines/search?query=fever  [public]
const searchMedicinesByTextOrSymptoms = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: "Search query is required." });
    }

    const regex = new RegExp(query, "i");
    const results = await medicineModel.find({
      $or: [
        { name: regex },
        { brand: regex },
        { description: regex },
        { category: regex },
        { symptoms: regex }
      ]
    });

    if (!results.length) {
      return res.status(404).json({ success: false, message: "No matching medicines found." });
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("[searchMedicinesByTextOrSymptoms]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// CART CONTROLLERS
// ─────────────────────────────────────────────

// GET /api/cart  [user]
const getCart = async (req, res) => {
  try {
    const { userId } = req.body;
    const cart = await cartModel
      .findOne({ userId })
      .populate("items.medicineId", "name brand price image stock");

    if (!cart) {
      return res.json({ success: true, data: { items: [] } });
    }
    res.json({ success: true, data: cart });
  } catch (error) {
    console.error("[getCart]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/cart/add  [user]
const addToCart = async (req, res) => {
  try {
    const { userId, medicineId, quantity = 1 } = req.body;

    if (!medicineId) {
      return res.status(400).json({ success: false, message: "medicineId is required." });
    }

    // Check medicine exists and has stock
    const medicine = await medicineModel.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
    }
    if (medicine.stock < quantity) {
      return res.status(400).json({ success: false, message: "Insufficient stock." });
    }

    let cart = await cartModel.findOne({ userId });

    if (!cart) {
      // Create new cart for user
      cart = new cartModel({ userId, items: [{ medicineId, quantity }] });
    } else {
      const existing = cart.items.find(
        (item) => item.medicineId.toString() === medicineId
      );
      if (existing) {
        existing.quantity += Number(quantity);
      } else {
        cart.items.push({ medicineId, quantity });
      }
    }

    await cart.save();
    res.json({ success: true, message: "Item added to cart.", data: cart });
  } catch (error) {
    console.error("[addToCart]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/cart/update  [user]
const updateCartItem = async (req, res) => {
  try {
    const { userId, medicineId, quantity } = req.body;

    if (!medicineId || quantity === undefined) {
      return res.status(400).json({ success: false, message: "medicineId and quantity are required." });
    }
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1. Use remove to delete." });
    }

    const cart = await cartModel.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found." });
    }

    const item = cart.items.find((i) => i.medicineId.toString() === medicineId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not in cart." });
    }

    item.quantity = Number(quantity);
    await cart.save();
    res.json({ success: true, message: "Cart updated.", data: cart });
  } catch (error) {
    console.error("[updateCartItem]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/cart/remove/:medicineId  [user]
const removeFromCart = async (req, res) => {
  try {
    const { userId } = req.body;
    const { medicineId } = req.params;

    const cart = await cartModel.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found." });
    }

    cart.items = cart.items.filter((i) => i.medicineId.toString() !== medicineId);
    await cart.save();
    res.json({ success: true, message: "Item removed from cart.", data: cart });
  } catch (error) {
    console.error("[removeFromCart]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/cart/clear  [user]
const clearCart = async (req, res) => {
  try {
    const { userId } = req.body;
    const cart = await cartModel.findOne({ userId });
    if (!cart) {
      return res.json({ success: true, message: "Cart already empty." });
    }
    cart.items = [];
    await cart.save();
    res.json({ success: true, message: "Cart cleared." });
  } catch (error) {
    console.error("[clearCart]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// ORDER CONTROLLERS
// ─────────────────────────────────────────────

// POST /api/orders/place  [user]
const placeOrder = async (req, res) => {
  try {
    const { userId, deliveryAddress, paymentMethod = "COD" } = req.body;

    if (!deliveryAddress) {
      return res.status(400).json({ success: false, message: "Delivery address is required." });
    }

    const cart = await cartModel
      .findOne({ userId })
      .populate("items.medicineId", "name price stock");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty." });
    }

    // Validate stock and build order items with price snapshot
    const orderItems = [];
    for (const item of cart.items) {
      const med = item.medicineId;
      if (med.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${med.name}.`
        });
      }
      orderItems.push({
        medicineId: med._id,
        name:       med.name,  // price snapshot
        price:      med.price, // price snapshot
        quantity:   item.quantity
      });
    }

    // Calculate total
    const totalAmount = orderItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    // Deduct stock
    for (const item of orderItems) {
      await medicineModel.findByIdAndUpdate(item.medicineId, {
        $inc: { stock: -item.quantity }
      });
    }

    // Create order
    const order = new orderModel({
      userId,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      paymentMethod,
      paymentStatus: paymentMethod === "Online" ? "Paid" : "Unpaid"
    });
    await order.save();

    // Clear cart after successful order
    cart.items = [];
    await cart.save();

    // TODO Phase 2: publish order.placed to Kafka here

    res.status(201).json({ success: true, message: "Order placed successfully.", data: order });
  } catch (error) {
    console.error("[placeOrder]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/my  [user]
const getMyOrders = async (req, res) => {
  try {
    const { userId } = req.body;
    const orders = await orderModel
      .find({ userId })
      .populate("items.medicineId", "name image")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("[getMyOrders]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/:id  [user]
const getOrderById = async (req, res) => {
  try {
    const { userId } = req.body;
    const order = await orderModel
      .findOne({ _id: req.params.id, userId })
      .populate("items.medicineId", "name image brand");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error("[getOrderById]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/orders/:id/cancel  [user]
const cancelOrder = async (req, res) => {
  try {
    const { userId } = req.body;
    const order = await orderModel.findOne({ _id: req.params.id, userId });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }
    if (order.status === "Shipped" || order.status === "Delivered") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order that is already ${order.status}.`
      });
    }
    if (order.status === "Cancelled") {
      return res.status(400).json({ success: false, message: "Order is already cancelled." });
    }

    // Restore stock
    for (const item of order.items) {
      await medicineModel.findByIdAndUpdate(item.medicineId, {
        $inc: { stock: item.quantity }
      });
    }

    order.status = "Cancelled";
    order.cancelledAt = new Date();
    await order.save();

    res.json({ success: true, message: "Order cancelled successfully.", data: order });
  } catch (error) {
    console.error("[cancelOrder]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/admin/all  [admin]
const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const orders = await orderModel
      .find(filter)
      .populate("userId", "name email")
      .populate("items.medicineId", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("[getAllOrders]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/orders/admin/:id/status  [admin]
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Shipped", "Delivered", "Cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    const order = await orderModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    res.json({ success: true, message: "Order status updated.", data: order });
  } catch (error) {
    console.error("[updateOrderStatus]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// WISHLIST CONTROLLERS
// ─────────────────────────────────────────────

// GET /api/wishlist  [user]
const getWishlist = async (req, res) => {
  try {
    const { userId } = req.body;
    const wishlist = await wishlistModel
      .findOne({ userId })
      .populate("medicines", "name brand price image stock");

    if (!wishlist) {
      return res.json({ success: true, data: { medicines: [] } });
    }
    res.json({ success: true, data: wishlist });
  } catch (error) {
    console.error("[getWishlist]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/wishlist/add  [user]
const addToWishlist = async (req, res) => {
  try {
    const { userId, medicineId } = req.body;

    if (!medicineId) {
      return res.status(400).json({ success: false, message: "medicineId is required." });
    }

    const medicine = await medicineModel.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ success: false, message: "Medicine not found." });
    }

    let wishlist = await wishlistModel.findOne({ userId });

    if (!wishlist) {
      wishlist = new wishlistModel({ userId, medicines: [medicineId] });
    } else {
      const alreadyIn = wishlist.medicines.some((m) => m.toString() === medicineId);
      if (alreadyIn) {
        return res.json({ success: true, message: "Already in wishlist.", data: wishlist });
      }
      wishlist.medicines.push(medicineId);
    }

    await wishlist.save();
    res.json({ success: true, message: "Added to wishlist.", data: wishlist });
  } catch (error) {
    console.error("[addToWishlist]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/wishlist/remove/:medicineId  [user]
const removeFromWishlist = async (req, res) => {
  try {
    const { userId } = req.body;
    const { medicineId } = req.params;

    const wishlist = await wishlistModel.findOne({ userId });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: "Wishlist not found." });
    }

    wishlist.medicines = wishlist.medicines.filter((m) => m.toString() !== medicineId);
    await wishlist.save();
    res.json({ success: true, message: "Removed from wishlist.", data: wishlist });
  } catch (error) {
    console.error("[removeFromWishlist]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────
export {
  // Medicine
  addMedicine,
  updateMedicine,
  deleteMedicine,
  viewAllMedicines,
  getSingleMedicine,
  searchMedicineByOCR,
  searchMedicinesByTextOrSymptoms,
  // Cart
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  // Orders
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  // Wishlist
  getWishlist,
  addToWishlist,
  removeFromWishlist
};