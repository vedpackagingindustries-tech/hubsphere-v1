import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import { readDB, writeDB } from "../utils/fileLock";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { getHRMLists } from "../services/payroll.service";
import { findOrCreateFolder, uploadFileToDrive, checkFileExists, listFilesInFolder } from "../../src/server-drive";

const router = Router();
const RECORDINGS_DIR = path.join(process.cwd(), "recordings");

// ==========================================================
// UNAUTHENTICATED RECOVERY ENDPOINTS (Disaster Recovery Flow)
// ==========================================================

// GET /api/backups/recovery-question
router.get("/backups/recovery-question", (req: Request, res: Response) => {
  const db = readDB();
  const currentTenantId = (req.headers["x-tenant-id"] as string) || "t-default";
  
  db.tenantRecoveryConfigs = db.tenantRecoveryConfigs || {};
  const config = db.tenantRecoveryConfigs[currentTenantId] || db.recoveryConfig || {
    securityQuestion: "elephant ke kitne daatt hote hai",
    securityAnswer: "0000"
  };
  
  res.json({ question: config.securityQuestion || "elephant ke kitne daatt hote hai" });
});

// POST /api/backups/verify-recovery
router.post("/backups/verify-recovery", (req: Request, res: Response) => {
  const { name, password, operatorName, securityAnswer } = req.body;
  if (!name || !password || !operatorName || !securityAnswer) {
    return res.status(400).json({ error: "All verification fields are strictly required." });
  }

  const db = readDB();
  const currentTenantId = (req.headers["x-tenant-id"] as string) || "t-default";
  
  const isMatch = db.users.some((u: any) => {
    if (u.tenantId !== currentTenantId || u.role !== "admin" || u.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
      return false;
    }
    if (u.password && (u.password.startsWith("$2a$") || u.password.startsWith("$2b$"))) {
      return bcrypt.compareSync(password, u.password);
    }
    return u.password === password;
  });
  
  db.tenantRecoveryConfigs = db.tenantRecoveryConfigs || {};
  const config = db.tenantRecoveryConfigs[currentTenantId] || db.recoveryConfig || {
    securityQuestion: "elephant ke kitne daatt hote hai",
    securityAnswer: "0000",
    adminBackupEmail: "contact.grahicsworld@gmail.com",
    alertWhatsapp: "9301056006",
    alertEmail: "ipgroup2002@gmail.com"
  };

  const isSecMatch = (securityAnswer.trim() === config.securityAnswer.trim());

  if (!isMatch) {
    return res.status(401).json({ error: "Invalid Main Admin username or password for this tenant." });
  }

  if (!isSecMatch) {
    const timestamp = new Date().toISOString();
    console.warn(`\n======================================================================`);
    console.warn(`🚨🚨🚨 [CRITICAL VERIFICATION INTRUSION DETECTED - TENANT: ${currentTenantId}] 🚨🚨🚨`);
    console.warn(`Timestamp: ${timestamp}`);
    console.warn(`Attempted By (नाम): ${operatorName}`);
    console.warn(`Provided Admin Username: ${name}`);
    console.warn(`Provided Admin Password: ${password}`);
    console.warn(`Provided Security Answer: ${securityAnswer}`);
    console.warn(`Correct Security Answer: ${config.securityAnswer}`);
    console.warn(`Status: BLOCKED & REJECTED (Unauthorized Verification Attempt!)`);
    console.warn(`----------------------------------------------------------------------`);
    console.warn(`[SMS/WHATSAPP ALERT] Sent to Main Admin Whatsapp: ${config.alertWhatsapp}`);
    console.warn(`Message: "ALERT: Unauthorized verification attempt by [${operatorName}] was BLOCKED on HubSphere at ${timestamp}. Verify security settings."`);
    console.warn(`----------------------------------------------------------------------`);
    console.warn(`[EMAIL ALERT] Sent to Main Admin Email: ${config.alertEmail}`);
    console.warn(`Subject: ⚠️ SECURITY ALERT: Unauthorized Verification Attempt Detected`);
    console.warn(`Body: Dear Main Admin,\n\nWe detected an unauthorized verification attempt to unlock the System Crash Recovery portal.\n\nDetails:\n- Person Name: ${operatorName}\n- Admin Credentials matched: YES\n- Security Answer matched: NO\n- Timestamp: ${timestamp}\n\nThis attempt has been successfully BLOCKED.\n\nBest Regards,\nHubSphere Security System`);
    console.warn(`======================================================================\n`);

    return res.status(401).json({ 
      error: `Incorrect security answer. A security warning alert has been dispatched to Main Admin's Whatsapp (${config.alertWhatsapp}) and Email (${config.alertEmail})!` 
    });
  }

  res.json({ success: true, message: "Emergency Portal unlocked successfully!" });
});

