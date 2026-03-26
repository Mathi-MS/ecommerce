import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api", router);

// Catch-all route for debugging - must use proper Express syntax
app.all("*", (req, res) => {
  logger.warn({ url: req.originalUrl, method: req.method }, "Route not found");
  res.status(404).json({ 
    error: "Route not found", 
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      "GET /api/healthz",
      "GET /api/products",
      "GET /api/cart",
      "POST /api/auth/google-signin"
    ]
  });
});

export default app;
