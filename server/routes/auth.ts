import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { readDB, writeDB } from "../utils/fileLock";
import { generateEmploymentCode } from "../services/payroll.service";
import { authenticateUser, AuthenticatedRequest, requireSubAdminOrAdmin } from "../middleware/auth";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();

// Auth Routes

// POST /api/auth/register
router.post("/register", async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, role, phone, department, position } = req.body;
  if (!name || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.companyId || "c-default";
  
  // Check if name is already registered in the current tenant
  const existingName = db.users.find((u: any) => u.name.trim().toLowerCase() === name.trim().toLowerCase() && u.tenantId === currentTenantId);
  if (existingName) {
    // If the role is main_admin and we are replacing the existing u-admin, we can proceed
    if (!(role === "main_admin" && existingName.id === "u-admin")) {
      return res.status(400).json({ error: "Username already registered" });
    }
  }

  if (email) {
    const existingEmail = db.users.find((u: any) => u.email && u.email.toLowerCase() === email.toLowerCase() && u.tenantId === currentTenantId);
    if (existingEmail) {
      if (!(role === "main_admin" && existingEmail.id === "u-admin")) {
        return res.status(400).json({ error: "Email already registered" });
      }
    }
  }

  let userId = "u-" + Date.now();
  let assignedRole = role;

  if (role === "main_admin") {
    userId = "u-admin";
    assignedRole = "admin";
    // Overwrite the existing u-admin within the current tenant
    db.users = db.users.filter((u: any) => !(u.id === "u-admin" && u.tenantId === currentTenantId));
  }

  // Enforce single Sub-Admin limit per tenant
  if (assignedRole === "sub-admin") {
    const existingSubAdmin = db.users.find((u: any) => u.role === "sub-admin" && u.tenantId === currentTenantId);
    if (existingSubAdmin) {
      return res.status(400).json({ error: "Only ONE Sub-Admin can be appointed in the company. A Sub-Admin is already registered." });
    }
  }

  // Enforce single Department Head per segment limit on registration per tenant
  if (assignedRole === "head") {
    const finalDept = department || "Sales";
    const existingHead = db.users.find((u: any) => u.role === "head" && u.department === finalDept && u.status !== "inactive" && u.tenantId === currentTenantId);
    if (existingHead) {
      return res.status(400).json({ error: `Only ONE Department Head can be appointed for the ${finalDept} segment. A Head already exists.` });
    }
  }

  // Define salary base and commission rate based on role
  let salaryBase = 12000;
  let commissionRate = 100;
  if (assignedRole === "admin") {
    salaryBase = 25000;
    commissionRate = 200;
  } else if (assignedRole === "sub-admin") {
    salaryBase = 20000;
    commissionRate = 150;
  } else if (assignedRole === "head") {
    salaryBase = 15000;
    commissionRate = 120;
  }

  const newUser = {
    id: userId,
    name,
    email: email || "",
    password, // Storing simply for demonstration/testing CRM
    phone: phone || "",
    role: assignedRole,
    department: department || "Sales",
    position: position || "",
    salaryBase,
    commissionRate,
    monthlyTarget: 5,
    status: "active",
    tenantId: currentTenantId,
    companyId: currentCompanyId
  };

  db.users.push(newUser);
  await writeDB(db);

  res.json({ 
    success: true, 
    user: { 
      id: newUser.id, 
      name: newUser.name, 
      email: newUser.email, 
      phone: newUser.phone, 
      role: newUser.role, 
      department: newUser.department,
      position: newUser.position || ""
    } 
  });
});

