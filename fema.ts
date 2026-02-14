import { Router } from "express";
import { getFemaDisasters } from "../services/fema.js";

export const femaRouter = Router();

femaRouter.get("/", async (req, res) => {
  try {
    const limit = Number(req.query.limit ?? 50);
    const data = await getFemaDisasters(limit);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch FEMA data" });
  }
});
