import { Router, Response } from "express";
import { readDB, writeDB } from "../utils/fileLock";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { assignLead, bulkAssignLeads, updateLeadStatus, importLeads } from "../services/lead.service";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// Protect all lead routes with authenticateUser middleware
router.use(authenticateUser);

// GET /api/leads
router.get("/", (req: AuthenticatedRequest, res: Response) => {
  const db = readDB();
  const user = req.user!;
  const currentTenantId = req.tenantId || "t-default";

  // Scope to current tenant's leads first
  const tenantLeads = db.leads.filter((l: any) => l.tenantId === currentTenantId);

  if (user.role === "telecaller") {
    // Strict isolation: Telecaller only sees their own assigned leads within the tenant
    const filtered = tenantLeads.filter((l: any) => l.assignedTo === user.id);
    return res.json(filtered);
  }

  // Admins, Sub-Admins, and Heads see all leads of the tenant
  res.json(tenantLeads);
});

// POST /api/leads/add
router.post("/add", async (req: AuthenticatedRequest, res: Response) => {
  const { name, phone, whatsapp, email, requirements, assignedTo } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: "Name and phone number are required" });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.companyId || "c-default";
  let assignedName = null;
  let finalAssignedTo = assignedTo || null;

  const user = req.user!;
  if (user.role === "telecaller") {
    finalAssignedTo = user.id;
  }

  if (finalAssignedTo) {
    // Lookup user in current tenant's list
    const caller = db.users.find((u: any) => u.id === finalAssignedTo && u.tenantId === currentTenantId);
    if (caller) assignedName = caller.name;
  }

  const newLead = {
    id: "lead-" + Date.now(),
    name,
    phone,
    whatsapp: whatsapp || "",
    email: email || "",
    requirements: requirements || "No specific details provided.",
    status: "New",
    assignedTo: finalAssignedTo,
    assignedName,
    assignedByAdminId: user.role === "admin" ? user.id : null,
    assignedByAdminName: user.role === "admin" ? "Direct Add" : null,
    assignedAt: user.role === "admin" ? new Date().toISOString() : null,
    notes: "",
    createdAt: new Date().toISOString(),
    tenantId: currentTenantId,
    companyId: currentCompanyId,
    journey: [
      {
        status: "New",
        notes: "Lead registered in CRM",
        updatedBy: user.role === "admin" ? "Admin" : "System",
        timestamp: new Date().toISOString()
      }
    ]
  };

  db.leads.push(newLead);
  await writeDB(db);

  res.json({ success: true, lead: newLead });
});

// POST /api/leads/assign
router.post("/assign", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== "admin" && user.role !== "sub-admin" && user.role !== "head") {
    return res.status(403).json({ error: "Access Denied: Only managers can assign leads." });
  }

  const { leadId, userId, adminId, adminName } = req.body;
  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";

  // Security check: ensure target lead is within active tenant
  const lead = db.leads.find((l: any) => l.id === leadId && l.tenantId === currentTenantId);
  if (!lead) {
    return res.status(404).json({ error: "Lead not found in tenant" });
  }

  // Security check: ensure target user is within active tenant
  if (userId && userId !== "unassign") {
    const targetUser = db.users.find((u: any) => u.id === userId && u.tenantId === currentTenantId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found in tenant" });
    }
  }

  try {
    const finalAdminId = adminId || user.id;
    const finalAdminName = adminName || user.name;
    const updatedLead = assignLead(db, leadId, userId, finalAdminId, finalAdminName);
    await writeDB(db);
    res.json({ success: true, lead: updatedLead });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to assign lead." });
  }
});

// POST /api/leads/bulk-assign
router.post("/bulk-assign", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== "admin" && user.role !== "sub-admin" && user.role !== "head") {
    return res.status(403).json({ error: "Access Denied: Only managers can bulk-assign leads." });
  }

  const { leadIds, userId, adminId, adminName } = req.body;
  if (!leadIds || !Array.isArray(leadIds)) {
    return res.status(400).json({ error: "Invalid lead IDs" });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";

  // Security check: ensure all requested leads belong to active tenant
  const invalidLeads = leadIds.some(id => !db.leads.some((l: any) => l.id === id && l.tenantId === currentTenantId));
  if (invalidLeads) {
    return res.status(403).json({ error: "Access Denied: Some leads do not belong to your tenant." });
  }

  // Security check: ensure target user belongs to active tenant
  if (userId && userId !== "unassign") {
    const targetUser = db.users.find((u: any) => u.id === userId && u.tenantId === currentTenantId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found in tenant" });
    }
  }

  const finalAdminId = adminId || user.id;
  const finalAdminName = adminName || user.name;

  bulkAssignLeads(db, leadIds, userId, finalAdminId, finalAdminName);
  await writeDB(db);

  res.json({ success: true });
});

