const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const getYearMonth = (monthStr: string) => {
  if (monthStr === 'All') return null;
  const parts = monthStr.split(' ');
  if (parts.length === 2) {
    const month = MONTH_NAMES.indexOf(parts[0]);
    const year = parseInt(parts[1], 10);
    if (month !== -1 && !isNaN(year)) {
      return { year, month };
    }
  }
  return null;
};

export const hasJoinedBy = (joinDateStr: string, targetYearMonth: { year: number; month: number } | null) => {
  if (!targetYearMonth) return true;
  if (!joinDateStr) return true;
  const date = new Date(joinDateStr);
  if (isNaN(date.getTime())) return true;
  
  const joinYear = date.getFullYear();
  const joinMonth = date.getMonth();
  
  if (joinYear < targetYearMonth.year) return true;
  if (joinYear === targetYearMonth.year && joinMonth <= targetYearMonth.month) return true;
  return false;
};

export const generateMonths = (): string[] => {
  const monthsList: string[] = [];
  const currentDate = new Date();
  
  // Start from February 2026
  const startYear = 2026;
  const startMonth = 1; // February (0-indexed is 1)
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  let year = currentYear;
  let month = currentMonth;
  
  while (year > startYear || (year === startYear && month >= startMonth)) {
    monthsList.push(`${MONTH_NAMES[month]} ${year}`);
    month--;
    if (month < 0) {
      month = 11;
      year--;
    }
  }
  
  return monthsList;
};

export interface HelperLeaveRequest {
  staffId: string;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
  status: string;
}

export interface LeaveAccrualResult {
  accrued: number;
  used: number;
  balance: number;
  unpaidDaysInTargetMonth: number;
}

export const getApprovedLeaveDaysForMonth = (
  leaves: HelperLeaveRequest[],
  staffId: string,
  year: number,
  month: number // 0-indexed (0 = Jan, 11 = Dec)
): number => {
  let totalDays = 0;
  
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  leaves.forEach((leave) => {
    if (String(leave.staffId) !== String(staffId) || leave.status !== 'Approved') {
      return;
    }

    const leaveStart = new Date(leave.from);
    const leaveEnd = new Date(leave.to);

    if (leaveStart <= endOfMonth && leaveEnd >= startOfMonth) {
      const overlapStart = new Date(Math.max(leaveStart.getTime(), startOfMonth.getTime()));
      const overlapEnd = new Date(Math.min(leaveEnd.getTime(), endOfMonth.getTime()));
      
      let count = 0;
      const cur = new Date(overlapStart.getFullYear(), overlapStart.getMonth(), overlapStart.getDate());
      const endD = new Date(overlapEnd.getFullYear(), overlapEnd.getMonth(), overlapEnd.getDate());
      while (cur <= endD) {
        count++;
        cur.setDate(cur.getDate() + 1);
      }
      totalDays += count;
    }
  });

  return totalDays;
};

export const calculateLeaveAccrual = (
  leaves: HelperLeaveRequest[],
  staffId: string,
  joinDateStr: string,
  targetYear: number,
  targetMonth: number // 0-indexed (0 = Jan, 11 = Dec)
): LeaveAccrualResult => {
  // Accrual cycle starts on January 2026 or join date, whichever is later.
  let startYear = 2026;
  let startMonth = 0; // January

  if (joinDateStr) {
    const joinDate = new Date(joinDateStr);
    if (!isNaN(joinDate.getTime())) {
      const joinYear = joinDate.getFullYear();
      const joinMonthVal = joinDate.getMonth();
      
      if (joinYear > 2026 || (joinYear === 2026 && joinMonthVal > 0)) {
        startYear = joinYear;
        startMonth = joinMonthVal;
      }
    }
  }

  let runningBalance = 0;
  let totalAccrued = 0;
  let totalUsed = 0;
  let unpaidDaysInTargetMonth = 0;

  let curYear = startYear;
  let curMonth = startMonth;

  while (curYear < targetYear || (curYear === targetYear && curMonth <= targetMonth)) {
    // 1. Accrue 1 paid leave
    runningBalance += 1;
    totalAccrued += 1;

    // 2. Subtract leaves used in this month
    const usedInMonth = getApprovedLeaveDaysForMonth(leaves, staffId, curYear, curMonth);
    totalUsed += usedInMonth;
    runningBalance -= usedInMonth;

    // 3. Check if balance is negative (exceeded leaves)
    if (runningBalance < 0) {
      const unpaid = Math.abs(runningBalance);
      if (curYear === targetYear && curMonth === targetMonth) {
        unpaidDaysInTargetMonth = unpaid;
      }
      runningBalance = 0; // cannot carry forward negative leaves
    }

    curMonth++;
    if (curMonth > 11) {
      curMonth = 0;
      curYear++;
    }
  }

  return {
    accrued: totalAccrued,
    used: totalUsed,
    balance: runningBalance,
    unpaidDaysInTargetMonth
  };
};