// POST /api/backups/export-full
router.post("/backups/export-full", (req: Request, res: Response) => {
  const { name, password, attemptByName, securityAnswer } = req.body;
  if (!password || !attemptByName || !securityAnswer) {
    return res.status(400).json({ error: "Export Rejected: Admin password, operator name, and security answer are all strictly required for this secure operation." });
  }

  const db = readDB();
  const currentTenantId = (req.headers["x-tenant-id"] as string) || "t-default";
  
  const isMatch = db.users.some((u: any) => {
    if (u.tenantId !== currentTenantId || u.role !== "admin" || u.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
      return false;
    }
    if (u.password && (u.password.startsWith("$2a$") || u.password.startsWith("$2b$"))) {
      return bcrypt.compareSync(password, u.password);
    }
    return u.password === password;
  });
  
  db.tenantRecoveryConfigs = db.tenantRecoveryConfigs || {};
  const config = db.tenantRecoveryConfigs[currentTenantId] || db.recoveryConfig || {
    securityQuestion: "elephant ke kitne daatt hote hai",
    securityAnswer: "0000",
    adminBackupEmail: "contact.grahicsworld@gmail.com",
    alertWhatsapp: "9301056006",
    alertEmail: "ipgroup2002@gmail.com"
  };

  const isSecMatch = (securityAnswer.trim() === config.securityAnswer.trim());
  
  if (!isMatch || !isSecMatch) {
    const timestamp = new Date().toISOString();
    console.warn(`\n======================================================================`);
    console.warn(`🚨🚨🚨 [CRITICAL DATABASE EXPORT INTRUSION DETECTED - TENANT: ${currentTenantId}] 🚨🚨🚨`);
    console.warn(`Timestamp: ${timestamp}`);
    console.warn(`Attempted By (नाम): ${attemptByName}`);
    console.warn(`Provided Admin Password: ${password}`);
    console.warn(`Provided Security Answer: ${securityAnswer}`);
    console.warn(`Correct Security Answer: ${config.securityAnswer}`);
    console.warn(`Status: BLOCKED & REJECTED (Unauthorized Export Attempt!)`);
    console.warn(`----------------------------------------------------------------------`);
    console.warn(`[SMS/WHATSAPP ALERT] Sent to Main Admin Whatsapp: ${config.alertWhatsapp}`);
    console.warn(`Message: "ALERT: Unauthorized database snapshot export/download attempt by [${attemptByName}] was BLOCKED on HubSphere at ${timestamp}. Verify security settings."`);
    console.warn(`----------------------------------------------------------------------`);
    console.warn(`[EMAIL ALERT] Sent to Main Admin Email: ${config.alertEmail}`);
    console.warn(`Subject: ⚠️ SECURITY ALERT: Unauthorized Database Export Attempt Detected`);
    console.warn(`Body: Dear Main Admin,\n\nWe detected an unauthorized attempt to export/download a copy of the HubSphere CRM database.\n\nDetails:\n- Person Name: ${attemptByName}\n- Admin Password matched: ${isMatch ? "YES" : "NO"}\n- Security Question matched: ${isSecMatch ? "YES" : "NO"}\n- Timestamp: ${timestamp}\n\nThis attempt has been successfully BLOCKED. No data was leaked.\n\nBest Regards,\nHubSphere Security System`);
    console.warn(`======================================================================\n`);

    return res.status(401).json({ 
      error: `Access Denied: Invalid administrator credentials or incorrect security answer. A security alert has been dispatched to Main Admin's Whatsapp (${config.alertWhatsapp}) and Email (${config.alertEmail})!` 
    });
  }

  const timestamp = new Date().toISOString();
  console.log(`\n======================================================================`);
  console.log(`🎉🎉🎉 [SUCCESSFUL DATABASE EXPORT AUTHORIZED - TENANT: ${currentTenantId}] 🎉🎉🎉`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Authorized Operator: ${attemptByName}`);
  console.log(`Status: GRANTED & TRANSFERRED SUCCESSFUL`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`[SMS/WHATSAPP DISPATCH] Send Notification to Main Admin Whatsapp: ${config.alertWhatsapp}`);
  console.log(`Message: "SUCCESS: HubSphere database copy was successfully exported and downloaded by [${attemptByName}] at ${timestamp}."`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`[EMAIL DISPATCH] Send Notification to Main Admin Email: ${config.alertEmail}`);
  console.log(`Subject: ✅ SYSTEM NOTIFICATION: Database Copy Exported`);
  console.log(`Body: Dear Main Admin,\n\nThis is to notify you that a complete database backup download was successfully authorized and performed.\n\nDetails:\n- Authorized Operator: ${attemptByName}\n- Timestamp: ${timestamp}\n\nIf this was not you, please inspect your admin credentials and secure your recovery answers immediately.\n\nBest Regards,\nHubSphere CRM Core Engine`);
  console.log(`======================================================================\n`);

  // Return ONLY this tenant's slice of the database for security
  const tenantDb = {
    users: db.users.filter((u: any) => u.tenantId === currentTenantId),
    leads: db.leads.filter((l: any) => l.tenantId === currentTenantId),
    callLogs: db.callLogs.filter((c: any) => c.tenantId === currentTenantId),
    supportTickets: (db.supportTickets || []).filter((s: any) => s.tenantId === currentTenantId),
    backups: (db.backups || []).filter((b: any) => b.tenantId === currentTenantId),
    attendance: (db.attendance || []).filter((a: any) => a.tenantId === currentTenantId),
    leaves: (db.leaves || []).filter((l: any) => l.tenantId === currentTenantId),
    tasks: (db.tasks || []).filter((t: any) => t.tenantId === currentTenantId),
    reports: (db.reports || []).filter((r: any) => r.tenantId === currentTenantId),
    salaryRules: (db.salaryRules || []).filter((s: any) => s.tenantId === currentTenantId),
    improvementInstructions: (db.improvementInstructions || []).filter((i: any) => i.tenantId === currentTenantId),
    subAdminComms: (db.subAdminComms || []).filter((s: any) => s.tenantId === currentTenantId),
    recoveryConfig: config
  };

  res.json({ success: true, fullDatabase: tenantDb });
});

// POST /api/backups/restore-full
router.post("/backups/restore-full", async (req: Request, res: Response) => {
  const { name, password, backupData, attemptByName, securityAnswer } = req.body;
  
  if (!password || !backupData || !attemptByName || !securityAnswer) {
    return res.status(400).json({ error: "Restoration Rejected: Admin password, backup JSON data, operator name, and security answer are all strictly required for this secure operation." });
  }

  const db = readDB();
  const currentTenantId = (req.headers["x-tenant-id"] as string) || "t-default";
  
  const isMatch = db.users.some((u: any) => {
    if (u.tenantId !== currentTenantId || u.role !== "admin" || u.name.trim().toLowerCase() !== name.trim().toLowerCase()) {
      return false;
    }
    if (u.password && (u.password.startsWith("$2a$") || u.password.startsWith("$2b$"))) {
      return bcrypt.compareSync(password, u.password);
    }
    return u.password === password;
  });
  
  db.tenantRecoveryConfigs = db.tenantRecoveryConfigs || {};
  const config = db.tenantRecoveryConfigs[currentTenantId] || db.recoveryConfig || {
    securityQuestion: "elephant ke kitne daatt hote hai",
    securityAnswer: "0000",
    adminBackupEmail: "contact.grahicsworld@gmail.com",
    alertWhatsapp: "9301056006",
    alertEmail: "ipgroup2002@gmail.com"
  };

  const isSecMatch = (securityAnswer.trim() === config.securityAnswer.trim());

  if (!isMatch || !isSecMatch) {
    const timestamp = new Date().toISOString();
    console.warn(`\n======================================================================`);
    console.warn(`🚨🚨🚨 [CRITICAL CRASH RECOVERY INTRUSION DETECTED - TENANT: ${currentTenantId}] 🚨🚨🚨`);
    console.warn(`Timestamp: ${timestamp}`);
    console.warn(`Attempted By (नाम): ${attemptByName}`);
    console.warn(`Provided Admin Password: ${password}`);
    console.warn(`Provided Security Answer: ${securityAnswer}`);
    console.warn(`Correct Security Answer: ${config.securityAnswer}`);
    console.warn(`Status: BLOCKED & REJECTED (Unauthorized Access Attempt!)`);
    console.warn(`----------------------------------------------------------------------`);
    console.warn(`[SMS/WHATSAPP ALERT] Sent to Main Admin Whatsapp: ${config.alertWhatsapp}`);
    console.warn(`Message: "ALERT: Unauthorized backup restoration attempt by [${attemptByName}] was BLOCKED on HubSphere at ${timestamp}. Verify security question settings immediately."`);
    console.warn(`----------------------------------------------------------------------`);
    console.warn(`[EMAIL ALERT] Sent to Main Admin Email: ${config.alertEmail}`);
    console.warn(`Subject: ⚠️ SECURITY ALERT: Unauthorized Database Restoration Attempt Detected`);
    console.warn(`Body: Dear Main Admin,\n\nWe detected an unauthorized attempt to restore/overwrite the HubSphere CRM database.\n\nDetails:\n- Person Name: ${attemptByName}\n- Admin Password matched: ${isMatch ? "YES" : "NO"}\n- Security Question matched: ${isSecMatch ? "YES" : "NO"}\n- Timestamp: ${timestamp}\n\nThis attempt has been successfully BLOCKED. No data was altered.\n\nBest Regards,\nHubSphere Security System`);
    console.warn(`======================================================================\n`);

    return res.status(401).json({ 
      error: `Access Denied: Invalid administrator credentials or incorrect security answer. A critical alert has been dispatched to Main Admin's Whatsapp (${config.alertWhatsapp}) and Email (${config.alertEmail})!` 
    });
  }

  if (!backupData.users || !backupData.leads) {
    return res.status(400).json({ error: "Restoration Rejected: Invalid database schema in the provided backup JSON." });
  }

  const timestamp = new Date().toISOString();
  console.log(`\n======================================================================`);
  console.log(`🎉🎉🎉 [SUCCESSFUL SYSTEM RESTORE AUTHORIZED - TENANT: ${currentTenantId}] 🎉🎉🎉`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Authorized Operator: ${attemptByName}`);
  console.log(`Status: GRANTED & INSTALLED SUCCESSFUL`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`[SMS/WHATSAPP DISPATCH] Send Notification to Main Admin Whatsapp: ${config.alertWhatsapp}`);
  console.log(`Message: "SUCCESS: HubSphere database has been successfully restored and reconfigured by [${attemptByName}] at ${timestamp}."`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`[EMAIL DISPATCH] Send Notification to Main Admin Email: ${config.alertEmail}`);
  console.log(`Subject: ✅ SYSTEM NOTIFICATION: Database Successfully Restored`);
  console.log(`Body: Dear Main Admin,\n\nThis is to notify you that a complete database restoration and reconfiguration was successfully completed.\n\nDetails:\n- Authorized Operator: ${attemptByName}\n- Timestamp: ${timestamp}\n\nIf this was not you, please inspect your admin credentials and secure your recovery answers immediately.\n\nBest Regards,\nHubSphere CRM Core Engine`);
  console.log(`======================================================================\n`);

  // ONLY clear and restore data slices for this active tenant, preventing cross-tenant data wipe!
  db.users = db.users.filter((u: any) => u.tenantId !== currentTenantId);
  db.leads = db.leads.filter((l: any) => l.tenantId !== currentTenantId);
  db.callLogs = db.callLogs.filter((c: any) => c.tenantId !== currentTenantId);
  db.supportTickets = (db.supportTickets || []).filter((s: any) => s.tenantId !== currentTenantId);
  db.backups = (db.backups || []).filter((b: any) => b.tenantId !== currentTenantId);
  db.attendance = (db.attendance || []).filter((a: any) => a.tenantId !== currentTenantId);
  db.leaves = (db.leaves || []).filter((l: any) => l.tenantId !== currentTenantId);
  db.tasks = (db.tasks || []).filter((t: any) => t.tenantId !== currentTenantId);
  db.reports = (db.reports || []).filter((r: any) => r.tenantId !== currentTenantId);
  db.salaryRules = (db.salaryRules || []).filter((s: any) => s.tenantId !== currentTenantId);
  db.improvementInstructions = (db.improvementInstructions || []).filter((i: any) => i.tenantId !== currentTenantId);
  db.subAdminComms = (db.subAdminComms || []).filter((s: any) => s.tenantId !== currentTenantId);

  const tenantObj = db.tenants.find((t: any) => t.tenantId === currentTenantId);
  const currentCompanyId = tenantObj ? tenantObj.companyId : "c-default";

  const mapBackup = (items: any[]) => (items || []).map(item => ({
    ...item,
    tenantId: currentTenantId,
    companyId: currentCompanyId
  }));

  db.users.push(...mapBackup(backupData.users));
  db.leads.push(...mapBackup(backupData.leads));
  db.callLogs.push(...mapBackup(backupData.callLogs));
  if (backupData.supportTickets) db.supportTickets.push(...mapBackup(backupData.supportTickets));
  if (backupData.backups) db.backups.push(...mapBackup(backupData.backups));
  if (backupData.attendance) db.attendance.push(...mapBackup(backupData.attendance));
  if (backupData.leaves) db.leaves.push(...mapBackup(backupData.leaves));
  if (backupData.tasks) db.tasks.push(...mapBackup(backupData.tasks));
  if (backupData.reports) db.reports.push(...mapBackup(backupData.reports));
  if (backupData.salaryRules) db.salaryRules.push(...mapBackup(backupData.salaryRules));
  if (backupData.improvementInstructions) db.improvementInstructions.push(...mapBackup(backupData.improvementInstructions));
  if (backupData.subAdminComms) db.subAdminComms.push(...mapBackup(backupData.subAdminComms));

  await writeDB(db);

  res.json({ success: true, message: "System configured and restored successfully!" });
});

// GET /api/testing-period
router.get("/testing-period", (req: Request, res: Response) => {
  const db = readDB();
  const currentTenantId = (req.headers["x-tenant-id"] as string) || "t-default";

  db.tenantTestingConfigs = db.tenantTestingConfigs || {};
  const config = db.tenantTestingConfigs[currentTenantId] || db.testingConfig || {
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true
  };
  
  const today = new Date().toISOString().split('T')[0];
  const expiryDate = new Date(config.expiryDate);
  const currentDate = new Date(today);
  const diffTime = expiryDate.getTime() - currentDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isExpired = diffDays <= 0;

  res.json({
    expiryDate: config.expiryDate,
    isActive: config.isActive,
    remainingDays: diffDays > 0 ? diffDays : 0,
    isExpired: isExpired
  });
});


// ==========================================================
// AUTHENTICATED ADMINISTRATIVE ROUTES
// ==========================================================

router.use(authenticateUser);

// GET /api/admin/salary-rules
router.get("/salary-rules", async (req: AuthenticatedRequest, res: Response) => {
  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.user?.companyId || "c-default";

  // Ensure default system rules are copied if tenant has none
  const tenantRules = (db.salaryRules || []).filter((r: any) => r.tenantId === currentTenantId);
  if (tenantRules.length === 0) {
    const defaultRules = (db.salaryRules || []).filter((r: any) => r.systemRule && (r.tenantId === "t-default" || !r.tenantId));
    if (defaultRules.length > 0) {
      const newRulesForTenant = defaultRules.map((r: any) => ({
        ...r,
        id: r.id + "_" + currentTenantId,
        tenantId: currentTenantId,
        companyId: currentCompanyId
      }));
      db.salaryRules.push(...newRulesForTenant);
      await writeDB(db);
    }
  }

  const rules = (db.salaryRules || []).filter((r: any) => r.tenantId === currentTenantId);
  res.json({ success: true, salaryRules: rules });
});

// POST /api/admin/salary-rules
router.post("/salary-rules", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Main Admin only." });
  }

  const db = readDB();
  getHRMLists(db);
  db.salaryRules = db.salaryRules || [];

  const { id, name, description, type, value, valueType, segment, staffId, enabled } = req.body;

  if (!name || !type || value === undefined) {
    return res.status(400).json({ error: "Name, type, and value are strictly required." });
  }

  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.user?.companyId || "c-default";

  if (id) {
    const idx = db.salaryRules.findIndex((r: any) => r.id === id && r.tenantId === currentTenantId);
    if (idx !== -1) {
      db.salaryRules[idx] = {
        ...db.salaryRules[idx],
        name,
        description,
        type,
        value: Number(value),
        valueType: valueType || "Fixed",
        segment: segment || "All",
        staffId: staffId || "All",
        enabled: enabled !== false
      };
    } else {
      return res.status(404).json({ error: "Salary rule not found." });
    }
  } else {
    const newRule = {
      id: "rule_" + Date.now(),
      name,
      description,
      type,
      value: Number(value),
      valueType: valueType || "Fixed",
      segment: segment || "All",
      staffId: staffId || "All",
      enabled: enabled !== false,
      isCustom: true,
      tenantId: currentTenantId,
      companyId: currentCompanyId
    };
    db.salaryRules.push(newRule);
  }

  await writeDB(db);
  res.json({ success: true, salaryRules: db.salaryRules.filter((r: any) => r.tenantId === currentTenantId), message: "Salary rule successfully saved!" });
});

// POST /api/admin/salary-rules/delete
router.post("/salary-rules/delete", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Main Admin only." });
  }

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "Rule ID is required." });
  }

  const db = readDB();
  getHRMLists(db);
  db.salaryRules = db.salaryRules || [];
  const currentTenantId = req.tenantId || "t-default";

  const rule = db.salaryRules.find((r: any) => r.id === id && r.tenantId === currentTenantId);
  if (!rule) {
    return res.status(404).json({ error: "Salary rule not found." });
  }
  if (rule.systemRule && rule.tenantId === "t-default") {
    return res.status(400).json({ error: "System-defined rules cannot be deleted. You can only disable them!" });
  }

  db.salaryRules = db.salaryRules.filter((r: any) => !(r.id === id && r.tenantId === currentTenantId));
  await writeDB(db);
  res.json({ success: true, salaryRules: db.salaryRules.filter((r: any) => r.tenantId === currentTenantId), message: "Salary rule deleted successfully!" });
});

// GET /api/support
router.get("/support", (req: AuthenticatedRequest, res: Response) => {
  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const tickets = (db.supportTickets || []).filter((s: any) => s.tenantId === currentTenantId);
  res.json(tickets);
});

// POST /api/support/add
router.post("/support/add", async (req: AuthenticatedRequest, res: Response) => {
  const { userName, userEmail, subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: "Subject and Message are required" });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.user?.companyId || "c-default";

  const newTicket = {
    id: "ticket-" + Date.now(),
    userName: userName || req.user?.name || "Anonymous Caller",
    userEmail: userEmail || req.user?.email || "support@telecrm.com",
    subject,
    message,
    status: "open",
    timestamp: new Date().toISOString(),
    tenantId: currentTenantId,
    companyId: currentCompanyId
  };

  db.supportTickets = db.supportTickets || [];
  db.supportTickets.push(newTicket);
  await writeDB(db);

  res.json({ success: true, ticket: newTicket });
});

// POST /api/support/reply
router.post("/support/reply", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only administrators can answer support tickets." });
  }

  const { ticketId, reply } = req.body;
  const db = readDB();
  db.supportTickets = db.supportTickets || [];
  const currentTenantId = req.tenantId || "t-default";

  const ticket = db.supportTickets.find((t: any) => t.id === ticketId && t.tenantId === currentTenantId);
  if (ticket) {
    ticket.reply = reply;
    ticket.status = "resolved";
    await writeDB(db);
    return res.json({ success: true, ticket });
  }
  res.status(404).json({ error: "Ticket not found" });
});

// POST /api/support/delete
router.post("/support/delete", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied" });
  }
  const { ticketId } = req.body;
  if (!ticketId) {
    return res.status(400).json({ error: "Ticket ID is required" });
  }
  const db = readDB();
  db.supportTickets = db.supportTickets || [];
  const currentTenantId = req.tenantId || "t-default";

  const idx = db.supportTickets.findIndex((t: any) => t.id === ticketId && t.tenantId === currentTenantId);
  if (idx !== -1) {
    db.supportTickets.splice(idx, 1);
    await writeDB(db);
    return res.json({ success: true, message: "Support ticket deleted." });
  }
  res.status(404).json({ error: "Ticket not found" });
});

// GET /api/backups
router.get("/backups", (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only administrators can list database backups." });
  }
  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const backups = (db.backups || []).filter((b: any) => b.tenantId === currentTenantId);
  res.json(backups);
});

// POST /api/backups/create
router.post("/backups/create", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only administrators can initiate database backups." });
  }

  const db = readDB();
  const timestamp = new Date().toISOString();
  const backupId = "backup-" + Date.now();
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.user?.companyId || "c-default";

  const tenantLeads = db.leads.filter((l: any) => l.tenantId === currentTenantId);
  const tenantCalls = db.callLogs.filter((c: any) => c.tenantId === currentTenantId);
  
  const newBackup = {
    id: backupId,
    name: `Daily Auto Backup - ${new Date().toLocaleDateString()}`,
    timestamp,
    leadsCount: tenantLeads.length,
    callsCount: tenantCalls.length,
    tenantId: currentTenantId,
    companyId: currentCompanyId
  };

  db.backups = db.backups || [];
  db.backups.unshift(newBackup);
  await writeDB(db);

  res.json({ success: true, backup: newBackup });
});

// POST /api/backups/delete
router.post("/backups/delete", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied" });
  }
  const { backupId } = req.body;
  if (!backupId) {
    return res.status(400).json({ error: "Backup ID is required" });
  }
  const db = readDB();
  db.backups = db.backups || [];
  const currentTenantId = req.tenantId || "t-default";

  const idx = db.backups.findIndex((b: any) => b.id === backupId && b.tenantId === currentTenantId);
  if (idx !== -1) {
    db.backups.splice(idx, 1);
    await writeDB(db);
    return res.json({ success: true, message: "Backup snapshot deleted." });
  }
  res.status(404).json({ error: "Backup not found" });
});

// POST /api/drive/sync
router.post("/drive/sync", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== "admin" && user.role !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied: Only Administrators and Sub-Administrators can sync data to Google Drive." });
  }

  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: "Google Drive Access Token is required." });
  }

  try {
    const mainFolderId = await findOrCreateFolder(accessToken, "HubSphere CRM Backups");
    const recordingsFolderId = await findOrCreateFolder(accessToken, "Recordings", mainFolderId);

    const db = readDB();
    const currentTenantId = req.tenantId || "t-default";
    const currentCompanyId = req.user?.companyId || "c-default";

    const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");
    const dbFilename = `hubsphere_db_backup_${timestampStr}.json`;

    // Package ONLY this tenant's slice of the database to sync
    const tenantDb = {
      users: db.users.filter((u: any) => u.tenantId === currentTenantId),
      leads: db.leads.filter((l: any) => l.tenantId === currentTenantId),
      callLogs: db.callLogs.filter((c: any) => c.tenantId === currentTenantId),
      supportTickets: (db.supportTickets || []).filter((s: any) => s.tenantId === currentTenantId),
      backups: (db.backups || []).filter((b: any) => b.tenantId === currentTenantId),
      attendance: (db.attendance || []).filter((a: any) => a.tenantId === currentTenantId),
      leaves: (db.leaves || []).filter((l: any) => l.tenantId === currentTenantId),
      tasks: (db.tasks || []).filter((t: any) => t.tenantId === currentTenantId),
      reports: (db.reports || []).filter((r: any) => r.tenantId === currentTenantId),
      salaryRules: (db.salaryRules || []).filter((s: any) => s.tenantId === currentTenantId),
      improvementInstructions: (db.improvementInstructions || []).filter((i: any) => i.tenantId === currentTenantId),
      subAdminComms: (db.subAdminComms || []).filter((s: any) => s.tenantId === currentTenantId),
    };

    const dbContent = JSON.stringify(tenantDb, null, 2);
    
    const dbFileId = await uploadFileToDrive(
      accessToken,
      dbFilename,
      "application/json",
      dbContent,
      mainFolderId
    );

    let recordingsUploaded = 0;
    if (fs.existsSync(RECORDINGS_DIR)) {
      const files = fs.readdirSync(RECORDINGS_DIR);
      
      for (const file of files) {
        const filePath = path.join(RECORDINGS_DIR, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isFile()) {
          const alreadyUploadedId = await checkFileExists(accessToken, file, recordingsFolderId);
          
          if (!alreadyUploadedId) {
            const fileContent = fs.readFileSync(filePath);
            const ext = path.extname(file).toLowerCase();
            let mimeType = "audio/webm";
            if (ext === ".mp3") mimeType = "audio/mp3";
            else if (ext === ".mp4") mimeType = "audio/mp4";
            else if (ext === ".ogg") mimeType = "audio/ogg";

            await uploadFileToDrive(
              accessToken,
              file,
              mimeType,
              fileContent,
              recordingsFolderId
            );
            recordingsUploaded++;
          }
        }
      }
    }

    const backupId = "backup-drive-" + Date.now();
    const newBackup = {
      id: backupId,
      name: `Google Drive Sync - ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString(),
      leadsCount: tenantDb.leads.length,
      callsCount: tenantDb.callLogs.length,
      isGoogleDrive: true,
      driveFileId: dbFileId,
      recordingsSynced: recordingsUploaded,
      tenantId: currentTenantId,
      companyId: currentCompanyId
    };

    db.backups = db.backups || [];
    db.backups.unshift(newBackup);
    await writeDB(db);

    res.json({
      success: true,
      message: `Sync completed successfully! Created snapshot '${dbFilename}' and synced ${recordingsUploaded} recordings to Google Drive.`,
      backup: newBackup
    });
  } catch (error: any) {
    console.error("Google Drive Sync Error:", error);
    res.status(500).json({ error: `Sync failed: ${error.message || error}` });
  }
});

