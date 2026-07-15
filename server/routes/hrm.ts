import { Router, Request, Response } from "express";
import { readDB, writeDB } from "../utils/fileLock";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { getHRMLists } from "../services/payroll.service";

const router = Router();

// Apply authenticateUser to all HRM, attendance, and task routes
router.use(authenticateUser);

// ==========================================
// ATTENDANCE ENDPOINTS
// ==========================================

// POST /api/attendance/login
router.post("/attendance/login", async (req: AuthenticatedRequest, res: Response) => {
  const { userId, loginTimeOverride } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (userId === "u-admin") {
    // Exclude main admin from attendance tracking
    return res.json({ success: true, ignored: true, message: "Main admin is excluded from attendance tracking" });
  }

  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.user?.companyId || "c-default";

  const user = db.users.find((u: any) => u.id === userId && u.tenantId === currentTenantId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const existing = db.attendance.find((a: any) => a.userId === userId && a.date === today && a.tenantId === currentTenantId);

  if (existing) {
    return res.json({ success: true, attendance: existing, message: "Already logged in today" });
  }

  const newRecord = {
    id: "att-" + Date.now(),
    userId,
    userName: user.name,
    userRole: user.role,
    date: today,
    loginTime: loginTimeOverride || new Date().toISOString(),
    logoutTime: null,
    status: "Present",
    tenantId: currentTenantId,
    companyId: currentCompanyId
  };

  db.attendance.push(newRecord);
  await writeDB(db);

  res.json({ success: true, attendance: newRecord, message: "Successfully logged in for today" });
});

// POST /api/attendance/logout
router.post("/attendance/logout", async (req: AuthenticatedRequest, res: Response) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  if (userId === "u-admin") {
    return res.json({ success: true, ignored: true });
  }

  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";

  const today = new Date().toISOString().split("T")[0];
  const record = db.attendance.find((a: any) => a.userId === userId && a.date === today && a.tenantId === currentTenantId);

  if (record) {
    record.logoutTime = new Date().toISOString();
    await writeDB(db);
    return res.json({ success: true, attendance: record, message: "Successfully logged out" });
  }

  // Fallback: search for latest active with null logoutTime
  const latestNull = [...db.attendance]
    .reverse()
    .find((a: any) => a.userId === userId && !a.logoutTime && a.tenantId === currentTenantId);

  if (latestNull) {
    latestNull.logoutTime = new Date().toISOString();
    await writeDB(db);
    return res.json({ success: true, attendance: latestNull, message: "Successfully logged out from previous session" });
  }

  res.status(404).json({ error: "No active attendance record found for today to logout." });
});

// GET /api/attendance
router.get("/attendance", (req: AuthenticatedRequest, res: Response) => {
  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";
  const records = (db.attendance || []).filter((a: any) => a.tenantId === currentTenantId);
  res.json(records);
});


// ==========================================
// LEAVES ENDPOINTS
// ==========================================

// GET /api/leaves
router.get("/leaves", (req: AuthenticatedRequest, res: Response) => {
  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";
  const records = (db.leaves || []).filter((l: any) => l.tenantId === currentTenantId);
  res.json(records);
});

// POST /api/leaves/apply
router.post("/leaves/apply", async (req: AuthenticatedRequest, res: Response) => {
  const { userId, reason, startDate, endDate } = req.body;
  if (!userId || !reason || !startDate || !endDate) {
    return res.status(400).json({ error: "All fields are required to apply for leave" });
  }

  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.user?.companyId || "c-default";

  const user = db.users.find((u: any) => u.id === userId && u.tenantId === currentTenantId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Compute number of days (inclusive)
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const newLeave = {
    id: "leave-" + Date.now(),
    userId,
    userName: user.name,
    userRole: user.role,
    reason,
    startDate,
    endDate,
    daysCount,
    status: "Pending", // Pending, Approved, Rejected
    appliedAt: new Date().toISOString(),
    approvedBy: null,
    tenantId: currentTenantId,
    companyId: currentCompanyId
  };

  db.leaves.push(newLeave);
  await writeDB(db);

  res.json({ success: true, leave: newLeave, message: "Leave applied successfully and is pending main admin approval." });
});

// POST /api/leaves/approve
router.post("/leaves/approve", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only main administrator can approve or reject leaves." });
  }

  const { leaveId, action, rejectionReason, payType } = req.body; // action is "Approved" or "Rejected"
  if (!leaveId || !action) {
    return res.status(400).json({ error: "Leave ID and action are required" });
  }

  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";

  const leave = db.leaves.find((l: any) => l.id === leaveId && l.tenantId === currentTenantId);
  if (!leave) {
    return res.status(404).json({ error: "Leave application not found" });
  }

  leave.status = action;
  leave.approvedBy = "u-admin";
  if (action === "Rejected") {
    leave.rejectionReason = rejectionReason || "No reason specified";
    leave.payType = null;
  } else {
    leave.rejectionReason = null;
    leave.payType = payType || "Full Pay";
  }
  
  await writeDB(db);
  res.json({ success: true, leave, message: `Leave has been successfully ${action.toLowerCase()}` });
});

