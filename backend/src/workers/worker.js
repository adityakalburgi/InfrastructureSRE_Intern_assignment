import { Worker } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { processSignal } from "../services/signal.service.js";

const prisma = new PrismaClient();

const connection = new IORedis({
  maxRetriesPerRequest: null
});

new Worker(
  "q",
  async (job) => {
    await processSignal(job.data);
  },
  { connection }
);