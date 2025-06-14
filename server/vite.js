const { createServer } = require("vite");
const path = require("path");

function log(message, source = "express") {
  const formattedTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date());

  console.log(`${formattedTime} [${source}] ${message}`);
}

async function setupVite(app, server) {
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true,
    },
    appType: "spa",
    root: path.resolve("client"),
  });

  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
}

function serveStatic(app) {
  app.use(require("serve-static")(path.resolve("dist/client")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve("dist/client/index.html"));
  });
}

module.exports = { log, setupVite, serveStatic };