// POST /api/auth/login
router.post("/login", (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password } = req.body;
  if ((!name && !email) || !password) {
    return res.status(400).json({ error: "Name and password are required" });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";

  let user = db.users.find((u: any) => {
  const input = (name || email || "").trim().toLowerCase();

  return (
    u.name?.trim().toLowerCase() === input ||
    u.email?.trim().toLowerCase() === input
  );
});

  if (user) {
    let passwordMatch = false;

    if (
        user.password &&
        (
            user.password.startsWith("$2a$") ||
            user.password.startsWith("$2b$") ||
            user.password.startsWith("$2y$")
        )
    ) {
        passwordMatch = bcrypt.compareSync(password, user.password);
    } else {
        // Legacy plaintext passwords are no longer allowed
        passwordMatch = false;
    }

    if (!passwordMatch) {
        user = undefined;
    }
}

  // Bulletproof fallback for Main Admin u-admin only if they do not exist in the database yet
  const hasAdminInDB = db.users.some((u: any) => u.id === "u-admin" && !u.deleted && u.tenantId === currentTenantId);
  if (!user && !hasAdminInDB && name.trim().toLowerCase() === "admin" && password === "admin" && currentTenantId === "t-default") {
    user = {
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
    };
  }

  if (!user) {
    return res.status(400).json({ error: "Invalid name or password" });
  }

  if (user.status === "suspended") {
    return res.status(403).json({ error: "Account suspended by admin" });
  }

  const resolvedRole = user.role.toUpperCase() === "MAIN_ADMIN" ? "admin" : user.role;

  // Check testing period expiry (except for Main Admin who can log in to extend)
  const testingConfig = db.testingConfig || {
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true
  };
  const today = new Date().toISOString().split('T')[0];
  if (testingConfig.isActive && testingConfig.expiryDate < today) {
    if (resolvedRole !== "admin") {
      return res.status(403).json({ 
        error: `Testing period has expired (टेस्टिंग अवधि समाप्त हो गई है)! Only the Main Admin can log in to extend the testing date. Expiry date: ${testingConfig.expiryDate}` 
      });
    }
  }

  res.json({ 
    success: true, 
    user: { 
      id: user.id, 
      name: user.name, 
      email: user.email || "", 
      phone: user.phone || "",
      role: resolvedRole,
      department: user.department || "Sales",
      position: user.position || ""
    } 
  });
});

// GET /api/auth/session
router.get("/session", authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Session invalid or user not authenticated" });
  }

  const db = readDB();
  const currentTenantId = req.user.tenantId || "t-default";
  const currentCompanyId = req.user.companyId || "c-default";

  // 1. Fetch Tenant
  let tenant = db.tenants?.find((t: any) => t.tenantId === currentTenantId);
  if (!tenant && currentTenantId === "t-default") {
    tenant = {
      tenantId: "t-default",
      companyName: "HubSphere Default",
      companyId: "c-default",
      status: "active",
      package: "Enterprise"
    };
  }

  // 2. Fetch Company
  let company = db.companies?.find((c: any) => c.companyId === currentCompanyId);
  if (!company && currentCompanyId === "c-default") {
    company = {
      companyId: "c-default",
      companyName: "HubSphere Default",
      tenantId: "t-default",
      status: "active"
    };
  }

  // 3. Determine Package
  let currentPackage = "Enterprise"; // Default tenant has everything
  if (tenant) {
    if (tenant.package) {
      currentPackage = tenant.package;
    } else if (tenant.status === "trial") {
      currentPackage = "Free Trial";
    } else if (tenant.status === "active") {
      currentPackage = "Enterprise";
    }
  }

  // 4. Feature Flags Engine based on Package
  const featureFlags = {
    crm: true, // Core module
    telecalling: true, // Core module
    settings: true, // Core module
    reports: currentPackage === "Growth" || currentPackage === "Enterprise",
    documentVault: currentPackage === "Growth" || currentPackage === "Enterprise",
    billing: currentPackage === "Growth" || currentPackage === "Enterprise",
    hrms: currentPackage === "Enterprise",
    payroll: currentPackage === "Enterprise",
    fieldSales: currentPackage === "Enterprise",
    analytics: currentPackage === "Enterprise",
  };

  // 5. Generate Role Permissions List
  const userRole = req.user.role.toLowerCase();
  const permissions = {
    canManageTenants: userRole === "super_admin",
    canViewSystemAnalytics: ["super_admin", "admin"].includes(userRole),
    canManageCompany: ["super_admin", "admin"].includes(userRole),
    canViewAllLeads: ["super_admin", "admin", "sub-admin"].includes(userRole) || (userRole === "head" && req.user.department === "Sales"),
    canAssignLeads: ["admin", "sub-admin"].includes(userRole),
    canManageStaff: ["admin", "sub-admin"].includes(userRole),
    canViewReports: ["admin", "sub-admin", "head"].includes(userRole),
    canManageBackups: userRole === "admin",
    canManagePayroll: ["admin", "sub-admin"].includes(userRole) || (userRole === "head" && req.user.department === "HR"),
    canSubmitSupportTicket: true,
    canCheckInOut: true,
  };

  res.json({
    success: true,
    user: req.user,
    tenant: {
      tenantId: currentTenantId,
      companyName: tenant?.companyName || "HubSphere Company",
      status: tenant?.status || "active",
      package: currentPackage,
    },
    company: {
      companyId: currentCompanyId,
      companyName: company?.companyName || "HubSphere Company",
      setupCompleted: company?.setupCompleted || false,
    },
    package: {
      name: currentPackage,
      features: featureFlags,
    },
    permissions,
    featureFlags,
  });
});

