import express from "express";
import upload from "../middleware/multer.js";
import authAdmin from "../middleware/authAdmin.js";
import authUser from "../middleware/authUser.js";
import {
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
} from "../controllers/medchineController.js";

const router = express.Router();

// ─────────────────────────────────────────────
// MEDICINE ROUTES
// ─────────────────────────────────────────────
router.post("/add",          authAdmin, upload.single("image"), addMedicine);
router.put("/update/:id",    authAdmin, upload.single("image"), updateMedicine);
router.delete("/delete/:id", authAdmin, deleteMedicine);

router.get("/all",           viewAllMedicines);
router.get("/search/ocr",    searchMedicineByOCR);          // ?text=paracetamol
router.get("/search",        searchMedicinesByTextOrSymptoms); // ?query=fever
router.get("/:id",           getSingleMedicine);

// ─────────────────────────────────────────────
// CART ROUTES
// ─────────────────────────────────────────────
router.get("/cart",                   authUser, getCart);
router.post("/cart/add",              authUser, addToCart);
router.put("/cart/update",            authUser, updateCartItem);
router.delete("/cart/remove/:medicineId", authUser, removeFromCart);
router.delete("/cart/clear",          authUser, clearCart);

// ─────────────────────────────────────────────
// ORDER ROUTES
// ─────────────────────────────────────────────
router.post("/orders/place",              authUser,  placeOrder);
router.get("/orders/my",                  authUser,  getMyOrders);
router.get("/orders/admin/all",           authAdmin, getAllOrders);       // ?status=Pending
router.put("/orders/admin/:id/status",    authAdmin, updateOrderStatus);
router.get("/orders/:id",                 authUser,  getOrderById);
router.put("/orders/:id/cancel",          authUser,  cancelOrder);

// ─────────────────────────────────────────────
// WISHLIST ROUTES
// ─────────────────────────────────────────────
router.get("/wishlist",                  authUser, getWishlist);
router.post("/wishlist/add",             authUser, addToWishlist);
router.delete("/wishlist/remove/:medicineId", authUser, removeFromWishlist);

export default router;