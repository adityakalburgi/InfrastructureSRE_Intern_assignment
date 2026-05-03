import { PrismaClient } from "@prisma/client";
import Signal from "../models/signal.model.js";

const prisma = new PrismaClient();
const debounceMap = new Map();

export const processSignal = async (data, io) => {
  const key = data.component_id;

  let entry = debounceMap.get(key);

  if (!entry || Date.now() - entry.time > 10000) {
    const workItem = await prisma.workItem.create({
      data: {
        component_id: data.component_id,
        status: "OPEN",
        severity: data.component_id.includes("DB") ? "P0" : "P2",
        start_time: new Date()
      }
    });

    debounceMap.set(key, {
      workItemId: workItem.id,
      time: Date.now()
    });

    entry = debounceMap.get(key);
    
    // Emit new work item event
    if (io) {
      io.emit("workitem:created", workItem);
    }
  }

  // Store signal in MongoDB (optional - only if MongoDB is available)
  try {
    await Signal.create({
      ...data,
      work_item_id: entry.workItemId
    });
  } catch (err) {
    console.warn("MongoDB not available - signal not stored");
  }
  
  // Emit signal event
  if (io) {
    io.emit("signal:created", data);
  }
};