// GET /api/auth/all-tenants (Super Admin Only helper)
router.get("/all-tenants", authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role.toLowerCase() !== "super_admin") {
    return res.status(403).json({ error: "Access denied. Requires SUPER_ADMIN role." });
  }
  const db = readDB();
  res.json({ success: true, tenants: db.tenants || [] });
});

// POST /api/auth/update-package (Main Admin or Super Admin option to upgrade plan)
router.post("/update-package", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const userRole = req.user?.role.toLowerCase();
  if (!["super_admin", "admin"].includes(userRole)) {
    return res.status(403).json({ error: "Access denied. Only Admins can upgrade packages." });
  }

  const { tenantId, newPackage } = req.body;
  if (!tenantId || !["Free Trial", "Growth", "Enterprise"].includes(newPackage)) {
    return res.status(400).json({ error: "Invalid parameters." });
  }

  const db = readDB();
  db.tenants = db.tenants || [];
  const tenant = db.tenants.find((t: any) => t.tenantId === tenantId);
  if (!tenant) {
    return res.status(404).json({ error: "Tenant not found." });
  }

  tenant.package = newPackage;
  tenant.status = newPackage === "Free Trial" ? "trial" : "active";
  tenant.updatedAt = new Date().toISOString();

  // Keep companies in sync
  db.companies = db.companies || [];
  const company = db.companies.find((c: any) => c.tenantId === tenantId);
  if (company) {
    company.status = tenant.status;
    company.updatedAt = tenant.updatedAt;
  }

  await writeDB(db);
  res.json({ success: true, message: `Successfully upgraded plan to ${newPackage}!` });
});

// POST /api/auth/request-login-authority
router.post("/request-login-authority", async (req: AuthenticatedRequest, res: Response) => {
  const { name, deviceType, distance, reason } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.companyId || "c-default";
  db.loginAuthorityRequests = db.loginAuthorityRequests || [];
  
  // Remove any previous requests for this name under the current tenant to avoid clutter
  db.loginAuthorityRequests = db.loginAuthorityRequests.filter((r: any) => !(r.name.toLowerCase() === name.toLowerCase() && r.tenantId === currentTenantId));
  
  db.loginAuthorityRequests.push({
    id: "lar-" + Date.now(),
    name: name,
    deviceType: deviceType || "mobile",
    distance: distance || 0,
    reason: reason || "Location mismatch on phone login",
    status: "pending",
    requestedAt: new Date().toISOString(),
    tenantId: currentTenantId,
    companyId: currentCompanyId
  });
  
  await writeDB(db);
  res.json({ success: true, message: "लॉगिन अनुमति अनुरोध एडमिन को भेज दिया गया है! कृपया एडमिन द्वारा स्वीकृत होने की प्रतीक्षा करें। (Login authority request sent to Main Admin! Please wait for approval.)" });
});

// GET /api/auth/check-login-authority
router.get("/check-login-authority", (req: AuthenticatedRequest, res: Response) => {
  const name = req.query.name as string;
  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }
  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  db.loginAuthorityRequests = db.loginAuthorityRequests || [];
  const request = db.loginAuthorityRequests.find(
    (r: any) => r.name.toLowerCase() === name.toLowerCase() && r.tenantId === currentTenantId
  );
  if (request && request.status === "approved") {
    return res.json({ success: true, approved: true });
  }
  return res.json({ success: true, approved: false, status: request ? request.status : "not_found" });
});

