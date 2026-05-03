
import express from "express";
import { PrismaClient } from "@prisma/client";
import Signal from "../models/signal.model.js";

const prisma = new PrismaClient();
const r = express.Router();

r.get("/", async (req, res) => {
  const items = await prisma.workItem.findMany();
  res.json(items);
});

r.get("/:id", async (req, res) => {
  const item = await prisma.workItem.findUnique({ where: { id: req.params.id } });
  let signals = [];
  try {
    signals = await Signal.find({ work_item_id: req.params.id });
  } catch (err) {
    console.warn("MongoDB not available - cannot fetch signals");
  }
  res.json({ item, signals });
});

r.post("/:id/rca", async (req, res) => {
  const existingItem = await prisma.workItem.findUnique({ where: { id: req.params.id } });
  
  if (!existingItem) {
    return res.status(404).json({ error: "Work item not found" });
  }
  
  // Calculate actual MTTR
  const startTime = new Date(existingItem.start_time).getTime();
  const endTime = new Date().getTime();
  const mttr = (endTime - startTime) / 1000 / 60; // in minutes
  
  const item = await prisma.workItem.update({
    where: { id: req.params.id },
    data: {
      rca: req.body.rca,
      root_cause_category: req.body.root_cause_category,
      fix_applied: req.body.fix_applied,
      prevention_steps: req.body.prevention_steps,
      end_time: new Date(),
      mttr: mttr,
      status: "CLOSED"
    }
  });
  
  // Emit RCA added event
  const io = req.app.get("io");
  if (io) {
    io.emit("workitem:resolved", item);
  }
  
  res.json(item);
});

export default r;
