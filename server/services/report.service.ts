import { getHRMLists } from "./payroll.service";

export interface ReportData {
  type?: string;
  senderId: string;
  senderName: string;
  senderRole?: string;
  department?: string;
  reportText: string;
  date: string;
  tenantId?: string;
  companyId?: string;
}

export function submitReport(db: any, data: ReportData) {
  getHRMLists(db);

  const newReport = {
    id: "rep-" + Date.now(),
    type: data.type || "department", // department or consolidated
    senderId: data.senderId,
    senderName: data.senderName,
    senderRole: data.senderRole || "head",
    department: data.department || "Sales",
    reportText: data.reportText,
    date: data.date,
    status: "Pending",
    reviewedBy: null,
    reviewedByName: null,
    feedback: null,
    reviewedAt: null,
    tenantId: data.tenantId || "t-default",
    companyId: data.companyId || "c-default"
  };

  db.reports.push(newReport);
  return newReport;
}

export function reviewReport(db: any, reportId: string, reviewerId: string, reviewerName: string, feedback: string, tenantId?: string) {
  getHRMLists(db);

  const report = db.reports.find((r: any) => r.id === reportId && (!tenantId || r.tenantId === tenantId));
  if (!report) {
    throw new Error("Report not found");
  }

  report.status = "Reviewed";
  report.reviewedBy = reviewerId;
  report.reviewedByName = reviewerName;
  report.feedback = feedback;
  report.reviewedAt = new Date().toISOString();

  return report;
}