// POST /api/auth/send-recovery-email
router.post("/send-recovery-email", (req: AuthenticatedRequest, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.tenantId === currentTenantId);

  if (!user) {
    return res.status(404).json({ error: "इस ईमेल पते के साथ कोई यूजर नहीं मिला।" });
  }

  // RESTRICTION: Only Admin can use this feature
  if (user.role !== "admin") {
    return res.status(403).json({ error: "यह पासवर्ड रिकवरी विकल्प केवल एडमिन (Admin) के लिए ही आरक्षित है।" });
  }

  const masterKey = process.env.ADMIN_RECOVERY_CODE || "0000";

  console.log(`==========================================`);
  console.log(`[SIMULATED EMAIL DISPATCH TO ADMIN]`);
  console.log(`To: ${email}`);
  console.log(`Subject: Secure Master Recovery Code`);
  console.log(`Message: Dear Admin, your secure Master Recovery Key is: "${masterKey}".`);
  console.log(`==========================================`);

  res.json({
    success: true,
    message: `रिकवरी की आपके पंजीकृत एडमिन ईमेल (${email}) पर सुरक्षित भेज दी गई है! (Simulated recovery key has been dispatched to: ${email})`
  });
});

// POST /api/auth/reset-by-key
router.post("/reset-by-key", async (req: AuthenticatedRequest, res: Response) => {
  const { email, masterKey, newPassword } = req.body;
  
  if (!email || !masterKey || !newPassword) {
    return res.status(400).json({ error: "सभी फ़ील्ड्स (Email, Master Key, New Password) अनिवार्य हैं।" });
  }

  // Set default master key as "0000" or from environment variable
  const expectedKey = process.env.ADMIN_RECOVERY_CODE || "0000";

  if (masterKey !== expectedKey) {
    return res.status(400).json({ error: "गलत मास्टर की (Invalid Recovery Code)!" });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const user = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.tenantId === currentTenantId);

  if (!user) {
    return res.status(404).json({ error: "इस ईमेल पते के साथ कोई यूजर नहीं मिला।" });
  }

  // Double-protecting so telecallers cannot reset passwords this way
  if (user.role !== "admin") {
    return res.status(403).json({ error: "यह पासवर्ड रिकवरी विकल्प केवल एडमिन (Admin) के लिए ही आरक्षित है।" });
  }

  user.password = newPassword;
  await writeDB(db);

  res.json({ success: true, message: "पासवर्ड सफलतापूर्वक बदल गया है! अब नए पासवर्ड से लॉग इन करें।" });
});

// POST /api/auth/request-recovery
router.post("/request-recovery", async (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Username/Name is required" });
  }
  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.companyId || "c-default";
  const user = db.users.find((u: any) => u.name.trim().toLowerCase() === name.trim().toLowerCase() && u.tenantId === currentTenantId);
  if (!user) {
    return res.status(404).json({ error: "यह यूजरनेम पंजीकृत नहीं है (This username is not registered)." });
  }
  if (user.id === "u-admin" || user.role === "admin") {
    return res.status(400).json({ error: "कृपया मुख्य एडमिन रिकवरी विकल्प का उपयोग करें (Please use Main Admin recovery option)." });
  }

  db.recoveryRequests = db.recoveryRequests || [];
  // Prevent duplicate pending requests for the same user under the current tenant
  const existing = db.recoveryRequests.find((r: any) => r.userId === user.id && r.status === "pending" && r.tenantId === currentTenantId);
  if (existing) {
    return res.json({ success: true, message: "अनुरोध पहले से ही मुख्य एडमिन के पास लंबित है! (Your request is already pending with the Main Admin!)" });
  }

  const newRequest = {
    id: "rec-" + Date.now(),
    name: user.name,
    userId: user.id,
    phone: user.phone || "",
    email: user.email || "",
    role: user.role,
    department: user.department || "Sales",
    timestamp: new Date().toISOString(),
    status: "pending",
    tenantId: currentTenantId,
    companyId: currentCompanyId
  };

  db.recoveryRequests.push(newRequest);
  await writeDB(db);

  res.json({ success: true, message: "पासवर्ड रिकवरी का अनुरोध मुख्य एडमिन को भेज दिया गया है! कृपया रीसेट के लिए एडमिन से संपर्क करें।" });
});

