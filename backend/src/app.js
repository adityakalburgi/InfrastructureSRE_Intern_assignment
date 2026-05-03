
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import mongoose from "mongoose";
import signalRoutes from "./controllers/signal.controller.js";
import workItemRoutes from "./controllers/workitem.controller.js";
import rateLimit from "./middleware/rateLimiter.js";

const prisma = new PrismaClient();

// Connect to MongoDB (optional - app works without it)
mongoose.connect("mongodb://localhost:27017/ims").catch(err => {
  console.warn("MongoDB not available - running in limited mode");
});

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(cors());
app.use(express.json());
app.use(rateLimit);

// Make io available to routes
app.set("io", io);

app.use("/signal", signalRoutes);
app.use("/workitem", workItemRoutes);

app.get("/health", (req,res)=>res.json({status:"OK"}));

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

setInterval(()=>console.log("Throughput tracking active"),5000);

server.listen(5000, ()=>console.log("Server running on port 5000"));