// POST /api/leaves/query
router.post("/leaves/query", async (req: AuthenticatedRequest, res: Response) => {
  const { leaveId, queryText, userId } = req.body;
  if (!leaveId || !queryText || !userId) {
    return res.status(400).json({ error: "Leave ID, query text, and user ID are required" });
  }

  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";

  const leave = db.leaves.find((l: any) => l.id === leaveId && l.tenantId === currentTenantId);
  if (!leave) {
    return res.status(404).json({ error: "Leave application not found" });
  }

  if (leave.userId !== userId) {
    return res.status(403).json({ error: "Access Denied: You cannot query this leave application" });
  }

  if (leave.status !== "Rejected" && leave.status !== "Queried") {
    return res.status(400).json({ error: "You can only raise questions on rejected leave applications." });
  }

  leave.query = queryText;
  leave.status = "Queried";
  leave.queryResponse = null; // Clear any old responses
  
  await writeDB(db);
  res.json({ success: true, leave, message: "Question raised successfully. Awaiting admin response." });
});

// POST /api/leaves/respond
router.post("/leaves/respond", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only main administrator can respond to queries." });
  }

  const { leaveId, response, action, payType } = req.body; // action can be "Approved" or "Rejected"
  if (!leaveId || !response || !action) {
    return res.status(400).json({ error: "Leave ID, response, and action are required" });
  }

  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";

  const leave = db.leaves.find((l: any) => l.id === leaveId && l.tenantId === currentTenantId);
  if (!leave) {
    return res.status(404).json({ error: "Leave application not found" });
  }

  leave.queryResponse = response;
  leave.status = action;
  if (action === "Approved") {
    leave.payType = payType || "Full Pay";
    leave.approvedBy = "u-admin";
  } else {
    leave.payType = null;
  }
  
  await writeDB(db);
  res.json({ success: true, leave, message: `Response registered. Leave status is now ${action.toLowerCase()}` });
});


// ==========================================
// COMPANY HOLIDAYS ENDPOINTS
// ==========================================

// GET /api/company-holidays
router.get("/company-holidays", (req: AuthenticatedRequest, res: Response) => {
  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";
  const records = (db.companyHolidays || []).filter((h: any) => h.tenantId === currentTenantId);
  res.json(records);
});

// POST /api/company-holidays
router.post("/company-holidays", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin" || req.user!.id !== "u-admin") {
    return res.status(403).json({ error: "Access Denied: Only Main Admin can declare holidays." });
  }

  const { date, reason } = req.body;
  if (!date || !reason) {
    return res.status(400).json({ error: "Date and reason are required" });
  }

  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.user?.companyId || "c-default";

  const existing = db.companyHolidays.find((h: any) => h.date === date && h.tenantId === currentTenantId);
  if (existing) {
    existing.reason = reason;
  } else {
    db.companyHolidays.push({
      id: "hol-" + Date.now(),
      date,
      reason,
      tenantId: currentTenantId,
      companyId: currentCompanyId
    });
  }

  await writeDB(db);
  res.json({ success: true, message: "Company Holiday declared successfully!" });
});

// DELETE /api/company-holidays/:id
router.delete("/company-holidays/:id", async (req: AuthenticatedRequest, res: Response) => {
  if (req.user!.role !== "admin" || req.user!.id !== "u-admin") {
    return res.status(403).json({ error: "Access Denied: Only Main Admin can delete holidays." });
  }

  const { id } = req.params;
  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";

  db.companyHolidays = db.companyHolidays.filter((h: any) => !(h.id === id && h.tenantId === currentTenantId));
  await writeDB(db);
  res.json({ success: true, message: "Company Holiday deleted successfully." });
});


// ==========================================
// WORK / TASK ENDPOINTS FOR SYSTEM WORKFLOW
// ==========================================

