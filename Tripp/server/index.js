import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoutes from "./api/routes/user.route.js";
import authRoutes from "./api/routes/auth.route.js";
import cookieParser from "cookie-parser";

dotenv.config();

mongoose
  .connect(process.env.MONGO_DB_URL)
  .then(() => {
    console.log("Connected to MongoDB !");
  })
  .catch((err) => {
    console.log("Failed to connect to MongoDB !", err);
  });

const app = express();

app.use(express.json());
app.use(cookieParser());

app.listen(3000, () => {
  console.log("Server is listening on port 3000 !");
});

app.use("/api/user", userRoutes);
app.use("/api/auth", authRoutes);

//middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    message,
    statusCode,
  });
});