// POST /api/leads/delete
router.post("/delete", async (req: AuthenticatedRequest, res: Response) => {
  const { leadId } = req.body;
  if (!leadId) {
    return res.status(400).json({ error: "Lead ID is required" });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const leadIndex = db.leads.findIndex((l: any) => l.id === leadId && l.tenantId === currentTenantId);
  if (leadIndex === -1) {
    return res.status(404).json({ error: "Lead not found" });
  }

  const user = req.user!;
  const lead = db.leads[leadIndex];

  if (user.role === "telecaller" && lead.assignedTo !== user.id) {
    console.warn(`Unauthorized delete attempt: telecaller ${user.id} tried to delete lead owned by ${lead.assignedTo}`);
    return res.status(403).json({ error: "Access Denied: You can only delete your own assigned leads." });
  }

  db.leads.splice(leadIndex, 1);
  await writeDB(db);
  res.json({ success: true, message: "Lead successfully deleted." });
});

// POST /api/leads/update-status
router.post("/update-status", async (req: AuthenticatedRequest, res: Response) => {
  const { leadId, status, notes, dealValue, updatedBy } = req.body;
  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";

  // Security check: ensure lead belongs to the active tenant
  const lead = db.leads.find((l: any) => l.id === leadId && l.tenantId === currentTenantId);
  if (!lead) {
    return res.status(404).json({ error: "Lead not found in tenant" });
  }

  try {
    const user = req.user!;
    const updatedLead = updateLeadStatus(db, leadId, status, notes, dealValue, updatedBy, user.role, user.id);
    await writeDB(db);
    res.json({ success: true, lead: updatedLead });
  } catch (error: any) {
    res.status(404).json({ error: error.message || "Lead not found" });
  }
});

// POST /api/leads/import
router.post("/import", async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== "admin") {
    return res.status(403).json({ error: "Access Denied: Only administrators can import CSV data." });
  }

  const { leads } = req.body;
  if (!leads || !Array.isArray(leads)) {
    return res.status(400).json({ error: "Invalid leads format" });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.companyId || "c-default";
  const count = importLeads(db, leads, currentTenantId, currentCompanyId);
  await writeDB(db);

  res.json({ success: true, count });
});

// POST /api/leads/update-360
router.post("/update-360", async (req: AuthenticatedRequest, res: Response) => {
  const { 
    leadId, leadScore, tags, priority, notesList, documents, whatsapp, email, phone, requirements, name, tasks, followUps, aiCopilotAnalysis,
    dealValue, source, industry, companySize, website, gst, address, city, state, country, pin, meetings
  } = req.body;
  if (!leadId) {
    return res.status(400).json({ error: "Lead ID is required" });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const lead = db.leads.find((l: any) => l.id === leadId && l.tenantId === currentTenantId);
  if (!lead) {
    return res.status(404).json({ error: "Lead not found in tenant" });
  }

  const user = req.user!;

  // Maintain historical updates
  const updatedBy = user.name || "User";
  if (!lead.journey) lead.journey = [];

  // Track field changes
  let changeNotes = [];
  if (name && lead.name !== name) {
    changeNotes.push(`Name changed from '${lead.name}' to '${name}'`);
    lead.name = name;
  }
  if (phone && lead.phone !== phone) {
    changeNotes.push(`Phone changed from '${lead.phone}' to '${phone}'`);
    lead.phone = phone;
  }
  if (whatsapp !== undefined && lead.whatsapp !== whatsapp) {
    changeNotes.push(`WhatsApp updated`);
    lead.whatsapp = whatsapp;
  }
  if (email !== undefined && lead.email !== email) {
    changeNotes.push(`Email updated`);
    lead.email = email;
  }
  if (requirements !== undefined && lead.requirements !== requirements) {
    changeNotes.push(`Requirements updated`);
    lead.requirements = requirements;
  }
  if (leadScore !== undefined && lead.leadScore !== leadScore) {
    changeNotes.push(`Lead Score changed to ${leadScore}%`);
    lead.leadScore = Number(leadScore) || 0;
  }
  if (priority !== undefined && lead.priority !== priority) {
    changeNotes.push(`Priority changed to ${priority}`);
    lead.priority = priority;
  }
  if (dealValue !== undefined && lead.dealValue !== dealValue) {
    changeNotes.push(`Deal Value changed to ₹${dealValue}`);
    lead.dealValue = Number(dealValue) || 0;
  }
  if (source !== undefined && lead.source !== source) {
    lead.source = source;
  }
  if (industry !== undefined && lead.industry !== industry) {
    lead.industry = industry;
  }
  if (companySize !== undefined && lead.companySize !== companySize) {
    lead.companySize = companySize;
  }
  if (website !== undefined && lead.website !== website) {
    lead.website = website;
  }
  if (gst !== undefined && lead.gst !== gst) {
    lead.gst = gst;
  }
  if (address !== undefined && lead.address !== address) {
    lead.address = address;
  }
  if (city !== undefined && lead.city !== city) {
    lead.city = city;
  }
  if (state !== undefined && lead.state !== state) {
    lead.state = state;
  }
  if (country !== undefined && lead.country !== country) {
    lead.country = country;
  }
  if (pin !== undefined && lead.pin !== pin) {
    lead.pin = pin;
  }
  if (tags !== undefined) {
    lead.tags = tags;
  }
  if (notesList !== undefined) {
    lead.notesList = notesList;
  }
  if (documents !== undefined) {
    lead.documents = documents;
  }
  if (tasks !== undefined) {
    lead.tasks = tasks;
  }
  if (followUps !== undefined) {
    lead.followUps = followUps;
  }
  if (meetings !== undefined) {
    lead.meetings = meetings;
  }
  if (aiCopilotAnalysis !== undefined) {
    lead.aiCopilotAnalysis = aiCopilotAnalysis;
  }

  if (changeNotes.length > 0) {
    lead.journey.push({
      status: lead.status,
      notes: `Profile updated: ${changeNotes.join(", ")}`,
      updatedBy,
      timestamp: new Date().toISOString()
    });
  }

  await writeDB(db);
  res.json({ success: true, lead });
});

export default router;