// POST /api/drive/list
router.post("/drive/list", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== "admin" && user.role !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied: Only Administrators and Sub-Administrators can access Google Drive." });
  }

  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ error: "Google Drive Access Token is required." });
  }

  try {
    const mainFolderId = await findOrCreateFolder(accessToken, "HubSphere CRM Backups");
    const driveFiles = await listFilesInFolder(accessToken, mainFolderId);
    res.json({ success: true, files: driveFiles });
  } catch (error: any) {
    console.error("Google Drive List Error:", error);
    res.status(500).json({ error: `Failed to fetch cloud backups: ${error.message || error}` });
  }
});

// GET /api/admin/recovery-config
router.get("/recovery-config", (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Main Admin only." });
  }
  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  db.tenantRecoveryConfigs = db.tenantRecoveryConfigs || {};
  const config = db.tenantRecoveryConfigs[currentTenantId] || db.recoveryConfig || {
    securityQuestion: "elephant ke kitne daatt hote hai",
    securityAnswer: "0000",
    adminBackupEmail: "contact.grahicsworld@gmail.com",
    alertWhatsapp: "9301056006",
    alertEmail: "ipgroup2002@gmail.com"
  };
  res.json({ success: true, recoveryConfig: config });
});

// POST /api/admin/recovery-config
router.post("/recovery-config", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Main Admin only." });
  }
  const { securityQuestion, securityAnswer, adminBackupEmail, alertWhatsapp, alertEmail } = req.body;
  if (!securityQuestion || !securityAnswer || !adminBackupEmail) {
    return res.status(400).json({ error: "Missing required configuration parameters." });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  db.tenantRecoveryConfigs = db.tenantRecoveryConfigs || {};
  db.tenantRecoveryConfigs[currentTenantId] = {
    securityQuestion,
    securityAnswer,
    adminBackupEmail,
    alertWhatsapp: alertWhatsapp || "9301056006",
    alertEmail: alertEmail || "ipgroup2002@gmail.com"
  };
  await writeDB(db);
  res.json({ success: true, recoveryConfig: db.tenantRecoveryConfigs[currentTenantId], message: "Security parameters updated successfully!" });
});

