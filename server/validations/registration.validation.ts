import { readDB } from "../utils/fileLock";

export interface RegistrationInput {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  adminName: string;
  adminEmail: string;
  password?: string;
  companySize: string;
  industry: string;
  country: string;
  timeZone: string;
  currency: string;
}

export function validateRegistrationInput(input: any): { error?: string; data?: RegistrationInput } {
  const {
    companyName,
    companyEmail,
    companyPhone,
    adminName,
    adminEmail,
    password,
    companySize,
    industry,
    country,
    timeZone,
    currency,
  } = input;

  if (!companyName || typeof companyName !== "string" || !companyName.trim()) {
    return { error: "Company name is required and must be a valid string." };
  }

  if (!companyEmail || typeof companyEmail !== "string" || !companyEmail.trim()) {
    return { error: "Company email is required and must be a valid string." };
  }

  if (!companyPhone || typeof companyPhone !== "string" || !companyPhone.trim()) {
    return { error: "Company phone number is required." };
  }

  if (!adminName || typeof adminName !== "string" || !adminName.trim()) {
    return { error: "Admin name is required and must be a valid string." };
  }

  if (!adminEmail || typeof adminEmail !== "string" || !adminEmail.trim()) {
    return { error: "Admin email is required and must be a valid string." };
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return { error: "Password is required and must be at least 6 characters long." };
  }

  if (!companySize || typeof companySize !== "string" || !companySize.trim()) {
    return { error: "Company size is required." };
  }

  if (!industry || typeof industry !== "string" || !industry.trim()) {
    return { error: "Industry is required." };
  }

  if (!country || typeof country !== "string" || !country.trim()) {
    return { error: "Country is required." };
  }

  if (!timeZone || typeof timeZone !== "string" || !timeZone.trim()) {
    return { error: "Time zone is required." };
  }

  if (!currency || typeof currency !== "string" || !currency.trim()) {
    return { error: "Currency is required." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(companyEmail.trim())) {
    return { error: "Invalid company email format." };
  }
  if (!emailRegex.test(adminEmail.trim())) {
    return { error: "Invalid admin email format." };
  }

  return {
    data: {
      companyName: companyName.trim(),
      companyEmail: companyEmail.trim().toLowerCase(),
      companyPhone: companyPhone.trim(),
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim().toLowerCase(),
      password,
      companySize: companySize.trim(),
      industry: industry.trim(),
      country: country.trim(),
      timeZone: timeZone.trim(),
      currency: currency.trim(),
    }
  };
}

export function validateDuplicates(input: RegistrationInput): { error?: string } {
  const db = readDB();

  // 1. Prevent duplicate company name (case insensitive)
  const normalizedCompanyName = input.companyName.toLowerCase();
  const duplicateCompanyName = (db.tenants || []).some(
    (t: any) => t.companyName && t.companyName.toLowerCase() === normalizedCompanyName
  );
  if (duplicateCompanyName) {
    return { error: "A company with this name is already registered." };
  }

  // 2. Prevent duplicate company email (case insensitive)
  const normalizedCompanyEmail = input.companyEmail.toLowerCase();
  const duplicateCompanyEmail = (db.companies || []).some(
    (c: any) => c.companyEmail && c.companyEmail.toLowerCase() === normalizedCompanyEmail
  ) || (db.tenants || []).some(
    (t: any) => t.companyEmail && t.companyEmail.toLowerCase() === normalizedCompanyEmail
  );
  if (duplicateCompanyEmail) {
    return { error: "A company with this email is already registered." };
  }

  // 3. Prevent duplicate admin email (case insensitive)
  const normalizedAdminEmail = input.adminEmail.toLowerCase();
  const duplicateAdminEmail = (db.users || []).some(
    (u: any) => u.email && u.email.toLowerCase() === normalizedAdminEmail
  );
  if (duplicateAdminEmail) {
    return { error: "An administrator with this email is already registered." };
  }

  return {};
}
