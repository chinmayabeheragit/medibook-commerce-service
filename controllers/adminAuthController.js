import jwt from "jsonwebtoken";

// Temporary admin login for Commerce Service
// This moves to Core Service in Phase 2
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required." });
    }

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      // Same token format as monolith — email+password string signed
      const token = jwt.sign({ email: email }, process.env.JWT_SECRET);
      return res.json({ success: true, token });
    }

    res.status(401).json({ success: false, message: "Invalid credentials." });
  } catch (error) {
    console.error("[loginAdmin]", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default loginAdmin;