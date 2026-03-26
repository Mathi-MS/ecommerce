import { Router, type IRouter } from "express";
import { connectDB } from "../db/index.js";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    await connectDB();
    res.json({ 
      status: "ok", 
      database: "connected",
      timestamp: new Date().toISOString(),
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        hasMongoUri: !!process.env.MONGODB_URI || !!process.env.DATABASE_URL
      }
    });
  } catch (error) {
    res.status(500).json({ 
      status: "error", 
      database: "disconnected",
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

router.get("/", (_req, res) => {
  res.json({ 
    message: "Elowell API Server", 
    status: "running",
    timestamp: new Date().toISOString()
  });
});

export default router;