// POST /api/auth/main-admin-recover
router.post("/main-admin-recover", (req: AuthenticatedRequest, res: Response) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: "Name and registered email are required" });
  }
  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const user = db.users.find((u: any) => u.id === "u-admin" && u.tenantId === currentTenantId);
  if (!user) {
    return res.status(404).json({ error: "मुख्य एडमिन अकाउंट नहीं मिला।" });
  }

  // Check if name and email match the main admin's credentials
  const nameMatch = user.name.trim().toLowerCase() === name.trim().toLowerCase();
  const emailMatch = user.email && user.email.trim().toLowerCase() === email.trim().toLowerCase();

  if (!nameMatch || !emailMatch) {
    return res.status(400).json({ error: "दर्ज किया गया नाम या ईमेल मुख्य एडमिन के रिकॉर्ड से मेल नहीं खाता है।" });
  }

  const adminPassword = user.password;
  const adminPhone = user.phone || "No phone registered";

  // Simulate sending real SMS/WhatsApp/Email to the registered credentials
  console.log(`==========================================`);
  console.log(`[REAL-TIME DISPATCH - HUBSPHERE BRANDING]`);
  console.log(`[WhatsApp Delivery] Sent to ${adminPhone}: "Your HubSphere Main Admin password is: ${adminPassword}"`);
  console.log(`[Email Delivery] Dispatched to ${user.email}: "Your HubSphere Main Admin password is: ${adminPassword}"`);
  console.log(`==========================================`);

  res.json({
    success: true,
    password: adminPassword,
    phone: adminPhone,
    email: user.email,
    message: `पासवर्ड आपके पंजीकृत व्हाट्सएप (${adminPhone}) और ईमेल (${user.email}) पर भेज दिया गया है! \n\n🔑 आपका पासवर्ड है: "${adminPassword}"`
  });
});