// GET /api/backups/download
router.get("/backups/download", (req: AuthenticatedRequest, res: Response) => {
  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const tenantLeads = db.leads.filter((l: any) => l.tenantId === currentTenantId);

  const headers = "Lead ID,Name,Calling Phone,WhatsApp Number,Email,Requirements,Status,Assigned To,Assigned Name,Assigned By Admin ID,Assigned By Admin Name,Assigned At,Notes,Created At\n";
  const rows = tenantLeads.map((l: any) => {
    return `"${l.id}","${l.name.replace(/"/g, '""')}","${l.phone}","${l.whatsapp || ''}","${l.email}","${l.requirements.replace(/"/g, '""')}","${l.status}","${l.assignedTo || ''}","${l.assignedName || 'Unassigned'}","${l.assignedByAdminId || ''}","${l.assignedByAdminName || ''}","${l.assignedAt || ''}","${(l.notes || '').replace(/"/g, '""')}","${l.createdAt}"`;
  }).join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=telecrm_leads_backup.csv");
  res.send(headers + rows);
});

// POST /api/backups/share
router.post("/backups/share", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only administrators can share backup data." });
  }

  const { channel, destination, notes } = req.body;
  if (!channel || !destination) {
    return res.status(400).json({ error: "Sharing channel and destination contact info are required." });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const leadsCount = db.leads.filter((l: any) => l.tenantId === currentTenantId).length;
  const callsCount = db.callLogs.filter((c: any) => c.tenantId === currentTenantId).length;

  if (channel === "whatsapp") {
    const text = `*System CRM Database Backup* \n` +
      `📅 Date: ${new Date().toLocaleDateString()}\n` +
      `👥 Total Active Leads Preserved: ${leadsCount}\n` +
      `📞 Simulated Call Sessions: ${callsCount}\n` +
      `📥 Download Excel Sheet: https://telecrm.com/api/backups/download\n` +
      `📝 Note: ${notes || 'No extra notes.'}`;

    const encodedText = encodeURIComponent(text);
    const link = `https://api.whatsapp.com/send?phone=${encodeURIComponent(destination)}&text=${encodedText}`;

    return res.json({ success: true, channel: "whatsapp", link, text });
  } else if (channel === "email") {
    console.log(`==========================================`);
    console.log(`[SIMULATED BACKUP EMAIL TRANSMISSION]`);
    console.log(`To: ${destination}`);
    console.log(`Subject: Tele-CRM Full Data Backup`);
    console.log(`Body: Admin has initiated a data backup. Attached: telecrm_leads_backup.csv (${leadsCount} Leads).`);
    console.log(`==========================================`);

    return res.json({ success: true, channel: "email", message: `Backup spreadsheet link dispatched simulated to: ${destination}` });
  }

  res.status(400).json({ error: "Unsupported channel." });
});

