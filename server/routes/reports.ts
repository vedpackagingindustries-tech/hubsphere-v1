import { Router, Response } from "express";
import { readDB, writeDB } from "../utils/fileLock";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { calculatePayrollReport, getHRMLists } from "../services/payroll.service";
import { submitReport, reviewReport } from "../services/report.service";

const router = Router();

// Apply authenticateUser middleware to all reports/payroll routes
router.use(authenticateUser);

// ==========================================
// DEPARTMENTAL WORKFLOW REPORTING ENDPOINTS
// ==========================================

// GET /api/reports
router.get("/", (req: AuthenticatedRequest, res: Response) => {
  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";
  const records = (db.reports || []).filter((r: any) => r.tenantId === currentTenantId);
  res.json(records);
});

// POST /api/reports/submit
router.post("/submit", async (req: AuthenticatedRequest, res: Response) => {
  const { type, senderId, senderName, senderRole, department, reportText, date } = req.body;
  if (!senderId || !senderName || !reportText || !date) {
    return res.status(400).json({ error: "Sender details, Date, and Report content are required." });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.user?.companyId || "c-default";

  try {
    const newReport = submitReport(db, {
      type,
      senderId,
      senderName,
      senderRole,
      department,
      reportText,
      date,
      tenantId: currentTenantId,
      companyId: currentCompanyId
    });
    await writeDB(db);
    res.json({ success: true, report: newReport, message: "Report submitted successfully!" });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to submit report." });
  }
});

// POST /api/reports/review
router.post("/review", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== "admin" && user.role !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied: Only administrators can review reports." });
  }

  const { reportId, feedback, reviewerId, reviewerName } = req.body;
  if (!reportId || !feedback) {
    return res.status(400).json({ error: "Report ID and Feedback content are required." });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";

  try {
    const finalReviewerId = reviewerId || user.id;
    const finalReviewerName = reviewerName || user.name;
    const report = reviewReport(db, reportId, finalReviewerId, finalReviewerName, feedback, currentTenantId);
    await writeDB(db);
    res.json({ success: true, report, message: "Report reviewed and feedback sent successfully!" });
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Report not found." });
  }
});


// ==========================================
// PAYROLL ENDPOINTS
// ==========================================

// GET /api/payroll/report
router.get("/payroll/report", (req: AuthenticatedRequest, res: Response) => {
  const db = readDB();
  const targetMonth = (req.query.month as string) || new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentTenantId = req.tenantId || "t-default";

  try {
    const report = calculatePayrollReport(db, targetMonth, currentTenantId);
    res.json(report);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to generate payroll report." });
  }
});

// POST /api/payroll/toggle-override (Main Admin control)
router.post("/payroll/toggle-override", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only Main Admin can modify overrides" });
  }

  const { month, userId, type } = req.body; // type: 'performance' | 'overtime' | 'leave'
  if (!month || !userId || !type) {
    return res.status(400).json({ error: "Month, User ID, and Type are required" });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.user?.companyId || "c-default";

  db.payrollOverrides = db.payrollOverrides || [];
  
  let override = db.payrollOverrides.find((o: any) => o.tenantId === currentTenantId && o.month === month && o.userId === userId);
  if (!override) {
    override = { 
      month, 
      userId, 
      forceFullSalary: false, 
      extraLeavePaid: false, 
      approveOvertime: true,
      tenantId: currentTenantId,
      companyId: currentCompanyId
    };
    db.payrollOverrides.push(override);
  }

  if (type === "performance") {
    override.forceFullSalary = !override.forceFullSalary;
  } else if (type === "leave") {
    override.extraLeavePaid = !override.extraLeavePaid;
  } else if (type === "overtime") {
    override.approveOvertime = !override.approveOvertime;
  }

  await writeDB(db);
  res.json({ success: true, override, message: "Override updated successfully!" });
});

// POST /api/payroll/release (Main Admin)
router.post("/payroll/release", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only Main Admin can release salaries" });
  }

  const { month, userId, finalSalary } = req.body;
  if (!month || !userId) {
    return res.status(400).json({ error: "Month and User ID are required" });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.user?.companyId || "c-default";

  db.releasedSalaries = db.releasedSalaries || [];

  const existingIndex = db.releasedSalaries.findIndex((r: any) => r.tenantId === currentTenantId && r.month === month && r.userId === userId);
  const releaseRecord = {
    month,
    userId,
    releasedAt: new Date().toISOString(),
    finalSalary: Number(finalSalary) || 0,
    tenantId: currentTenantId,
    companyId: currentCompanyId
  };

  if (existingIndex >= 0) {
    db.releasedSalaries[existingIndex] = releaseRecord;
  } else {
    db.releasedSalaries.push(releaseRecord);
  }

  await writeDB(db);
  res.json({ success: true, record: releaseRecord, message: "Salary released successfully (सैलरी का भुगतान कर दिया गया है)!" });
});

export default router;
