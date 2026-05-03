import { processSignal } from "../services/signal.service.js";

const createSignal = async (req, res) => {
  try {
    const io = req.app.get("io");
    await processSignal(req.body, io);
    res.status(200).json({ message: "Signal processed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process signal" });
  }
};

export default createSignal;
