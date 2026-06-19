import { Router } from "express";
import { randomUUID } from "node:crypto";
import { insertTask, listTasks, updateTaskStatus } from "../db.js";
import { requireRole } from "../auth.js";

export const tasksRouter = Router();

tasksRouter.get("/", (req, res) => {
  res.json({ tasks: listTasks() });
});

tasksRouter.post("/", requireRole("Analyst", "Admin"), (req, res) => {
  const { type, payload } = req.body || {};
  if (!type || !payload) return res.status(400).json({ error: "type and payload are required" });
  const task = {
    id: randomUUID(),
    type,
    payload,
    status: "proposed",
    createdBy: req.user.sub,
    createdAt: new Date().toISOString(),
  };
  insertTask(task);
  res.status(201).json({ task });
});

tasksRouter.patch("/:id/status", requireRole("Analyst", "Admin"), (req, res) => {
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: "status is required" });
  updateTaskStatus(req.params.id, status);
  res.json({ ok: true });
});
