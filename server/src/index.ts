import express from "express";
import cors from "cors";
import { Server } from "colyseus";
import { createServer } from "http";
import { ChessRoom } from "./rooms/ChessRoom";
import { monitor } from "@colyseus/monitor";

const port = Number(process.env.PORT) || 2567;

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const gameServer = new Server({
  server: httpServer,
});

gameServer.define("chess_room", ChessRoom);

app.use("/colyseus", monitor());

gameServer.listen(port);
console.log(`⚔️ Dark Chess server running on ws://localhost:${port}`);
