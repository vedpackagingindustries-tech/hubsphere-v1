import { readDB } from "../utils/fileLock";

export function generateEmploymentCode(name: string, department: string, position: string, joiningDate: string): string {
  const firstWord = (name || "").trim().split(/\s+/)[0] || "Staff";
  const dept = department || "Sales";
  const post = position || "Employee";
  
  let dateFormatted = "07/07/2026";
  if (joiningDate) {
    const parts = joiningDate.split("-");
    if (parts.length === 3) {
      dateFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } else {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    dateFormatted = `${day}/${month}/${year}`;
  }
  
  const cleanWord = (w: string) => w.replace(/[\/\s]/g, "");
  
  return `${cleanWord(firstWord)}/${cleanWord(dept)}/${cleanWord(post)}/${dateFormatted}`;
}

export const getHRMLists = (db: any) => {
  if (!db.attendance) db.attendance = [];
  if (!db.leaves) db.leaves = [];
  if (!db.tasks) db.tasks = [];
  if (!db.companyHolidays) db.companyHolidays = [];
  if (!db.reports) db.reports = [];
  if (!db.improvementInstructions) db.improvementInstructions = [];
  if (!db.subAdminComms) db.subAdminComms = [];
  if (!db.salaryRules || db.salaryRules.length === 0) {
    db.salaryRules = [
      {
        id: "rule_late_arrival",
        name: "Late Arrival Pay Cut (विलंब आगमन कटौती)",
        description: "After 10:18 AM, deducts 1 hour of pay per 10 minutes late (max 9 hours) / सुबह 10:18 बजे के बाद, प्रत्येक 10 मिनट की देरी पर 1 घंटे की सैलरी की कटौती (अधिकतम 9 घंटे की कटौती)",
        type: "LateDeduction",
        value: 10,
        segment: "All",
        staffId: "All",
        enabled: true,
        systemRule: true
      },
      {
        id: "rule_sunday_sandwich",
        name: "Sunday Sandwich Rule (सैंडविच नियम)",
        description: "If Saturday or Monday is leave/absent, Sunday is deducted (unpaid) / यदि शनिवार या सोमवार को छुट्टी/अनुपस्थिति है, तो रविवार की कटौती होगी (बिना वेतन)",
        type: "SandwichDeduction",
        value: 1,
        segment: "All",
        staffId: "All",
        enabled: true,
        systemRule: true
      },
      {
        id: "rule_half_day",
        name: "Half Day Leave Deduction (हाफ डे कटौती)",
        description: "Work between 4.0 and 9.0 hours counts as half day, deducting 0.5 day salary / 4.0 से 9.0 घंटे काम करने पर हाफ डे माना जाएगा, जिससे 0.5 दिन की कटौती होगी",
        type: "HalfDayDeduction",
        value: 0.5,
        segment: "All",
        staffId: "All",
        enabled: true,
        systemRule: true
      },
      {
        id: "rule_absent",
        name: "Short Logout Absent Rule (शॉर्ट लॉगआउट नियम)",
        description: "Work less than 4.0 hours counts as absent (1 day deduction) / 4.0 घंटे से कम काम करने पर अनुपस्थित माना जाएगा (1 दिन की कटौती)",
        type: "AbsentDeduction",
        value: 1.0,
        segment: "All",
        staffId: "All",
        enabled: true,
        systemRule: true
      },
      {
        id: "rule_paid_leaves",
        name: "Monthly Paid Leaves Limit (सवैतनिक अवकाश सीमा)",
        description: "First 2 approved leaves are paid; further are unpaid / पहले 2 स्वीकृत अवकाश सवैतनिक हैं; आगे के अवकाश अवकाश अवैतनिक (बिना वेतन) होंगे",
        type: "PaidLeavesLimit",
        value: 2,
        segment: "All",
        staffId: "All",
        enabled: true,
        systemRule: true
      },
      {
        id: "rule_performance_cut",
        name: "Low Performance Salary Cut (कम प्रदर्शन कटौती)",
        description: "Under 80% task/sales performance, basic salary scales down by performance % / 80% से कम प्रदर्शन होने पर, बेसिक सैलरी प्रदर्शन प्रतिशत के अनुसार घट जाएगी",
        type: "PerformanceCut",
        value: 80,
        segment: "All",
        staffId: "All",
        enabled: true,
        systemRule: true
      }
    ];
  }
  return db;
};

export function calculatePayrollReport(dbInput: any, targetMonth: string, tenantId?: string) {
  getHRMLists(dbInput);
  const currentTenantId = tenantId || "t-default";

  // Create a tenant scoped view of the database
  const db = {
    ...dbInput,
    users: (dbInput.users || []).filter((u: any) => u.tenantId === currentTenantId),
    attendance: (dbInput.attendance || []).filter((a: any) => a.tenantId === currentTenantId),
    leaves: (dbInput.leaves || []).filter((l: any) => l.tenantId === currentTenantId),
    tasks: (dbInput.tasks || []).filter((t: any) => t.tenantId === currentTenantId),
    companyHolidays: (dbInput.companyHolidays || []).filter((h: any) => h.tenantId === currentTenantId),
    salaryRules: (dbInput.salaryRules || []).filter((r: any) => r.tenantId === currentTenantId),
    payrollOverrides: (dbInput.payrollOverrides || []).filter((o: any) => o.tenantId === currentTenantId),
    releasedSalaries: (dbInput.releasedSalaries || []).filter((s: any) => s.tenantId === currentTenantId),
    callLogs: (dbInput.callLogs || []).filter((c: any) => c.tenantId === currentTenantId),
  };

  const [yr, mn] = targetMonth.split("-").map(Number);
  if (!yr || !mn || mn < 1 || mn > 12) {
    throw new Error("Invalid month format. Expected YYYY-MM");
  }

  const daysInMonth = new Date(yr, mn, 0).getDate();
  const isFeb = mn === 2;

  // Filter out the main admin u-admin, check joining, deletion, & suspension eligibility
  const eligibleUsers = db.users.filter((u: any) => {
    if (u.id === "u-admin" || u.email === "contact.grahicsworld@gmail.com") return false;

    // Check roles allowed in this panel
    const allowedRoles = ["sub-admin", "head", "staff", "telecaller"];
    if (!allowedRoles.includes(u.role)) return false;

    // 1. Filter by joining date: Must have joined on or before targetMonth (YYYY-MM)
    if (u.joiningDate) {
      const [joinYr, joinMn] = u.joiningDate.split("-").map(Number);
      if (joinYr && joinMn) {
        if (yr < joinYr || (yr === joinYr && mn < joinMn)) {
          return false; // User has not joined yet in targetMonth
        }
      }
    }

    // 2. Filter by deletion date: Must not be deleted in a month prior to targetMonth
    if (u.deleted && u.deletedAt) {
      const [delYr, delMn] = u.deletedAt.split("-").map(Number);
      if (delYr && delMn) {
        if (yr > delYr || (yr === delYr && mn > delMn)) {
          return false; // User was deleted in a past month
        }
      }
    }

    // 3. Filter by suspension date: Must not be suspended in a month prior to targetMonth
    if (u.status === "suspended" || u.suspendedAt) {
      if (u.suspendedAt) {
        const [suspYr, suspMn] = u.suspendedAt.split("-").map(Number);
        if (suspYr && suspMn) {
          if (yr > suspYr || (yr === suspYr && mn > suspMn)) {
            return false; // User was suspended in a past month
          }
        }
      } else {
        const currentMonthStr = new Date().toISOString().slice(0, 7);
        if (targetMonth >= currentMonthStr) {
          return false;
        }
      }
    }

    return true;
  });

  db.payrollOverrides = db.payrollOverrides || [];
  db.releasedSalaries = db.releasedSalaries || [];

  const report = eligibleUsers.map((user: any) => {
    const salaryBase = user.salaryBase || 12000;
    const commissionRate = user.commissionRate || 100;
    const monthlyTarget = user.monthlyTarget || 5;
    const perDaySalary = Number((salaryBase / daysInMonth).toFixed(2));
    const hourlyRate = Number((perDaySalary / 9).toFixed(4));

    // Load dynamic salary rules and check applicability for this user
    const userRules = (db.salaryRules || []).filter((r: any) => {
      if (!r.enabled) return false;
      if (r.segment && r.segment !== "All" && r.segment !== user.department) return false;
      if (r.staffId && r.staffId !== "All" && r.staffId !== user.id) return false;
      return true;
    });

    const isLateRule = userRules.find((r: any) => r.type === "LateDeduction");
    const isSandwichRule = userRules.find((r: any) => r.type === "SandwichDeduction");
    const isHalfDayRule = userRules.find((r: any) => r.type === "HalfDayDeduction");
    const isAbsentRule = userRules.find((r: any) => r.type === "AbsentDeduction");
    const isPaidLeavesRule = userRules.find((r: any) => r.type === "PaidLeavesLimit");
    const isPerformanceCutRule = userRules.find((r: any) => r.type === "PerformanceCut");

    const customAllowances = userRules.filter((r: any) => r.type === "Allowance" || r.type === "CustomAddition");
    const customDeductions = userRules.filter((r: any) => r.type === "CustomDeduction");

    // Get Admin overrides for this user & month
    let override = db.payrollOverrides.find((o: any) => o.month === targetMonth && o.userId === user.id);
    if (!override) {
      override = { month: targetMonth, userId: user.id, forceFullSalary: false, extraLeavePaid: false, approveOvertime: true };
    }

    let totalDeductions = 0;
    let presentDays = 0;
    let leaveDays = 0;
    let absentDays = 0;
    let sundayPaidCount = 0;
    let sundayDeductedCount = 0;
    let companyHolidaysCount = 0;

    let weekdayOvertimeHours = 0;
    let weekdayOvertimePay = 0;
    let sundayOvertimeCount = 0;
    let sundayOvertimeEarned = 0;
    let lateArrivalsCount = 0;
    let lateDeductionsTotal = 0;

    const detailDays: any[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    // Evaluate if Saturday or Monday counts as a leave or absent day for the Sunday sandwich rule
    const isLeaveOrAbsent = (targetDateStr: string, targetDayNum: number) => {
      if (targetDayNum < 1 || targetDayNum > daysInMonth) return false;

      const att = db.attendance.find((a: any) => a.userId === user.id && a.date === targetDateStr);
      if (att) {
        let workHours = 0;
        if (att.loginTime && att.logoutTime) {
          const diffMs = new Date(att.logoutTime).getTime() - new Date(att.loginTime).getTime();
          workHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
        } else if (att.loginTime && targetDateStr === todayStr) {
          workHours = 9.0;
        } else {
          workHours = 4.0;
        }
        if (workHours < 4.0) {
          return true; // Short logout counts as absent/leave
        }
        return false;
      }

      // Check company holiday (not a leave/absent day)
      const isCompHoliday = db.companyHolidays.some((h: any) => h.date === targetDateStr);
      if (isCompHoliday) return false;

      // Check Sunday itself
      const dow = new Date(yr, mn - 1, targetDayNum).getDay();
      if (dow === 0) return false;

      // Check approved leave
      const appLeave = db.leaves.find(
        (l: any) => l.userId === user.id && l.status === "Approved" && l.startDate <= targetDateStr && l.endDate >= targetDateStr
      );
      if (appLeave) {
        if (appLeave.payType === "Full Pay" || appLeave.approvedBy === "u-admin") {
          return false;
        }
        return true; // Half Pay or Unpaid count as leave/absent
      }

      // No attendance, no company holiday, no approved full-pay leave -> Absent/Unapproved leave
      return true;
    };

    // Loop through each day of the target month
    let approvedLeavesCountSoFar = 0;

    let hasNotJoinedYet = false;
    let joinDy = 1;
    if (user.joiningDate) {
      const [joinYr, joinMn, jd] = user.joiningDate.split("-").map(Number);
      if (joinYr && joinMn) {
        if (yr < joinYr || (yr === joinYr && mn < joinMn)) {
          hasNotJoinedYet = true;
        }
        if (jd) joinDy = jd;
      }
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = String(d).padStart(2, "0");
      const dateStr = `${yr}-${String(mn).padStart(2, "0")}-${dayStr}`;

      if (hasNotJoinedYet) {
        detailDays.push({ 
          date: dateStr, 
          day: d, 
          type: "BeforeJoining", 
          label: "Before Joining (Unpaid)", 
          deductionFraction: 1.0 
        });
        totalDeductions += perDaySalary;
        continue;
      }

      if (user.joiningDate) {
        const [joinYr, joinMn] = user.joiningDate.split("-").map(Number);
        if (yr === joinYr && mn === joinMn && d < joinDy) {
          detailDays.push({ 
            date: dateStr, 
            day: d, 
            type: "BeforeJoining", 
            label: "Before Joining (Unpaid)", 
            deductionFraction: 1.0 
          });
          totalDeductions += perDaySalary;
          continue;
        }
      }

      if (user.deleted && user.deletedAt) {
        const [delYr, delMn, delDy] = user.deletedAt.split("-").map(Number);
        if (yr === delYr && mn === delMn && delDy && d > delDy) {
          detailDays.push({ 
            date: dateStr, 
            day: d, 
            type: "AfterDeletion", 
            label: "After Deletion (Unpaid)", 
            deductionFraction: 1.0 
          });
          totalDeductions += perDaySalary;
          continue;
        }
      }
      
      const dayOfWeek = new Date(yr, mn - 1, d).getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Check if declared as Company-wide Holiday by Main Admin
      const isCompanyHoliday = db.companyHolidays.some((h: any) => h.date === dateStr);

      if (isCompanyHoliday) {
        companyHolidaysCount++;
        detailDays.push({ 
          date: dateStr, 
          day: d, 
          type: "CompanyHoliday", 
          label: "Company Holiday (Paid)", 
          deductionFraction: 0 
        });
      } else if (dayOfWeek === 0) {
        // It is Sunday!
        // Check Sunday Overtime (If worked on Sunday)
        const sunAttRecord = db.attendance.find((a: any) => a.userId === user.id && a.date === dateStr);
        if (sunAttRecord) {
          sundayOvertimeCount++;
          const sunPay = Number((1.5 * perDaySalary).toFixed(2));
          sundayOvertimeEarned += sunPay;
          detailDays.push({
            date: dateStr,
            day: d,
            type: "Sunday-Overtime",
            label: "Worked on Sunday (150% Overtime Bonus)",
            deductionFraction: 0,
            bonus: sunPay
          });
        } else {
          // Standard Sunday calculation
          if (isFeb) {
            sundayPaidCount++;
            detailDays.push({ 
              date: dateStr, 
              day: d, 
              type: "Sunday-Paid", 
              label: "Sunday (Paid)", 
              deductionFraction: 0 
            });
          } else {
            if (isSandwichRule) {
              // Sunday sandwich rule
              const satDate = new Date(yr, mn - 1, d - 1);
              const satStr = satDate.toISOString().split("T")[0];
              const monDate = new Date(yr, mn - 1, d + 1);
              const monStr = monDate.toISOString().split("T")[0];

              const satLeaveOrAbsent = isLeaveOrAbsent(satStr, d - 1);
              const monLeaveOrAbsent = isLeaveOrAbsent(monStr, d + 1);

              if (satLeaveOrAbsent && monLeaveOrAbsent) {
                sundayDeductedCount++;
                detailDays.push({ 
                  date: dateStr, 
                  day: d, 
                  type: "Sunday-Deducted", 
                  label: "Sunday (Deducted - Sandwiched between Sat/Mon Leave/Absent)", 
                  deductionFraction: 1.0 
                });
                totalDeductions += perDaySalary;
              } else {
                sundayPaidCount++;
                detailDays.push({ 
                  date: dateStr, 
                  day: d, 
                  type: "Sunday-Paid", 
                  label: "Sunday (Paid)", 
                  deductionFraction: 0 
                });
              }
            } else {
              sundayPaidCount++;
              detailDays.push({ 
                date: dateStr, 
                day: d, 
                type: "Sunday-Paid", 
                label: "Sunday (Paid)", 
                deductionFraction: 0 
              });
            }
          }
        }
      } else {
        // Regular weekday/Saturday
        const attRecord = db.attendance.find((a: any) => a.userId === user.id && a.date === dateStr);
        if (attRecord) {
          let workHours = 0;
          if (attRecord.loginTime && attRecord.logoutTime) {
            const diffMs = new Date(attRecord.logoutTime).getTime() - new Date(attRecord.loginTime).getTime();
            workHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));
          } else if (attRecord.loginTime && dateStr === todayStr) {
            workHours = 9.0;
          } else {
            workHours = 4.0; // Past day forgotten logout
          }

          // Late Arrival Check (from 10:00 AM, if after 10:18 AM, deduct 1 hr pay per 10 mins late)
          let lateDeduction = 0;
          let lateMinutes = 0;
          let lateHoursDeducted = 0;
          if (isLateRule && attRecord.loginTime) {
            try {
              const istTimeStr = new Date(attRecord.loginTime).toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata", hour12: false });
              const [loginHr, loginMin] = istTimeStr.split(":").map(Number);
              if (loginHr > 10 || (loginHr === 10 && loginMin > 18)) {
                lateMinutes = (loginHr - 10) * 60 + loginMin;
                lateHoursDeducted = Math.floor(lateMinutes / 10);
                if (lateHoursDeducted > 9) lateHoursDeducted = 9; // Max 1 day
                lateDeduction = Number((lateHoursDeducted * (perDaySalary / 9)).toFixed(2));
                totalDeductions += lateDeduction;
                lateArrivalsCount++;
                lateDeductionsTotal += lateDeduction;
              }
            } catch (err) {}
          }

          if (workHours >= 9.0) {
            presentDays++;
            // Weekday Overtime (150% pay per hour beyond 9h)
            const otHours = Number((workHours - 9.0).toFixed(2));
            let otPay = 0;
            if (otHours > 0 && override.approveOvertime !== false) {
              weekdayOvertimeHours += otHours;
              otPay = Number((otHours * 1.5 * hourlyRate).toFixed(2));
              weekdayOvertimePay += otPay;
            }

            detailDays.push({ 
              date: dateStr, 
              day: d, 
              type: "Present", 
              label: `Present (${workHours} hrs)${lateHoursDeducted > 0 ? ` [Late ${lateMinutes}m, -${lateHoursDeducted}h pay]` : ""}${otHours > 0 ? ` [OT +${otHours}h]` : ""}`, 
              deductionFraction: 0,
              lateMinutes,
              lateDeduction,
              otHours,
              otPay
            });
          } else if (workHours >= 4.0) {
            if (isHalfDayRule) {
              const halfFraction = isHalfDayRule.value; // Usually 0.5
              presentDays += (1 - halfFraction);
              const halfDayDed = Number((halfFraction * perDaySalary).toFixed(2));
              totalDeductions += halfDayDed;
              detailDays.push({ 
                date: dateStr, 
                day: d, 
                type: "Present-Half", 
                label: `Present (${workHours} hrs - Half Day)${lateHoursDeducted > 0 ? ` [Late ${lateMinutes}m, -${lateHoursDeducted}h pay]` : ""}`, 
                deductionFraction: halfFraction,
                lateMinutes,
                lateDeduction
              });
            } else {
              // Half Day rule is disabled! Treat as Present
              presentDays++;
              detailDays.push({ 
                date: dateStr, 
                day: d, 
                type: "Present", 
                label: `Present (${workHours} hrs)${lateHoursDeducted > 0 ? ` [Late ${lateMinutes}m, -${lateHoursDeducted}h pay]` : ""}`, 
                deductionFraction: 0,
                lateMinutes,
                lateDeduction
              });
            }
          } else {
            // workHours < 4.0
            if (isAbsentRule) {
              absentDays++;
              const absentFraction = isAbsentRule.value; // Usually 1.0
              totalDeductions += Number((absentFraction * perDaySalary).toFixed(2));
              detailDays.push({ 
                date: dateStr, 
                day: d, 
                type: "Absent", 
                label: `Present (${workHours} hrs - Short Logout < 4 hrs)`, 
                deductionFraction: absentFraction,
                lateMinutes,
                lateDeduction: 0
              });
            } else if (isHalfDayRule) {
              // Absent rule disabled, but Half Day is enabled -> treat short logout as half-day
              const halfFraction = isHalfDayRule.value;
              presentDays += (1 - halfFraction);
              const halfDayDed = Number((halfFraction * perDaySalary).toFixed(2));
              totalDeductions += halfDayDed;
              detailDays.push({ 
                date: dateStr, 
                day: d, 
                type: "Present-Half", 
                label: `Present (${workHours} hrs - Short Logout treated as Half Day)${lateHoursDeducted > 0 ? ` [Late ${lateMinutes}m, -${lateHoursDeducted}h pay]` : ""}`, 
                deductionFraction: halfFraction,
                lateMinutes,
                lateDeduction
              });
            } else {
              // Both disabled! Treat as fully Present
              presentDays++;
              detailDays.push({ 
                date: dateStr, 
                day: d, 
                type: "Present", 
                label: `Present (${workHours} hrs)${lateHoursDeducted > 0 ? ` [Late ${lateMinutes}m, -${lateHoursDeducted}h pay]` : ""}`, 
                deductionFraction: 0,
                lateMinutes,
                lateDeduction
              });
            }
          }
        } else {
          // No attendance. Check if user has an approved leave
          const appLeave = db.leaves.find(
            (l: any) => l.userId === user.id && l.status === "Approved" && l.startDate <= dateStr && l.endDate >= dateStr
          );
          if (appLeave) {
            approvedLeavesCountSoFar++;
            leaveDays++;
            // Check paid leaves limit rule
            const leavesLimit = isPaidLeavesRule ? isPaidLeavesRule.value : 999;
            if (approvedLeavesCountSoFar <= leavesLimit || appLeave.payType === "Full Pay" || appLeave.approvedBy === "u-admin" || override.extraLeavePaid) {
              detailDays.push({ 
                date: dateStr, 
                day: d, 
                type: "Leave-Approved-Full", 
                label: `Approved Leave (Paid - count ${approvedLeavesCountSoFar}${isPaidLeavesRule ? ` of limit ${leavesLimit}` : ""})`, 
                deductionFraction: 0.0 
              });
            } else {
              detailDays.push({ 
                date: dateStr, 
                day: d, 
                type: "Leave-Approved-Unpaid", 
                label: `Approved Leave (Unpaid - Exceeded Limit of ${leavesLimit} leaves)`, 
                deductionFraction: 1.0 
              });
              totalDeductions += perDaySalary;
            }
          } else {
            absentDays++;
            detailDays.push({ 
              date: dateStr, 
              day: d, 
              type: "Absent", 
              label: "Absent (Deducted)", 
              deductionFraction: 1.0 
            });
            totalDeductions += perDaySalary;
          }
        }
      }
    }

    const finalBasicSalaryBeforePerformance = hasNotJoinedYet ? 0 : Number(Math.max(0, salaryBase - totalDeductions).toFixed(2));

    // Calculate calling metrics in the target month (only applicable/relevant to telecallers, but calculated for overview)
    const userLogs = db.callLogs.filter(
      (c: any) => c.telecallerId === user.id && c.timestamp && c.timestamp.startsWith(targetMonth)
    );

    const totalCalls = userLogs.length;
    const interestedCount = userLogs.filter((c: any) => c.status === "Interested").length;
    const salesDoneCount = userLogs.filter((c: any) => c.status === "Sales Done").length;
    
    const businessRevenue = userLogs
      .filter((c: any) => c.status === "Sales Done")
      .reduce((sum: number, c: any) => sum + (Number(c.dealValue) || 0), 0);

    // Performance Pct and Incentive
    let performancePct = 0;
    let incentivePct = 0;
    let incentiveAmount = 0;

    const isSalesRole = user.role === "telecaller" || (user.role === "staff" && user.department === "Sales");

    if (isSalesRole) {
      performancePct = monthlyTarget > 0 ? Number(((salesDoneCount / monthlyTarget) * 100).toFixed(2)) : 0;
      if (performancePct > 100) {
        incentivePct = Number((performancePct - 100).toFixed(2));
        incentiveAmount = Number(((incentivePct / 100) * salaryBase).toFixed(2));
      }
    } else {
      // Sub-admin, department head, or Tech/NonTech staff tasks performance and incentive
      const monthTasks = db.tasks.filter((t: any) => (t.adminId === user.id || t.assignedTo === user.id) && t.date && t.date.startsWith(targetMonth));
      const totalTasks = monthTasks.length;
      const approvedTasks = monthTasks.filter((t: any) => t.status === "Approved").length;
      
      performancePct = totalTasks > 0 ? Number(((approvedTasks / totalTasks) * 100).toFixed(2)) : 100;
      incentiveAmount = approvedTasks * commissionRate; // Commission/Incentive per approved task
    }

    // Performance-based salary cut (dynamic threshold)
    let performanceDeduction = 0;
    let finalBasicSalary = finalBasicSalaryBeforePerformance;

    const perfCutThreshold = isPerformanceCutRule ? isPerformanceCutRule.value : 0;
    if (perfCutThreshold > 0 && performancePct < perfCutThreshold) {
      if (override.forceFullSalary) {
        performanceDeduction = 0;
      } else {
        // Basic salary scaled down according to performance %
        const scaleFactor = performancePct / 100;
        finalBasicSalary = Number((finalBasicSalaryBeforePerformance * scaleFactor).toFixed(2));
        performanceDeduction = Number((finalBasicSalaryBeforePerformance - finalBasicSalary).toFixed(2));
      }
    }

    // Apply custom allowances (additions)
    let totalCustomAllowances = 0;
    const appliedCustomAllowances = customAllowances.map((r: any) => {
      let amount = 0;
      if (r.valueType === "Percentage") {
        amount = Number(((r.value / 100) * salaryBase).toFixed(2));
      } else {
        amount = r.value;
      }
      totalCustomAllowances += amount;
      return { id: r.id, name: r.name, amount };
    });

    // Apply custom deductions
    let totalCustomDeductions = 0;
    const appliedCustomDeductions = customDeductions.map((r: any) => {
      let amount = 0;
      if (r.valueType === "Percentage") {
        amount = Number(((r.value / 100) * salaryBase).toFixed(2));
      } else {
        amount = r.value;
      }
      totalCustomDeductions += amount;
      return { id: r.id, name: r.name, amount };
    });

    const finalSalary = hasNotJoinedYet ? 0 : Number(Math.max(0, finalBasicSalary + incentiveAmount + weekdayOvertimePay + sundayOvertimeEarned + totalCustomAllowances - totalCustomDeductions).toFixed(2));

    // Check release status
    const isReleased = db.releasedSalaries.some((r: any) => r.month === targetMonth && r.userId === user.id);
    const releaseRecord = db.releasedSalaries.find((r: any) => r.month === targetMonth && r.userId === user.id);

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      role: user.role,
      position: user.position || "",
      department: user.department || "Sales",
      joiningDate: user.joiningDate || "2026-07-01",
      employmentCode: user.employmentCode || generateEmploymentCode(user.name, user.department || "Sales", user.position || "", user.joiningDate || "2026-07-01"),
      salaryBase,
      commissionRate,
      monthlyTarget,
      daysInMonth,
      perDaySalary,
      presentDays,
      leaveDays,
      absentDays,
      sundayPaidCount,
      sundayDeductedCount,
      companyHolidaysCount,
      totalDeductions: Number(totalDeductions.toFixed(2)),
      finalBasicSalaryBeforePerformance,
      performanceDeduction,
      finalBasicSalary,
      weekdayOvertimeHours,
      weekdayOvertimePay,
      sundayOvertimeCount,
      sundayOvertimeEarned,
      lateArrivalsCount,
      lateDeductionsTotal,
      totalCalls,
      interestedCount,
      salesDoneCount,
      businessRevenue,
      performancePct,
      incentivePct,
      incentiveAmount,
      finalSalary,
      detailDays,
      isReleased,
      releasedAt: releaseRecord ? releaseRecord.releasedAt : null,
      override,
      appliedCustomAllowances,
      appliedCustomDeductions,
      totalTasks: isSalesRole ? 0 : db.tasks.filter((t: any) => (t.adminId === user.id || t.assignedTo === user.id) && t.date && t.date.startsWith(targetMonth)).length,
      approvedTasks: isSalesRole ? 0 : db.tasks.filter((t: any) => (t.adminId === user.id || t.assignedTo === user.id) && t.date && t.date.startsWith(targetMonth) && t.status === "Approved").length
    };
  });

  return report;
}
