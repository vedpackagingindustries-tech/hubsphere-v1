export function assignLead(db: any, leadId: string, userId: string | null, adminId: string, adminName: string) {
  const lead = db.leads.find((l: any) => l.id === leadId);
  if (!lead) {
    throw new Error("Lead not found");
  }

  const isUnassigned = !userId || userId === "unassign";

  if (!isUnassigned) {
    const user = db.users.find((u: any) => u.id === userId);
    if (!user) {
      throw new Error("User not found");
    }
    lead.assignedTo = user.id;
    lead.assignedName = user.name;
    lead.assignedByAdminId = adminId;
    lead.assignedByAdminName = adminName;
    lead.assignedAt = new Date().toISOString();
  } else {
    lead.assignedTo = null;
    lead.assignedName = null;
    lead.assignedByAdminId = null;
    lead.assignedByAdminName = null;
    lead.assignedAt = null;
  }

  if (!lead.journey) lead.journey = [];
  lead.journey.push({
    status: lead.status,
    notes: !isUnassigned ? `Assigned to telecaller: ${lead.assignedName}` : "Unassigned from telecaller",
    updatedBy: adminName,
    timestamp: new Date().toISOString()
  });

  return lead;
}

export function bulkAssignLeads(db: any, leadIds: string[], userId: string | null, adminId: string, adminName: string) {
  const isUnassigned = !userId || userId === "unassign";
  let assignedName: string | null = null;
  
  if (!isUnassigned) {
    const user = db.users.find((u: any) => u.id === userId);
    if (user) assignedName = user.name;
  }

  db.leads.forEach((l: any) => {
    if (leadIds.includes(l.id)) {
      if (!isUnassigned) {
        l.assignedTo = userId;
        l.assignedName = assignedName;
        l.assignedByAdminId = adminId;
        l.assignedByAdminName = adminName;
        l.assignedAt = new Date().toISOString();
      } else {
        l.assignedTo = null;
        l.assignedName = null;
        l.assignedByAdminId = null;
        l.assignedByAdminName = null;
        l.assignedAt = null;
      }

      if (!l.journey) l.journey = [];
      l.journey.push({
        status: l.status,
        notes: !isUnassigned ? `Bulk assigned to telecaller: ${assignedName}` : "Bulk unassigned",
        updatedBy: adminName,
        timestamp: new Date().toISOString()
      });
    }
  });
}

export function updateLeadStatus(
  db: any,
  leadId: string,
  status: string,
  notes: string | undefined,
  dealValue: number | undefined,
  updatedBy: string | undefined,
  userRole: string,
  userId: string
) {
  const lead = db.leads.find((l: any) => l.id === leadId);
  if (!lead) {
    throw new Error("Lead not found");
  }

  const prevStatus = lead.status;
  lead.status = status;
  if (notes !== undefined) {
    lead.notes = notes;
  }
  if (dealValue !== undefined) {
    lead.dealValue = Number(dealValue) || 0;
  }
  lead.lastCalled = new Date().toISOString();

  if (!lead.journey) lead.journey = [];

  let updater = updatedBy;
  if (!updater) {
    const userObj = db.users.find((u: any) => u.id === userId);
    updater = userObj ? userObj.name : (userRole === "admin" ? "Admin" : "User");
  }

  lead.journey.push({
    status,
    notes: notes || `Lead stage changed from '${prevStatus}' to '${status}'`,
    updatedBy: updater,
    timestamp: new Date().toISOString()
  });

  return lead;
}

export function importLeads(db: any, leads: any[], tenantId: string = "t-default", companyId: string = "c-default") {
  const importedLeads = leads.map((l: any, idx: number) => ({
    id: "lead-" + (Date.now() + idx),
    name: l.name || "Unknown client",
    phone: l.phone || "No phone",
    whatsapp: l.whatsapp || "",
    email: l.email || "",
    requirements: l.requirements || "Imported lead details.",
    status: "New",
    assignedTo: null,
    assignedName: null,
    assignedByAdminId: null,
    assignedByAdminName: null,
    assignedAt: null,
    notes: l.notes || "",
    createdAt: new Date().toISOString(),
    tenantId,
    companyId,
    journey: [
      {
        status: "New",
        notes: "Lead imported from CSV dataset",
        updatedBy: "Admin",
        timestamp: new Date().toISOString()
      }
    ]
  }));

  db.leads.push(...importedLeads);
  return importedLeads.length;
}