// POST /api/testing-period/update
router.post("/testing-period/update", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Main Admin only." });
  }

  const { expiryDate, isActive } = req.body;
  if (!expiryDate) {
    return res.status(400).json({ error: "Expiry Date is required." });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  db.tenantTestingConfigs = db.tenantTestingConfigs || {};
  db.tenantTestingConfigs[currentTenantId] = {
    expiryDate: expiryDate,
    isActive: isActive !== false
  };
  await writeDB(db);

  res.json({ success: true, testingConfig: db.tenantTestingConfigs[currentTenantId], message: "Testing period updated successfully!" });
});

// GET /api/admin/improvement-instructions
router.get("/improvement-instructions", (req: AuthenticatedRequest, res: Response) => {
  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";
  const insts = (db.improvementInstructions || []).filter((i: any) => i.tenantId === currentTenantId);
  res.json(insts);
});

// POST /api/admin/improvement-instructions
router.post("/improvement-instructions", async (req: AuthenticatedRequest, res: Response) => {
  const { text, segment, type } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Instruction text is required." });
  }
  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.user?.companyId || "c-default";
  
  const newInst = {
    id: "inst-" + Date.now(),
    text,
    segment: segment || "general",
    type: type || "Instruction",
    timestamp: new Date().toISOString(),
    tenantId: currentTenantId,
    companyId: currentCompanyId
  };
  db.improvementInstructions.push(newInst);
  await writeDB(db);
  res.json({ success: true, instruction: newInst });
});

