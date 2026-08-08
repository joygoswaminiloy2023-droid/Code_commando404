const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    path: "/socket.io"
  });

  // Every connected client joins a room keyed to their user id (sent from the client
  // right after connecting) so we can target notifications precisely, plus a shared
  // "broadcast" room for announcements and the admin activity feed.
  io.on("connection", (socket) => {
    socket.on("identify", (userId) => {
      if (userId) socket.join(`user:${userId}`);
      socket.join("broadcast");
    });
  });

  // Expose io globally so API route handlers (running in the same Node process
  // because we use a custom server instead of the default Next.js server) can
  // emit events without needing a separate pub/sub layer.
  global.__io = io;

  httpServer.listen(port, () => {
    console.log(`> TaskFlow ready on http://${hostname}:${port}`);
  });
});
