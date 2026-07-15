import { Request, Response } from "express";
import { 
  validateRegistrationInput, 
  validateDuplicates 
} from "../validations/registration.validation";
import { registerCompanyService } from "../services/registration.service";
import { readDB, writeDB } from "../utils/fileLock";

export async function registerCompanyController(req: Request, res: Response) {
  try {
    // 1. Validate Input Data Shape & Values
    const validation = validateRegistrationInput(req.body);
    if (validation.error || !validation.data) {
      return res.status(400).json({ error: validation.error || "Invalid input data." });
    }

    const { data } = validation;

    // 2. Validate for Duplicates (Name & Emails)
    const duplicateCheck = validateDuplicates(data);
    if (duplicateCheck.error) {
      return res.status(400).json({ error: duplicateCheck.error });
    }

    // 3. Invoke Registration Service
    const registrationResult = await registerCompanyService(data);

    // 4. Return Success Response
    return res.status(201).json({
      success: true,
      message: "Enterprise company and main administrator registered successfully!",
      data: registrationResult,
    });
  } catch (error: any) {
    console.error("Error registering company:", error);
    return res.status(500).json({
      error: "An unexpected error occurred during company registration."
    });
  }
}

export async function completeSetupController(req: Request, res: Response) {
  try {
    const { tenantId, companyId, wizardData } = req.body;

    if (!tenantId || !companyId) {
      return res.status(400).json({ error: "Tenant ID and Company ID are required." });
    }

    const db = readDB();
    db.tenants = db.tenants || [];
    db.companies = db.companies || [];

    const tenant = db.tenants.find((t: any) => t.tenantId === tenantId);
    const company = db.companies.find((c: any) => c.companyId === companyId);

    if (!tenant && !company) {
      return res.status(404).json({ error: "Company or Tenant registration not found." });
    }

    // Update setupCompleted status
    if (tenant) {
      tenant.setupCompleted = true;
      tenant.setupData = wizardData || {};
      tenant.updatedAt = new Date().toISOString();
    }

    if (company) {
      company.setupCompleted = true;
      company.setupData = wizardData || {};
      company.updatedAt = new Date().toISOString();
    }

    // Also populate default workspace parameters if they were customized in organization steps
    if (wizardData) {
      // Create departments if defined
      if (wizardData.orgSetup?.departments && Array.isArray(wizardData.orgSetup.departments)) {
        db.departments = db.departments || [];
        wizardData.orgSetup.departments.forEach((dept: string) => {
          const deptLower = dept.trim().toLowerCase();
          const exists = db.departments.some((d: any) => d.tenantId === tenantId && d.name.toLowerCase() === deptLower);
          if (!exists) {
            db.departments.push({
              id: `dept-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: dept.trim(),
              tenantId,
              companyId,
              createdAt: new Date().toISOString()
            });
          }
        });
      }
    }

    await writeDB(db);

    return res.status(200).json({
      success: true,
      message: "Setup Wizard completed successfully. Workspace activated!",
    });
  } catch (error: any) {
    console.error("Error completing setup:", error);
    return res.status(500).json({
      error: "An unexpected error occurred while completing setup."
    });
  }
}