// GET /api/tasks
router.get("/tasks", (req: AuthenticatedRequest, res: Response) => {
  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";

  const actorId = req.user!.id;
  let userTasks = (db.tasks || []).filter((t: any) => t.tenantId === currentTenantId);

  // If requester is not the main admin ("u-admin")
  if (actorId && actorId !== "u-admin") {
    const requester = db.users.find((u: any) => u.id === actorId && u.tenantId === currentTenantId);
    if (requester) {
      if (requester.role === "admin" || requester.role === "sub-admin") {
        // Sub-admin or admin can see all tasks, do not restrict!
        return res.json(userTasks);
      } else if (requester.role === "head") {
        // Department heads can see tasks assigned to them, assigned by them, or within their department
        const dept = requester.department;
        userTasks = userTasks.filter((t: any) => 
          t.assignedTo === actorId || 
          t.assignedBy === actorId || 
          (dept && t.department === dept)
        );
        return res.json(userTasks);
      } else {
        // Standard staff (tech/nontech) / telecaller: can only see tasks assigned to them
        userTasks = userTasks.filter((t: any) => t.assignedTo === actorId);
        return res.json(userTasks);
      }
    }
  }

  const { adminId, assignedTo, assignedBy, department } = req.query;

  // Backward compatibility support for adminId parameter
  if (adminId) {
    userTasks = userTasks.filter((t: any) => t.adminId === adminId || t.assignedTo === adminId || t.assignedBy === adminId);
    return res.json(userTasks);
  }

  if (assignedTo) {
    userTasks = userTasks.filter((t: any) => t.assignedTo === assignedTo || t.adminId === assignedTo);
  }
  if (assignedBy) {
    userTasks = userTasks.filter((t: any) => t.assignedBy === assignedBy);
  }
  if (department) {
    userTasks = userTasks.filter((t: any) => t.department === department);
  }

  res.json(userTasks);
});

// POST /api/tasks
router.post("/tasks", async (req: AuthenticatedRequest, res: Response) => {
  const { adminId, adminName, title, date, assignedTo, assignedToName, assignedBy, assignedByName, department, referenceFile } = req.body;
  
  const finalAssignedTo = assignedTo || adminId;
  const finalAssignedToName = assignedToName || adminName;
  const finalAssignedBy = assignedBy || req.user!.id || "u-admin";
  const finalAssignedByName = assignedByName || req.user!.name || "Administrator";

  if (!finalAssignedTo || !finalAssignedToName || !title || !date) {
    return res.status(400).json({ error: "Assignee details, task Title, and Date are required." });
  }

  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.user?.companyId || "c-default";

  const newTask = {
    id: "task-" + Date.now(),
    adminId: finalAssignedTo, // backward compatibility
    adminName: finalAssignedToName, // backward compatibility
    assignedTo: finalAssignedTo,
    assignedToName: finalAssignedToName,
    assignedBy: finalAssignedBy,
    assignedByName: finalAssignedByName,
    department: department || null,
    title,
    date,
    assignedAt: new Date().toISOString(),
    completedAt: null,
    referenceFile: referenceFile || null,
    status: "Pending", // Pending, Submitted, Approved, Denied, Appealed
    remark: null,
    adminReply: null,
    appeal: null,
    appealReply: null,
    overdueRemark: null,
    overdueReply: null,
    replies: [],
    tenantId: currentTenantId,
    companyId: currentCompanyId
  };

  db.tasks.push(newTask);
  await writeDB(db);
  res.json({ success: true, task: newTask, message: "Task assigned successfully!" });
});

// DELETE /api/tasks/:id
router.delete("/tasks/:id", async (req: AuthenticatedRequest, res: Response) => {
  const actorId = req.user!.id;
  const actorRole = req.user!.role;
  const taskId = req.params.id;

  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";

  const taskIdx = db.tasks.findIndex((t: any) => t.id === taskId && t.tenantId === currentTenantId);
  if (taskIdx === -1) {
    return res.status(404).json({ error: "Task not found." });
  }

  const task = db.tasks[taskIdx];
  // Allow delete if main admin or task creator
  const isAllowed = actorId === "u-admin" || task.assignedBy === actorId || actorRole === "admin";
  if (!isAllowed) {
    return res.status(403).json({ error: "Access Denied: You cannot delete this task." });
  }

  db.tasks.splice(taskIdx, 1);
  await writeDB(db);
  res.json({ success: true, message: "Task deleted successfully!" });
});

// POST /api/tasks/submit
router.post("/tasks/submit", async (req: AuthenticatedRequest, res: Response) => {
  const { taskId, status, remark, file } = req.body;
  if (!taskId || !status || !remark) {
    return res.status(400).json({ error: "Task ID, status, and genuine remark are required." });
  }

  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";

  const task = db.tasks.find((t: any) => t.id === taskId && t.tenantId === currentTenantId);
  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  task.status = status === "Completed" ? "Submitted" : "Pending";
  task.remark = remark;
  task.file = file || null;
  task.completedAt = status === "Completed" ? new Date().toISOString() : null;
  task.adminReply = null;
  task.appeal = null;
  task.appealReply = null;

  await writeDB(db);
  res.json({ success: true, task, message: "Task update submitted successfully!" });
});

