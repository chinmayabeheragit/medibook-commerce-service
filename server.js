import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import medchineRouter from "./routes/medchineRoute.js";

// app config
const app = express();
const port = process.env.PORT 

connectDB();
connectCloudinary();

// middlewares
app.use(express.json());
app.use(cors());

// api endpoints — this service ONLY owns medicine/commerce concerns
app.use("/api/medicines", medchineRouter);

app.get("/", (req, res) => {
  res.send("MediBook Commerce Service is running");
});

app.listen(port, () =>
  console.log(`Commerce Service started on PORT:${port}`)
);