import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { createServer } from "http";
import next from "next";
import { ChessRoom } from "./rooms/ChessRoom";
import { monitor } from "@colyseus/monitor";

const port = Number(process.env.PORT) || 2567;
const dev = process.env.NODE_ENV !== "production";

const nextApp = next({ dev, dir: "./web" });
const handle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
  const app = express();

  const corsHandler = cors({ origin: true, credentials: true });
  app.use(corsHandler);
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  const httpServer = createServer(app);

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

  const gameServer = new Server({ server: httpServer });
  gameServer.define("chess_room", ChessRoom);

  app.use("/colyseus", monitor());
  app.all("*", (req, res) => handle(req, res));

  httpServer.listen(port);
  console.log(`⚔️ Dark Chess running on port ${port}`);
});
