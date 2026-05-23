import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { createServer } from "http";
import { ChessRoom } from "./rooms/ChessRoom";
import { monitor } from "@colyseus/monitor";

const port = Number(process.env.PORT) || 2567;

const app = express();
app.use(express.json());

const httpServer = createServer(app);

const corsHandler = cors({
  origin: true,
  credentials: true,
});

app.use(corsHandler);

httpServer.on("request", (req, res) => {
  if (req.url?.startsWith("/matchmake/")) {
    corsHandler(req, res, () => {
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
      }
    });
  }
});

const gameServer = new Server({
  server: httpServer,
});

gameServer.define("chess_room", ChessRoom);

app.get("/", (_req, res) => res.send("Dark Chess server running"));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/colyseus", monitor());

gameServer.listen(port);
console.log(`⚔️ Dark Chess server running on ws://localhost:${port}`);
