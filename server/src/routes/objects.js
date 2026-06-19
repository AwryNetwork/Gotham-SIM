import { Router } from "express";
import { upsertImportedObjects, listImportedObjects } from "../db.js";
import { requireRole } from "../auth.js";

export const objectsRouter = Router();

objectsRouter.get("/imported", (req, res) => {
  res.json({ entities: listImportedObjects() });
});

objectsRouter.post("/import", requireRole("Analyst", "Admin"), (req, res) => {
  const { entities } = req.body || {};
  if (!Array.isArray(entities) || entities.length === 0) {
    return res.status(400).json({ error: "entities array is required" });
  }
  upsertImportedObjects(entities, req.user.sub);
  res.status(201).json({ count: entities.length });
});