// POST /api/tasks/evaluate
router.post("/tasks/evaluate", async (req: AuthenticatedRequest, res: Response) => {
  const { taskId, action, adminReply } = req.body;
  const actorId = req.user!.id;
  const actorRole = req.user!.role;

  if (!taskId || !action || !adminReply) {
    return res.status(400).json({ error: "Task ID, evaluation action, and reply are required." });
  }

  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";

  const task = db.tasks.find((t: any) => t.id === taskId && t.tenantId === currentTenantId);
  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  // Allow evaluation if caller is Main Admin, or if they are the task assigner, or if they are an admin
  const isAllowed = actorId === "u-admin" || task.assignedBy === actorId || actorRole === "admin";
  if (!isAllowed) {
    return res.status(403).json({ error: "Access Denied: You cannot evaluate this task." });
  }

  task.status = action;
  task.adminReply = adminReply;

  await writeDB(db);
  res.json({ success: true, task, message: `Task has been ${action.toLowerCase()} successfully.` });
});

// POST /api/tasks/appeal
router.post("/tasks/appeal", async (req: AuthenticatedRequest, res: Response) => {
  const { taskId, appeal } = req.body;
  if (!taskId || !appeal) {
    return res.status(400).json({ error: "Task ID and appeal question are required." });
  }

  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";

  const task = db.tasks.find((t: any) => t.id === taskId && t.tenantId === currentTenantId);
  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  task.status = "Appealed";
  task.appeal = appeal;
  task.appealReply = null;

  await writeDB(db);
  res.json({ success: true, task, message: "Appeal/Question raised successfully!" });
});

// POST /api/tasks/appeal-reply
router.post("/tasks/appeal-reply", async (req: AuthenticatedRequest, res: Response) => {
  const { taskId, appealReply, action } = req.body;
  const actorId = req.user!.id;
  const actorRole = req.user!.role;

  if (!taskId || !appealReply || !action) {
    return res.status(400).json({ error: "Task ID, reply instruction, and final action are required." });
  }

  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";

  const task = db.tasks.find((t: any) => t.id === taskId && t.tenantId === currentTenantId);
  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  // Allow appeal reply if Main Admin or task creator
  const isAllowed = actorId === "u-admin" || task.assignedBy === actorId || actorRole === "admin";
  if (!isAllowed) {
    return res.status(403).json({ error: "Access Denied: You cannot answer this appeal." });
  }

  task.appealReply = appealReply;
  task.status = action;

  await writeDB(db);
  res.json({ success: true, task, message: `Response registered. Task status updated to ${action}.` });
});

// POST /api/tasks/overdue-remark
router.post("/tasks/overdue-remark", async (req: AuthenticatedRequest, res: Response) => {
  const { taskId, overdueRemark } = req.body;

  if (!taskId || !overdueRemark) {
    return res.status(400).json({ error: "Task ID and explanation remark are required." });
  }

  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";

  const task = db.tasks.find((t: any) => t.id === taskId && t.tenantId === currentTenantId);
  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  task.overdueRemark = overdueRemark;
  await writeDB(db);
  res.json({ success: true, task, message: "Overdue delay explanation remark added successfully!" });
});

// POST /api/tasks/overdue-reply
router.post("/tasks/overdue-reply", async (req: AuthenticatedRequest, res: Response) => {
  const { taskId, overdueReply } = req.body;
  const actorId = req.user!.id;
  const actorRole = req.user!.role;

  if (!taskId || !overdueReply) {
    return res.status(400).json({ error: "Task ID and reply message are required." });
  }

  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";

  const task = db.tasks.find((t: any) => t.id === taskId && t.tenantId === currentTenantId);
  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  const isAllowed = actorId === "u-admin" || task.assignedBy === actorId || actorRole === "admin";
  if (!isAllowed) {
    return res.status(403).json({ error: "Access Denied: You cannot reply to this explanation." });
  }

  task.overdueReply = overdueReply;
  await writeDB(db);
  res.json({ success: true, task, message: "Response to delay explanation registered successfully!" });
});

// POST /api/tasks/reply
router.post("/tasks/reply", async (req: AuthenticatedRequest, res: Response) => {
  const { taskId, message, senderId, senderName, senderRole } = req.body;

  if (!taskId || !message || !senderId || !senderName) {
    return res.status(400).json({ error: "Task ID, message, sender ID, and sender name are required." });
  }

  const db = readDB();
  getHRMLists(db);
  const currentTenantId = req.tenantId || "t-default";

  const task = db.tasks.find((t: any) => t.id === taskId && t.tenantId === currentTenantId);
  if (!task) {
    return res.status(404).json({ error: "Task not found." });
  }

  if (!task.replies) {
    task.replies = [];
  }

  const resolvedRole = senderRole || req.user!.role || 'staff';

  const newReply = {
    senderId,
    senderName,
    senderRole: resolvedRole,
    message,
    timestamp: new Date().toISOString()
  };

  task.replies.push(newReply);
  await writeDB(db);
  res.json({ success: true, task, reply: newReply, message: "Reply added successfully!" });
});

export default router;
