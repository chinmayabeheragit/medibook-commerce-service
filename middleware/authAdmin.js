import jwt from "jsonwebtoken"

// admin authentication middleware
const authAdmin = async (req, res, next) => {
  try {

    
    const { atoken } = req.headers;
    console.log("TOKEN RECEIVED:", atoken);
    
    if (!atoken) {
      return res.status(401).json({ success: false, message: "Not authorized. Login again." });
    }

    const token_decode = jwt.verify(atoken, process.env.JWT_SECRET);
    console.log("DECODED:", token_decode);
    console.log("ADMIN EMAIL FROM ENV:", process.env.ADMIN_EMAIL);
    console.log("MATCH:", token_decode.email === process.env.ADMIN_EMAIL);

    if (token_decode.email !== process.env.ADMIN_EMAIL) {
      return res.status(401).json({ success: false, message: "Not authorized. Login again." });
    }

    next();
  } catch (error) {
    console.error("[authAdmin]", error);
    res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

export default authAdmin;