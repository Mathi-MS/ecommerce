import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import { connectDB } from "./db/index.js";

const rawPort = process.env["PORT"] || "3000";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Test database connection on startup
async function startServer() {
  try {
    logger.info('Starting server...');
    
    // Test database connection
    await connectDB();
    logger.info('Database connected successfully');
    
    // Start HTTP server
    app.listen(port, "0.0.0.0", (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }

      logger.info({ port }, "Server listening");
    });
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    console.error('Startup error:', error);
    process.exit(1);
  }
}

startServer();
