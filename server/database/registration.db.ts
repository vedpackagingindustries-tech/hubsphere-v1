import { readDB, writeDB } from "../utils/fileLock";

export interface TenantRecord {
  tenantId: string;
  companyId: string;
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  companySize?: string;
  industry?: string;
  country?: string;
  timeZone?: string;
  currency?: string;
  setupCompleted?: boolean;
  status: string;
  trialDays: number;
  trialStart: string;
  trialEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyRecord {
  companyId: string;
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  companySize?: string;
  industry?: string;
  country?: string;
  timeZone?: string;
  currency?: string;
  setupCompleted?: boolean;
  tenantId: string;
  status: string;
  trialDays: number;
  trialStart: string;
  trialEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: string;
  status: string;
  tenantId: string;
  companyId: string;
  createdAt: string;
  phone: string;
  department: string;
  position: string;
  salaryBase: number;
  commissionRate: number;
  monthlyTarget: number;
}

export interface AuditLogRecord {
  id: string;
  action: string;
  tenantId: string;
  companyId: string;
  details: string;
  timestamp: string;
}

export async function persistRegistration(
  tenant: TenantRecord,
  company: CompanyRecord,
  adminUser: UserRecord,
  auditLogs: AuditLogRecord[]
): Promise<void> {
  const db = readDB();

  // Initialize arrays if they don't exist
  db.tenants = db.tenants || [];
  db.companies = db.companies || [];
  db.users = db.users || [];
  db.auditLogs = db.auditLogs || [];

  // Append new records
  db.tenants.push(tenant);
  db.companies.push(company);
  db.users.push(adminUser);
  db.auditLogs.push(...auditLogs);

  // Perform atomic write
  await writeDB(db);
}