// POST /api/auth/main-admin-reset-defaults
router.post("/main-admin-reset-defaults", async (req: AuthenticatedRequest, res: Response) => {
  const { operatorName, securityAnswer } = req.body;
  if (!operatorName || !securityAnswer) {
    return res.status(400).json({ error: "Operator name and Security Answer are strictly required to perform emergency reset." });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.companyId || "c-default";
  const isSecMatch = (securityAnswer.trim() === db.recoveryConfig.securityAnswer.trim());

  if (!isSecMatch) {
    const timestamp = new Date().toISOString();
    console.warn(`\n======================================================================`);
    console.warn(`🚨🚨🚨 [CRITICAL MAIN ADMIN DEFAULT RESET INTRUSION DETECTED] 🚨🚨🚨`);
    console.warn(`Timestamp: ${timestamp}`);
    console.warn(`Attempted By (नाम): ${operatorName}`);
    console.warn(`Provided Security Answer: ${securityAnswer}`);
    console.warn(`Correct Security Answer: ${db.recoveryConfig.securityAnswer}`);
    console.warn(`Status: BLOCKED & REJECTED (Unauthorized Default Reset Attempt!)`);
    console.warn(`----------------------------------------------------------------------`);
    console.warn(`[SMS/WHATSAPP ALERT] Sent to Main Admin Whatsapp: ${db.recoveryConfig.alertWhatsapp}`);
    console.warn(`Message: "ALERT: Unauthorized attempt to RESET Main Admin credentials to default by [${operatorName}] was BLOCKED on HubSphere at ${timestamp}. Check recovery parameters."`);
    console.warn(`----------------------------------------------------------------------`);
    console.warn(`[EMAIL ALERT] Sent to Main Admin Email: ${db.recoveryConfig.alertEmail}`);
    console.warn(`Subject: ⚠️ SECURITY ALERT: Unauthorized Main Admin Reset Attempt`);
    console.warn(`Body: Dear Main Admin,\n\nWe detected an unauthorized attempt to reset the Main Admin login credentials back to defaults by ${operatorName}.\n\nDetails:\n- Security Answer matched: NO\n- Timestamp: ${timestamp}\n\nThis attempt has been successfully BLOCKED. Your custom credentials remain secure.\n\nBest Regards,\nHubSphere Security System`);
    console.warn(`======================================================================\n`);

    return res.status(401).json({ 
      error: `Incorrect security answer. A security alert has been dispatched to Main Admin's Whatsapp (${db.recoveryConfig.alertWhatsapp}) and Email (${db.recoveryConfig.alertEmail})!` 
    });
  }

  // Update Main Admin credentials in database within current tenant
  let user = db.users.find((u: any) => u.id === "u-admin" && u.tenantId === currentTenantId);
  if (!user) {
    // Recreate u-admin if missing
    user = {
      id: "u-admin",
      name: "Admin",
      role: "admin",
      password: "admin",
      email: db.recoveryConfig?.adminBackupEmail || "admin@company.com",
      phone: db.recoveryConfig?.alertWhatsapp || "9301056006",
      tenantId: currentTenantId,
      companyId: currentCompanyId
    };
    db.users.push(user);
  } else {
    user.name = "Admin";
    user.password = "admin";
  }

  await writeDB(db);

  const timestamp = new Date().toISOString();
  console.log(`\n======================================================================`);
  console.log(`🎉🎉🎉 [SUCCESSFUL MAIN ADMIN RESET TO DEFAULTS] 🎉🎉🎉`);
  console.log(`Timestamp: ${timestamp}`);
  console.log(`Authorized Operator: ${operatorName}`);
  console.log(`New Credentials: Username [Admin] | Password [admin]`);
  console.log(`Status: COMPLETED SUCCESSFULLY`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`[SMS/WHATSAPP DISPATCH] Send Notification to Main Admin Whatsapp: ${db.recoveryConfig.alertWhatsapp}`);
  console.log(`Message: "SUCCESS: Main Admin credentials have been reset back to default (Username: Admin, Password: admin) by [${operatorName}] at ${timestamp}."`);
  console.log(`----------------------------------------------------------------------`);
  console.log(`[EMAIL DISPATCH] Send Notification to Main Admin Email: ${db.recoveryConfig.alertEmail}`);
  console.log(`Subject: ✅ SYSTEM NOTIFICATION: Admin Credentials Reset to Defaults`);
  console.log(`Body: Dear Main Admin,\n\nThis is to notify you that your Main Admin credentials have been successfully reset back to default values:\n- Username: Admin\n- Password: admin\n\nDetails:\n- Authorized Operator: ${operatorName}\n- Timestamp: ${timestamp}\n\nPlease log in using default credentials and set a new secure password immediately in the Admin Panel.\n\nBest Regards,\nHubSphere CRM Core Engine`);
  console.log(`======================================================================\n`);

  res.json({ 
    success: true, 
    message: "Main Admin credentials have been successfully reset back to default: Username: 'Admin' and Password: 'admin'. Please log in and set a new secure password inside the Admin Panel immediately!" 
  });
});

// GET /api/auth/recovery-requests (Admin or Sub-Admin only)
router.get("/recovery-requests", authenticateUser, requireSubAdminOrAdmin, (req: AuthenticatedRequest, res: Response) => {
  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const requests = (db.recoveryRequests || []).filter((r: any) => r.tenantId === currentTenantId);
  res.json(requests);
});

// POST /api/auth/resolve-recovery (Admin or Sub-Admin only)
router.post("/resolve-recovery", authenticateUser, requireSubAdminOrAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { requestId, newPassword, action } = req.body; // action: 'approve' | 'reject'
  if (!requestId) {
    return res.status(400).json({ error: "Request ID is required" });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  db.recoveryRequests = db.recoveryRequests || [];
  const request = db.recoveryRequests.find((r: any) => r.id === requestId && r.tenantId === currentTenantId);
  if (!request) {
    return res.status(404).json({ error: "Request not found" });
  }

  if (action === "approve") {
    if (!newPassword) {
      return res.status(400).json({ error: "New password is required to approve" });
    }
    const user = db.users.find((u: any) => u.id === request.userId && u.tenantId === currentTenantId);
    if (user) {
      user.password = newPassword;
    }
    request.status = "approved";
    request.resolvedAt = new Date().toISOString();
    request.tempPassword = newPassword;
  } else {
    request.status = "rejected";
    request.resolvedAt = new Date().toISOString();
  }

  await writeDB(db);
  res.json({ success: true, message: action === "approve" ? "Request approved and password reset successfully!" : "Request rejected" });
});

export default router;