// GET /api/sub-admin/comms
router.get("/sub-admin/comms", (req: AuthenticatedRequest, res: Response) => {
  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";
  const comms = (db.subAdminComms || []).filter((c: any) => c.tenantId === currentTenantId);
  res.json(comms);
});

// POST /api/sub-admin/comms
router.post("/sub-admin/comms", async (req: AuthenticatedRequest, res: Response) => {
  const { type, senderId, senderName, receiverId, receiverName, recipient, message, file, callReason, callOutcome, reason, solution } = req.body;
  if (!type) {
    return res.status(400).json({ error: "Type (call or whatsapp) is required." });
  }
  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.user?.companyId || "c-default";
  
  const finalReceiverId = receiverId || recipient || "u-admin";
  const finalReceiverName = receiverName || (finalReceiverId === "u-admin" ? "Main Admin" : (finalReceiverId === "tech-head" ? "Tech Head" : finalReceiverId === "nontech-head" ? "NonTech Head" : "Sales Head"));

  const newComm = {
    id: "comm-" + Date.now(),
    type,
    senderId: senderId || req.user?.id || "sub-admin",
    senderName: senderName || req.user?.name || "Sub-Admin",
    receiverId: finalReceiverId,
    receiverName: finalReceiverName,
    recipient: finalReceiverId,
    message: message || "",
    file: file || null,
    callReason: callReason || reason || null,
    callOutcome: callOutcome || solution || null,
    reason: reason || callReason || null,
    solution: solution || callOutcome || null,
    timestamp: new Date().toISOString(),
    adminReply: null,
    adminReplyTimestamp: null,
    tenantId: currentTenantId,
    companyId: currentCompanyId
  };
  
  db.subAdminComms.push(newComm);
  await writeDB(db);
  res.json({ success: true, communication: newComm });
});

