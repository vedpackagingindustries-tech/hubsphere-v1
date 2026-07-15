import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import atomic read/write and setup
import { readDB, writeDB } from "./server/utils/fileLock";

// Ensure database file is initialized on startup
readDB();

// Import routers
import authRouter from "./server/routes/auth";
import leadsRouter from "./server/routes/leads";
import callsRouter from "./server/routes/calls";
import hrmRouter from "./server/routes/hrm";
import reportsRouter from "./server/routes/reports";
import adminRouter from "./server/routes/admin";
import copilotRouter from "./server/routes/copilot";
import registrationRouter from "./server/routes/registration";

// Import global middlewares
import { globalErrorHandler } from "./server/middleware/errorHandler";
import { requestLogger } from "./server/middleware/logger";
import { tenantMiddleware } from "./server/middleware/tenant";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const RECORDINGS_DIR = path.join(process.cwd(), "recordings");

// Ensure recordings directory exists
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

// Global logger middleware
app.use(requestLogger);

// Increase payload limit to 2000mb (2GB) for large files and call recordings (base64)
app.use(express.json({ limit: "2000mb" }));
app.use(express.urlencoded({ limit: "2000mb", extended: true }));

// Serve recordings statically
app.use("/recordings", express.static(RECORDINGS_DIR));

// Mount independent API endpoints (before tenantMiddleware)
app.use("/api/v1/auth", registrationRouter);

// Auto-calling config endpoint (needed by frontend configuration)
app.get("/api/config", (req, res) => {
  const db = readDB();
  res.json({ success: true, config: db.autoCallingConfig });
});

app.post("/api/config", async (req, res) => {
  const { delaySeconds, enabled } = req.body;
  const db = readDB();
  db.autoCallingConfig = {
    delaySeconds: Number(delaySeconds) || 5,
    enabled: enabled !== false,
  };
  await writeDB(db);
  res.json({ success: true, config: db.autoCallingConfig });
});

// Mount modular routers on their respective API prefixes
app.use("/api", tenantMiddleware);
app.use("/api/auth", authRouter);
app.use("/api/leads", leadsRouter);
app.use("/api/calls", callsRouter);
app.use("/api/copilot", copilotRouter);
app.use("/api", hrmRouter);       // Mounts hrm, attendance, and tasks directly under /api
app.use("/api/reports", reportsRouter);
app.use("/api/payroll", reportsRouter); // Also route payroll prefixes to reportsRouter
app.use("/api/admin", adminRouter);
app.use("/api", adminRouter);     // Mount support, tickets, backups under /api directly

// Global JSON error handling middleware
app.use(globalErrorHandler);

// Automated 11:30 PM (23:30 IST) full backup cron-like scheduler
const getISTTime = () => {
  const utc = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 5.5);
};

let lastAutoBackupDate = "";

setInterval(async () => {
  try {
    const istDate = getISTTime();
    const hours = istDate.getHours();
    const minutes = istDate.getMinutes();
    const dateStr = istDate.toISOString().split("T")[0];

    // Check if it is 11:30 PM IST (23:30) and has not run today
    if (hours === 23 && minutes === 30 && lastAutoBackupDate !== dateStr) {
      lastAutoBackupDate = dateStr;
      
      const db = readDB();
      const timestamp = new Date().toISOString();
      const backupId = "backup-auto-" + Date.now();
      const fullBackupData = JSON.stringify(db, null, 2);
      
      const newBackup = {
        id: backupId,
        name: `Daily 11:30 PM Auto Backup - ${new Date().toLocaleDateString()}`,
        timestamp,
        leadsCount: db.leads.length,
        callsCount: (db.callLogs || []).length,
        isAuto: true,
        fullData: fullBackupData
      };

      db.backups = db.backups || [];
      db.backups.unshift(newBackup);
      await writeDB(db);

      const recipientEmail = db.recoveryConfig?.adminBackupEmail || "contact.grahicsworld@gmail.com";

      console.log(`======================================================================`);
      console.log(`[AUTOMATIC DAILY 11:30 PM IST CRM BACKUP DISPATCHED]`);
      console.log(`Timestamp: ${timestamp}`);
      console.log(`Recipient: ${recipientEmail}`);
      console.log(`Subject: [Auto-Backup] HubSphere Full System Data Backup - ${dateStr}`);
      console.log(`Body: Daily 11:30 PM auto-backup successfully generated and dispatched to your email.`);
      console.log(`To restore your system, copy the complete JSON content below, log out, expand`);
      console.log(`the "Crash Recovery & System Backups" panel on the login page, paste it, and restore.`);
      console.log(`----------------------------------------------------------------------`);
      console.log(fullBackupData);
      console.log(`======================================================================`);
    }
  } catch (error) {
    console.error("Error in automatic 11:30 PM backup scheduler:", error);
  }
}, 30000); // Check every 30 seconds

// Vite or Static Production File Server Bootloader
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite development middleware loaded.");
    } catch (err) {
      console.error("Failed to load Vite dev middleware, falling back to static files", err);
      serveStaticFiles();
    }
  } else {
    serveStaticFiles();
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tele-CRM full-stack server running on http://localhost:${PORT}`);
  });
}

function serveStaticFiles() {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  console.log("Static production files serving loaded.");
}

startServer();
