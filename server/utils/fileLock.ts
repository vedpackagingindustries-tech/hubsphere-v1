import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "db.json");
const TEMP_FILE = path.join(process.cwd(), "db.json.tmp");
const BACKUP_FILE = path.join(process.cwd(), "db.json.bak");

// In-memory cache to prevent race conditions during async operations
let dbCache: any = null;

export function readDBSync(): any {
  if (dbCache) {
    return dbCache;
  }

  let db: any;
  if (!fs.existsSync(DB_FILE)) {
    db = {
      users: [],
      leads: [],
      callLogs: [],
      supportTickets: [],
      autoCallingConfig: {
        delaySeconds: 5,
        enabled: true
      },
      backups: [],
      attendance: [],
      leaves: [],
      tasks: [],
      companyHolidays: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } else {
    try {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      db = JSON.parse(data);
    } catch (err) {
      console.error("Error reading database file, resetting to empty", err);
      db = { 
        users: [], 
        leads: [], 
        callLogs: [], 
        supportTickets: [], 
        autoCallingConfig: { delaySeconds: 5, enabled: true }, 
        backups: [],
        attendance: [],
        leaves: [],
        tasks: [],
        companyHolidays: []
      };
    }
  }

    // Ensure arrays are initialized
  db.tenants = db.tenants || [];
  db.users = db.users || [];
  db.leads = db.leads || [];
  db.callLogs = db.callLogs || [];
  db.supportTickets = db.supportTickets || [];
  db.backups = db.backups || [];
  db.attendance = db.attendance || [];
  db.leaves = db.leaves || [];
  db.tasks = db.tasks || [];
  db.companyHolidays = db.companyHolidays || [];
  db.reports = db.reports || [];
  db.payrollOverrides = db.payrollOverrides || [];
  db.releasedSalaries = db.releasedSalaries || [];
  db.salaryRules = db.salaryRules || [];
  db.improvementInstructions = db.improvementInstructions || [];
  db.subAdminComms = db.subAdminComms || [];

  const hasDefaultTenant = db.tenants.some((t: any) => t.tenantId === "t-default");
  if (!hasDefaultTenant) {
    db.tenants.push({
      tenantId: "t-default",
      companyName: "Default Company",
      companyId: "c-default",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  // Run auto-migration for multi-tenancy on all collections
  const collections = [
    "users", "leads", "callLogs", "supportTickets", "backups",
    "attendance", "leaves", "tasks", "companyHolidays",
    "reports", "payrollOverrides", "releasedSalaries",
    "salaryRules", "improvementInstructions", "subAdminComms"
  ];
  let migrated = false;
  for (const collName of collections) {
    db[collName] = db[collName] || [];
    for (const item of db[collName]) {
      if (!item.tenantId) {
        item.tenantId = "t-default";
        migrated = true;
      }
      if (!item.companyId) {
        item.companyId = "c-default";
        migrated = true;
      }
    }
  }

  db.testingConfig = db.testingConfig || {
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true
  };
  db.recoveryConfig = db.recoveryConfig || {
    securityQuestion: "elephant ke kitne daatt hote hai",
    securityAnswer: "0000",
    adminBackupEmail: "contact.grahicsworld@gmail.com",
    alertWhatsapp: "9301056006",
    alertEmail: "ipgroup2002@gmail.com"
  };

  // Seed default Main Admin if u-admin does not exist
  const hasAdmin = db.users.some((u: any) => u.id === "u-admin");
  if (!hasAdmin) {
    db.users.push({
      id: "u-admin",
      name: "Admin",
      email: "contact.grahicsworld@gmail.com",
      password: "admin",
      role: "admin",
      phone: "+919876543210",
      department: "All",
      position: "Main Admin",
      salaryBase: 12000,
      commissionRate: 100,
      tenantId: "t-default",
      companyId: "c-default"
    });
    migrated = true;
  }

  if (migrated) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  }

  dbCache = db;
  return db;
}

// Keep readDB pointing to readDBSync
export const readDB = readDBSync;

class WriteQueue {
  private queue: Array<{ data: any; resolve: (val?: any) => void; reject: (err: any) => void }> = [];
  private writing = false;

  async enqueue(data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.writing || this.queue.length === 0) return;
    this.writing = true;

    const { data, resolve, reject } = this.queue.shift()!;

    try {
      // Update our in-memory cache immediately
      dbCache = data;

      // 1. Backup existing db.json if it exists
      if (fs.existsSync(DB_FILE)) {
        await fs.promises.copyFile(DB_FILE, BACKUP_FILE);
      }

      // 2. Write to temp file
      const jsonString = JSON.stringify(data, null, 2);
      await fs.promises.writeFile(TEMP_FILE, jsonString, "utf-8");

      // 3. Atomic rename
      await fs.promises.rename(TEMP_FILE, DB_FILE);

      resolve();
    } catch (error) {
      console.error("Critical: Error during queued atomic write to db.json", error);
      // Attempt recovery from backup if write failed and backup exists
      try {
        if (fs.existsSync(BACKUP_FILE) && !fs.existsSync(DB_FILE)) {
          await fs.promises.copyFile(BACKUP_FILE, DB_FILE);
          console.log("Restored db.json from backup successfully.");
        }
      } catch (recoveryError) {
        console.error("Failed to restore db.json from backup:", recoveryError);
      }
      reject(error);
    } finally {
      this.writing = false;
      // Process next item in queue
      this.processQueue();
    }
  }
}

export const dbWriteQueue = new WriteQueue();

// Async writeDB using queue
export async function writeDB(data: any): Promise<void> {
  // Update in-memory cache immediately so subsequent reads are consistent
  dbCache = data;
  return dbWriteQueue.enqueue(data);
}

// Sync fallback just in case some part of code needs synchronous write
export function writeDBSync(data: any): void {
  dbCache = data;
  try {
    if (fs.existsSync(DB_FILE)) {
      fs.copyFileSync(DB_FILE, BACKUP_FILE);
    }
    fs.writeFileSync(TEMP_FILE, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(TEMP_FILE, DB_FILE);
  } catch (err) {
    console.error("Error in writeDBSync:", err);
  }
}