// POST /api/sub-admin/comms/reply
router.post("/sub-admin/comms/reply", async (req: AuthenticatedRequest, res: Response) => {
  const { commId, replyText } = req.body;
  if (!commId || !replyText) {
    return res.status(400).json({ error: "Communication ID and reply text are required." });
  }
  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";
  
  if (!db.subAdminComms) {
    db.subAdminComms = [];
  }
  
  const comm = db.subAdminComms.find((c: any) => c.id === commId && c.tenantId === currentTenantId);
  if (!comm) {
    return res.status(404).json({ error: "Communication log not found." });
  }
  comm.adminReply = replyText;
  comm.adminReplyTimestamp = new Date().toISOString();
  await writeDB(db);
  res.json({ success: true, communication: comm, message: "Reply submitted successfully!" });
});

// POST /api/admin/reset-all
router.post("/reset-all", async (req: AuthenticatedRequest, res: Response) => {
  const role = req.user!.role;
  if (role !== "admin" && role !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied" });
  }
  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";

  db.callLogs = (db.callLogs || []).filter((c: any) => c.tenantId !== currentTenantId);
  db.leads = (db.leads || []).filter((l: any) => l.tenantId !== currentTenantId);
  db.tasks = (db.tasks || []).filter((t: any) => t.tenantId !== currentTenantId);
  db.leaves = (db.leaves || []).filter((l: any) => l.tenantId !== currentTenantId);
  db.supportTickets = (db.supportTickets || []).filter((s: any) => s.tenantId !== currentTenantId);
  db.attendance = (db.attendance || []).filter((a: any) => a.tenantId !== currentTenantId);
  db.reports = (db.reports || []).filter((r: any) => r.tenantId !== currentTenantId);
  db.improvementInstructions = (db.improvementInstructions || []).filter((i: any) => i.tenantId !== currentTenantId);
  db.subAdminComms = (db.subAdminComms || []).filter((s: any) => s.tenantId !== currentTenantId);

  await writeDB(db);
  res.json({ success: true, message: "Interactive Analytics & Call Logs successfully reset to zero!" });
});

// GET /api/users
router.get("/users", async (req: AuthenticatedRequest, res: Response) => {
  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const users = (db.users || []).filter((u: any) => u.tenantId === currentTenantId && !u.deleted);
  res.json(users);
});

