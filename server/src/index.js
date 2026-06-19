import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "node:http";
import { authRouter } from "./routes/auth.js";
import { feedsRouter } from "./routes/feeds.js";
import { tasksRouter } from "./routes/tasks.js";
import { objectsRouter } from "./routes/objects.js";
import { requireAuth } from "./auth.js";
import { createAisRelay } from "./aisRelay.js";
import "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/feeds", requireAuth, feedsRouter);
app.use("/api/tasks", requireAuth, tasksRouter);
app.use("/api/objects", requireAuth, objectsRouter);

const PORT = process.env.PORT || 8787;
const server = http.createServer(app);
createAisRelay(server);

server.listen(PORT, () => {
  console.log(`[server] Gotham Sim backend listening on http://localhost:${PORT}`);
  console.log(`[server] AIS relay available at ws://localhost:${PORT}/ws/ais`);
});
