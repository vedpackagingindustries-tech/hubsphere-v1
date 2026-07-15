import bcrypt from "bcryptjs";
import { 
  persistRegistration, 
  TenantRecord, 
  CompanyRecord, 
  UserRecord, 
  AuditLogRecord 
} from "../database/registration.db";
import { RegistrationInput } from "../validations/registration.validation";

export async function registerCompanyService(input: RegistrationInput) {
  const timestamp = new Date().toISOString();

  // 1. Generate unique identifiers
  const suffix = Math.random().toString(36).substring(2, 6);
  const tenantId = `t-${Date.now()}-${suffix}`;
  const companyId = `c-${Date.now()}-${suffix}`;
  const adminUserId = `u-${Date.now()}-${suffix}`;

  // 2. Hash password using bcrypt
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(input.password || "", salt);

  // 3. Define trial variables (7 days trial)
  const trialDays = 7;
  const trialStart = timestamp;
  const trialEnd = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();

  // 4. Create Tenant Record
  const tenant: TenantRecord = {
    tenantId,
    companyId,
    companyName: input.companyName,
    companyEmail: input.companyEmail,
    companyPhone: input.companyPhone,
    companySize: input.companySize,
    industry: input.industry,
    country: input.country,
    timeZone: input.timeZone,
    currency: input.currency,
    setupCompleted: false,
    status: "trial",
    trialDays,
    trialStart,
    trialEnd,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // 5. Create Company Record
  const company: CompanyRecord = {
    companyId,
    companyName: input.companyName,
    companyEmail: input.companyEmail,
    companyPhone: input.companyPhone,
    companySize: input.companySize,
    industry: input.industry,
    country: input.country,
    timeZone: input.timeZone,
    currency: input.currency,
    setupCompleted: false,
    tenantId,
    status: "trial",
    trialDays,
    trialStart,
    trialEnd,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // 6. Create Main Admin User
  const adminUser: UserRecord = {
    id: adminUserId,
    name: input.adminName,
    email: input.adminEmail,
    password: hashedPassword,
    role: "MAIN_ADMIN",
    status: "active",
    tenantId,
    companyId,
    createdAt: timestamp,
    phone: "",
    department: "All",
    position: "Main Admin",
    salaryBase: 25000,
    commissionRate: 200,
    monthlyTarget: 10,
  };

  // 7. Generate Audit Logs
  const auditLogs: AuditLogRecord[] = [
    {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-1`,
      action: "COMPANY_CREATED",
      tenantId,
      companyId,
      details: `Company '${input.companyName}' registered successfully with Tenant ID ${tenantId}.`,
      timestamp,
    },
    {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-2`,
      action: "MAIN_ADMIN_CREATED",
      tenantId,
      companyId,
      details: `Main Admin User '${input.adminName}' (ID: ${adminUserId}) created for Company '${input.companyName}'.`,
      timestamp,
    }
  ];

  // 8. Persist all records atomically
  await persistRegistration(tenant, company, adminUser, auditLogs);

  return {
    tenantId,
    companyId,
    adminUserId,
    companyName: tenant.companyName,
    companyEmail: tenant.companyEmail,
    adminName: adminUser.name,
    adminEmail: adminUser.email,
    trialStart,
    trialEnd,
    status: tenant.status,
  };
}