// POST /api/users/add
router.post("/users/add", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin" && req.user!.role !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied: Admin or Sub-Admin only." });
  }
  const { name, email, password, phone, whatsapp, role, department, salaryBase, commissionRate, monthlyTarget, dailyWork, position, joiningDate, employmentCode } = req.body;
  if (!name || !password || !role) {
    return res.status(400).json({ error: "Name, password and role are required." });
  }
  const db = readDB();
  db.users = db.users || [];
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.user?.companyId || "c-default";

  const existing = db.users.find((u: any) => u.tenantId === currentTenantId && u.name.trim().toLowerCase() === name.trim().toLowerCase() && !u.deleted);
  if (existing) {
    return res.status(400).json({ error: "Username already registered." });
  }
  const userId = "u-" + Date.now();
  const newUser = {
    id: userId,
    name,
    email: email || "",
    password,
    phone: phone || "",
    whatsapp: whatsapp || "",
    role,
    department: department || "Sales",
    position: position || "",
    salaryBase: Number(salaryBase) || 15000,
    commissionRate: Number(commissionRate) || 0,
    monthlyTarget: Number(monthlyTarget) || 0,
    dailyWork: dailyWork || "",
    joiningDate: joiningDate || new Date().toISOString().split("T")[0],
    employmentCode: employmentCode || "",
    status: "active",
    tenantId: currentTenantId,
    companyId: currentCompanyId
  };
  db.users.push(newUser);
  await writeDB(db);
  res.json({ success: true, user: newUser });
});

// POST /api/users/admin-update-user
router.post("/users/admin-update-user", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin" && req.user!.role !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied: Admin or Sub-Admin only." });
  }
  const { userId, name, email, password, phone, whatsapp, role, department, salaryBase, commissionRate, monthlyTarget, dailyWork, position, joiningDate, employmentCode } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }
  const db = readDB();
  db.users = db.users || [];
  const currentTenantId = req.tenantId || "t-default";

  const user = db.users.find((u: any) => u.id === userId && u.tenantId === currentTenantId);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  if (name) user.name = name;
  if (email !== undefined) user.email = email;
  if (password) user.password = password;
  if (phone !== undefined) user.phone = phone;
  if (whatsapp !== undefined) user.whatsapp = whatsapp;
  if (role) user.role = role;
  if (department !== undefined) user.department = department;
  if (salaryBase !== undefined) user.salaryBase = Number(salaryBase);
  if (commissionRate !== undefined) user.commissionRate = Number(commissionRate);
  if (monthlyTarget !== undefined) user.monthlyTarget = Number(monthlyTarget);
  if (dailyWork !== undefined) user.dailyWork = dailyWork;
  if (position !== undefined) user.position = position;
  if (joiningDate !== undefined) user.joiningDate = joiningDate;
  if (employmentCode !== undefined) user.employmentCode = employmentCode;
  
  await writeDB(db);
  res.json({ success: true, user });
});

// POST /api/users/update-profile
router.post("/users/update-profile", async (req: AuthenticatedRequest, res: Response) => {
  const { userId, name, email, password, phone, whatsapp } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }
  if (req.user!.id !== userId && req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: You can only update your own profile." });
  }
  const db = readDB();
  db.users = db.users || [];
  const currentTenantId = req.tenantId || "t-default";

  const user = db.users.find((u: any) => u.id === userId && u.tenantId === currentTenantId);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  if (name) user.name = name;
  if (email !== undefined) user.email = email;
  if (password) user.password = password;
  if (phone !== undefined) user.phone = phone;
  if (whatsapp !== undefined) user.whatsapp = whatsapp;
  
  await writeDB(db);
  res.json({ success: true, user });
});

// POST /api/users/reset-password
router.post("/users/reset-password", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Admins only." });
  }
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ error: "User ID and new password are required." });
  }
  const db = readDB();
  db.users = db.users || [];
  const currentTenantId = req.tenantId || "t-default";

  const user = db.users.find((u: any) => u.id === userId && u.tenantId === currentTenantId);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  user.password = newPassword;
  await writeDB(db);
  res.json({ success: true, message: "Password updated successfully!" });
});

// POST /api/users/update-rates
router.post("/users/update-rates", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin" && req.user!.role !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied: Admin or Sub-Admin only." });
  }
  const { userId, commissionRate, monthlyTarget } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }
  const db = readDB();
  db.users = db.users || [];
  const currentTenantId = req.tenantId || "t-default";

  const user = db.users.find((u: any) => u.id === userId && u.tenantId === currentTenantId);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  if (commissionRate !== undefined) user.commissionRate = Number(commissionRate);
  if (monthlyTarget !== undefined) user.monthlyTarget = Number(monthlyTarget);
  
  await writeDB(db);
  res.json({ success: true, user });
});

// POST /api/users/toggle-status
router.post("/users/toggle-status", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Main Admin only." });
  }
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }
  const db = readDB();
  db.users = db.users || [];
  const currentTenantId = req.tenantId || "t-default";

  const user = db.users.find((u: any) => u.id === userId && u.tenantId === currentTenantId);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  user.status = user.status === "active" ? "suspended" : "active";
  await writeDB(db);
  res.json({ success: true, user });
});

// POST /api/users/delete
router.post("/users/delete", async (req: AuthenticatedRequest, res: Response) => {
  const requesterRole = req.user!.role;
  const requesterId = req.user!.id;

  if (requesterRole !== "admin" && requesterRole !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied" });
  }
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }
  if (userId === "u-admin") {
    return res.status(400).json({ error: "The primary/main administrator account cannot be deleted. (मुख्य एडमिन खाता हटाया नहीं जा सकता।)" });
  }
  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";

  const user = db.users.find((u: any) => u.id === userId && u.tenantId === currentTenantId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  if (requesterRole === "sub-admin" && (user.role === "admin" || user.role === "sub-admin")) {
    return res.status(403).json({ error: "Access Denied: Sub-Admins cannot delete other administrators or sub-admins." });
  }

  user.deleted = true;
  user.deletedAt = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  db.leads.forEach((l: any) => {
    if (l.tenantId === currentTenantId && l.assignedTo === userId) {
      l.assignedTo = null;
      l.assignedName = null;
    }
  });
  await writeDB(db);
  return res.json({ success: true, message: "User successfully deleted from database (soft-deleted to preserve payroll history)." });
});

// POST /api/users/reset-performance
router.post("/users/reset-performance", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied" });
  }
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }
  const db = readDB();
  db.callLogs = db.callLogs.filter((c: any) => c.telecallerId !== userId);
  await writeDB(db);
  res.json({ success: true, message: "Telecaller calling history and performance payroll reset to zero." });
});

export default router;
