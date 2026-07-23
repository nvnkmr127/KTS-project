import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { KPICard } from '../components/KPICard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, CheckCircle2, XCircle, TrendingUp, Download, Printer, Filter } from 'lucide-react';
import { useDialog } from '../context/DialogContext';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { StaffMember, isRealStaff } from './StaffManagement';
import { getLocalDateStr, formatDate } from '../utils/date';
import * as XLSX from 'xlsx-js-style';
import { downloadSheet } from '../utils/excel';
import { Avatar } from '../components/ui';

interface MonthData {
  monthName: string;
  workDays: number;
  present: number;
  late: number;
  half: number;
  absent: number;
  leave: number;
  percentage: string;
}

interface FacultyReport {
  id: string;
  name: string;
  empId: string;
  role: string;
  department: string;
  months: Record<string, MonthData>;
  overall: MonthData;
}

export function StaffAttendanceAnalytics() {
  const { alert } = useDialog();
  const { leaveRequests } = useApp();
  const [department, setDepartment] = useState('All Departments');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(getLocalDateStr());

  const [departments, setDepartments] = useState<string[]>([]);
  const [facultyReports, setFacultyReports] = useState<FacultyReport[]>([]);
  const [monthsPresent, setMonthsPresent] = useState<string[]>([]);
  
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [dailyBiometricLogs, setDailyBiometricLogs] = useState<any[]>([]);
  const [dailyLocalPunches, setDailyLocalPunches] = useState<any[]>([]);
  const [dailyAttendanceMap, setDailyAttendanceMap] = useState<any>({});
  const [settings, setSettings] = useState<any>({
    lateEntryCutoff: '09:50',
    earlyEntryCutoff: '15:00',
    presentCutoffMorning: '09:00',
    presentCutoffEvening: '16:30'
  });
  
  // KPIs
  const [kpis, setKpis] = useState({
    totalFaculty: 0,
    avgAttendance: '0%',
    avgPresentDays: '0',
    avgAbsentDays: '0'
  });

  // Charts
  const [barData, setBarData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    generateReport();
  }, [startDate, endDate, department, leaveRequests]);

  const generateReport = async () => {
    try {
      // 1. Fetch Faculty
      let staffList: StaffMember[] = [];
      try {
        const staffData = await api.getResources('faculty');
        const extractArray = (res: any) => Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : (res?.data?.data && Array.isArray(res.data.data) ? res.data.data : []));
        const staffArr = extractArray(staffData);
        if (staffArr.length > 0) {
          staffList = staffArr.map((s: any) => ({
            ...s,
            documents: typeof s.documents === 'string' ? JSON.parse(s.documents) : (s.documents || []),
            status: s.status ? s.status.charAt(0).toUpperCase() + s.status.slice(1) : 'Active',
            salary: typeof s.salary === 'string' ? parseFloat(s.salary) : s.salary
          })).filter((s: StaffMember) => isRealStaff(s));
        } else {
          throw new Error('No data');
        }
      } catch (err) {
        const saved = localStorage.getItem('kts_staff_members');
        if (saved) {
          staffList = JSON.parse(saved).filter(isRealStaff);
        }
      }

      // Departments
      const depts = Array.from(new Set(staffList.map(s => s.department || 'Other'))).sort();
      setDepartments(prev => (prev.length === 0 ? ['All Departments', ...depts] : prev));

      const filteredStaffList = department === 'All Departments' 
        ? staffList 
        : staffList.filter(s => s.department === department);
      setFilteredStaff(filteredStaffList);

      // Fetch settings and attendance
      let attendanceMap: any = {};
      let localPunches: any[] = [];
      try {
        const sets = await api.getResources('settings');
        const sArr = Array.isArray(sets) ? sets : (sets && sets.data && Array.isArray(sets.data) ? sets.data : []);
        setSettings({
          lateEntryCutoff: sArr.find((s:any) => s.key === 'late_entry_cutoff')?.value || '09:50',
          earlyEntryCutoff: sArr.find((s:any) => s.key === 'early_entry_cutoff')?.value || '15:00',
          presentCutoffMorning: sArr.find((s:any) => s.key === 'present_cutoff_morning')?.value || '09:00',
          presentCutoffEvening: sArr.find((s:any) => s.key === 'present_cutoff_evening')?.value || '16:30'
        });
        
        const attendanceSetting = sArr.find((s: any) => s.key === 'kts_staff_attendance');
        if (attendanceSetting && attendanceSetting.value) {
          attendanceMap = JSON.parse(attendanceSetting.value);
        }
        
        const punchesSetting = sArr.find((s: any) => s.key === 'kts_biometric_punches');
        if (punchesSetting && punchesSetting.value) {
          localPunches = JSON.parse(punchesSetting.value);
        }
      } catch(e) {}

      // 2. Fallback to localStorage if API data is empty
      if (Object.keys(attendanceMap).length === 0) {
        const localAttendance = localStorage.getItem('kts_staff_attendance');
        if (localAttendance) {
          try { attendanceMap = JSON.parse(localAttendance); } catch(e) {}
        }
      }
      setDailyAttendanceMap(attendanceMap);

      if (localPunches.length === 0) {
        const localP = localStorage.getItem('kts_biometric_punches');
        if (localP) {
          try { localPunches = JSON.parse(localP); } catch(e) {}
        }
      }

      let fetchedBiometricLogs: any[] = [];
      try {
        const logsData = await api.getResources('biometric-logs', { start_date: startDate, end_date: endDate, limit: '10000' });
        const extractArray = (res: any) => Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : (res?.data?.data && Array.isArray(res.data.data) ? res.data.data : []));
        fetchedBiometricLogs = extractArray(logsData);
      } catch(e) {}
      setDailyBiometricLogs(fetchedBiometricLogs);
      
      const fetchedLocalPunches = localPunches.filter((p:any) => p.timestamp >= startDate && p.timestamp <= endDate + ' 23:59:59');
      setDailyLocalPunches(fetchedLocalPunches);

      // 3. Leaves are directly used from useApp()
      const allLeaves = leaveRequests || [];

      // Calculate months between startDate and endDate
      const sDate = new Date(startDate);
      const eDate = new Date(endDate);
      const monthsSet = new Set<string>();
      const current = new Date(sDate);
      current.setDate(1);
      while (current <= eDate) {
        monthsSet.add(current.toLocaleString('default', { month: 'long', year: 'numeric' }));
        current.setMonth(current.getMonth() + 1);
      }
      // ensure endDate month is included
      monthsSet.add(eDate.toLocaleString('default', { month: 'long', year: 'numeric' }));
      const monthsArr = Array.from(monthsSet);
      setMonthsPresent(monthsArr);

      // Map to dates within range
      const datesInRange: string[] = [];
      const tempDate = new Date(sDate);
      while (tempDate <= eDate) {
        datesInRange.push(tempDate.toISOString().split('T')[0]);
        tempDate.setDate(tempDate.getDate() + 1);
      }

      const computeStatus = (staff: StaffMember, targetDate: string) => {
        const manualStatus = attendanceMap[targetDate]?.[staff.id];
        const hasLeave = allLeaves.some((l: any) => {
           if (String(l.user_id || l.staffId) === String(staff.id) && l.status === 'Approved') {
              return targetDate >= (l.start_date || l.from) && targetDate <= (l.end_date || l.to);
           }
           return false;
        });
        if (hasLeave) return 'Leave';
        if (manualStatus) return manualStatus;

        let mode = 'biometric';
        try { mode = localStorage.getItem('kts_staff_attendance_mode') || 'biometric'; } catch(e) {}
        if (mode === 'manual') return 'Present';

        const punches: string[] = [];
        fetchedLocalPunches.forEach(p => {
          if (String(p.staffId) === String(staff.id) && p.timestamp.startsWith(targetDate)) punches.push(p.timestamp);
        });

        const normalizeName = (name: string) => (name||'').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
        const staffBioCode = String(staff.biometric_employee_code || staff.id).toLowerCase().trim();
        const staffNameNorm = normalizeName(staff.name);

        fetchedBiometricLogs.forEach(l => {
          const eCode = String(l.employee_code || l.Empcode || '').toLowerCase().trim();
          const lName = normalizeName(l.raw_data?.name || l.raw_data?.Name || '');
          let logDate = l.scan_datetime ? l.scan_datetime.substring(0, 10) : '';
          if (!logDate && l.raw_data?.in_time) logDate = targetDate;
          
          if (logDate === targetDate || l.scan_datetime?.startsWith(targetDate) || (l.raw_data?.in_time && l.PunchDate?.startsWith(targetDate))) {
              if (eCode === staffBioCode || (lName && lName === staffNameNorm)) {
                if (l.scan_datetime) punches.push(l.scan_datetime);
                else if (l.raw_data?.in_time) punches.push(`${targetDate} ${l.raw_data.in_time}:00`);
                else if (l.raw_data?.out_time) punches.push(`${targetDate} ${l.raw_data.out_time}:00`);
              }
          }
        });

        if (punches.length === 0) return 'Absent';

        const sorted = [...new Set(punches)].sort();
        const inTimeStr = sorted[0].split(' ')[1]?.substring(0, 5) || null;
        const outTimeStr = sorted.length > 1 ? sorted[sorted.length - 1].split(' ')[1]?.substring(0, 5) : null;

        let status = 'Absent';
        let hasCheckIn = false;
        let hasCheckOut = false;
        const s = settings;
        if (inTimeStr && inTimeStr <= ((s.lateEntryCutoff || '09:50') + ':59')) hasCheckIn = true;
        if (outTimeStr && outTimeStr >= ((s.earlyEntryCutoff || '15:00') + ':00')) hasCheckOut = true;
        if (!hasCheckIn && !hasCheckOut) {
          if (sorted.length >= 2) { hasCheckIn = true; hasCheckOut = true; } else { hasCheckIn = true; } 
        }
        if (hasCheckIn && hasCheckOut) status = 'Present';
        else if (hasCheckIn || hasCheckOut) status = 'Half Day';

        return status;
      };

      const reportData: FacultyReport[] = [];
      let totalAttPercentageSum = 0;
      let totalPresentSum = 0;
      let totalAbsentSum = 0;
      let validStaffCount = 0;

      const attDist = {
        'Excellent': 0, // > 90%
        'Good': 0, // 80 - 90%
        'Satisfactory': 0, // 60 - 80%
        'Improvement': 0 // < 60%
      };

      let overallPresent = 0;
      let overallAbsent = 0;

      filteredStaffList.forEach(staff => {
        const monthsData: Record<string, MonthData> = {};
        monthsArr.forEach(m => {
          monthsData[m] = { monthName: m, workDays: 0, present: 0, late: 0, half: 0, absent: 0, leave: 0, percentage: '0%' };
        });
        
        const overallData: MonthData = { monthName: 'OVERALL SUMMARY', workDays: 0, present: 0, late: 0, half: 0, absent: 0, leave: 0, percentage: '0%' };

        datesInRange.forEach(dateStr => {
          const dObj = new Date(dateStr);
          const monthKey = dObj.toLocaleString('default', { month: 'long', year: 'numeric' });
          const isSunday = dObj.getDay() === 0;
          if (!isSunday) {
            monthsData[monthKey].workDays++;
            overallData.workDays++;

            const dayStatus = computeStatus(staff, dateStr);

            if (dayStatus === 'Leave') {
              monthsData[monthKey].leave++;
              overallData.leave++;
            } else if (dayStatus === 'Present') {
              monthsData[monthKey].present++;
              overallData.present++;
            } else if (dayStatus === 'Late') {
              monthsData[monthKey].late++;
              overallData.late++;
            } else if (dayStatus === 'Half Day') {
              monthsData[monthKey].half++;
              overallData.half++;
            } else if (dayStatus === 'Absent') {
              monthsData[monthKey].absent++;
              overallData.absent++;
            } else {
              monthsData[monthKey].present++;
              overallData.present++;
            }
          }
        });

        // Calculate %
        monthsArr.forEach(m => {
          const md = monthsData[m];
          const totalWorking = md.workDays - md.leave; // leaves don't count against working days usually, or they do? Let's assume % = (present + late + 0.5*half) / workdays
          const score = md.present + md.late + (md.half * 0.5);
          md.percentage = md.workDays > 0 ? Math.round((score / md.workDays) * 100) + '%' : '0%';
        });

        const oScore = overallData.present + overallData.late + (overallData.half * 0.5);
        const oPerc = overallData.workDays > 0 ? (oScore / overallData.workDays) * 100 : 0;
        overallData.percentage = overallData.workDays > 0 ? Math.round(oPerc) + '%' : '0%';

        reportData.push({
          id: staff.id,
          name: staff.name,
          empId: staff.biometric_employee_code || staff.id,
          role: staff.designation || 'Staff',
          department: staff.department || 'Other',
          months: monthsData,
          overall: overallData
        });

        if (overallData.workDays > 0) {
          validStaffCount++;
          totalAttPercentageSum += oPerc;
          totalPresentSum += overallData.present;
          totalAbsentSum += overallData.absent;

          if (oPerc >= 90) attDist['Excellent']++;
          else if (oPerc >= 80) attDist['Good']++;
          else if (oPerc >= 60) attDist['Satisfactory']++;
          else attDist['Improvement']++;

          overallPresent += overallData.present;
          overallAbsent += overallData.absent;
        }
      });

      setFacultyReports(reportData);
      
      setKpis({
        totalFaculty: filteredStaffList.length,
        avgAttendance: validStaffCount > 0 ? (totalAttPercentageSum / validStaffCount).toFixed(1) + '%' : '0%',
        avgPresentDays: validStaffCount > 0 ? (totalPresentSum / validStaffCount).toFixed(1) : '0',
        avgAbsentDays: validStaffCount > 0 ? (totalAbsentSum / validStaffCount).toFixed(1) : '0'
      });

      setBarData([
        { name: 'Excellent', count: attDist['Excellent'] },
        { name: 'Good', count: attDist['Good'] },
        { name: 'Satisfactory', count: attDist['Satisfactory'] },
        { name: 'Improvement', count: attDist['Improvement'] },
      ]);

      setPieData([
        { name: 'Present', value: overallPresent, color: '#10B981' },
        { name: 'Absent', value: overallAbsent, color: '#EF4444' }
      ]);

    } catch (e) {
      console.error(e);
      alert('Error generating report');
    }
  };

  const formatTime12h = (time24: string | null) => {
    if (!time24) return '--';
    const [h, m] = time24.split(':');
    if (!h || !m) return '--';
    const hours = parseInt(h, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const hours12 = ((hours + 11) % 12 + 1).toString().padStart(2, '0');
    return `${hours12}:${m} ${suffix}`;
  };

  const handleExport = () => {
    if (startDate === endDate) {
      // Daily Export
      const aoa: any[][] = [];
      aoa.push(['Faculty Name', 'Biometric Code/ID', 'Department', 'Check In', 'Check Out', 'Status', 'Notes']);
      
      filteredStaff.forEach(staff => {
        const d = getStaffDailyData(staff);
        const inDisp = formatTime12h(d.in);
        const outDisp = formatTime12h(d.out);
        
        const notes = [];
        if (d.in) {
          notes.push(`Checked in via ETimeOffice${d.isLate ? ': Checked in after late cutoff' : ''}`);
        }
        if (d.out) {
          notes.push(`Checked out via ETimeOffice${d.isEarly ? ': Checked out early' : ''}`);
        }

        aoa.push([
          staff.name,
          staff.biometric_employee_code || (staff as any).emp_id || staff.id || '',
          staff.department || 'General Staff',
          inDisp,
          outDisp,
          d.status,
          notes.join(' | ')
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      downloadSheet(ws, "Daily Attendance", `Staff_Daily_Attendance_${startDate}.xlsx`, true);
    } else {
      // Monthly/Range Export
      const aoa: any[][] = [];
      
      // Header Row 1
      const header1 = ['Faculty Name', 'Biometric Code/ID', 'Department'];
      monthsPresent.forEach(m => {
        header1.push(m);
        header1.push('', '', '', '', '');
      });
      header1.push('Overall');
      header1.push('', '', '', '', '');
      aoa.push(header1);

      // Header Row 2
      const header2 = ['', '', ''];
      monthsPresent.forEach(() => {
        header2.push('Working Days', 'Present', 'Late', 'Half Day', 'Absent', 'Attendance %');
      });
      header2.push('Working Days', 'Present', 'Late', 'Half Day', 'Absent', 'Attendance %');
      aoa.push(header2);

      // Data Rows
      const numOrBlank = (num: number) => num === 0 ? '' : num;

      facultyReports.forEach(r => {
        const row: any[] = [
          r.name,
          r.empId,
          r.role
        ];
        monthsPresent.forEach(m => {
          row.push(
            numOrBlank(r.months[m].workDays), 
            numOrBlank(r.months[m].present), 
            numOrBlank(r.months[m].late), 
            numOrBlank(r.months[m].half), 
            numOrBlank(r.months[m].absent), 
            r.months[m].percentage
          );
        });
        row.push(
          numOrBlank(r.overall.workDays), 
          numOrBlank(r.overall.present), 
          numOrBlank(r.overall.late), 
          numOrBlank(r.overall.half), 
          numOrBlank(r.overall.absent), 
          r.overall.percentage
        );
        aoa.push(row);
      });

      const ws = XLSX.utils.aoa_to_sheet(aoa);
      
      ws['!merges'] = [];
      // Vertical merges for first 3 columns
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } });
      ws['!merges'].push({ s: { r: 0, c: 1 }, e: { r: 1, c: 1 } });
      ws['!merges'].push({ s: { r: 0, c: 2 }, e: { r: 1, c: 2 } });

      // Horizontal merges for months and overall
      let colIdx = 3;
      monthsPresent.forEach(() => {
        ws['!merges']!.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + 5 } });
        colIdx += 6;
      });
      ws['!merges']!.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + 5 } });
      
      // Apply styles
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = { c: C, r: R };
          const cellRef = XLSX.utils.encode_cell(cellAddress);
          if (!ws[cellRef]) continue;
          
          if (R === 0 || R === 1) {
            // Header styling
            ws[cellRef].s = {
              font: { bold: true },
              alignment: { horizontal: "center", vertical: "center" }
            };
          } else {
            // Data styling
            if (C >= 3) {
              // Center align numbers and percentages
              ws[cellRef].s = {
                alignment: { horizontal: "center" }
              };
            }
          }
        }
      }

      // Column widths
      ws['!cols'] = [
        { wch: 20 }, // Faculty Name
        { wch: 18 }, // Biometric Code/ID
        { wch: 15 }, // Department
      ];
      
      downloadSheet(ws, "Attendance Summary", `Staff_Attendance_Summary_${startDate}_to_${endDate}.xlsx`, true);
    }
  };

  const getStaffDailyData = (staff: StaffMember, targetDate: string = startDate) => {
    // manual
    const manualStatus = dailyAttendanceMap[targetDate]?.[staff.id];
    // leaves
    const hasLeave = leaveRequests?.some((l: any) => 
      String(l.user_id || l.staffId) === String(staff.id) && l.status === 'Approved' && targetDate >= (l.start_date || l.from) && targetDate <= (l.end_date || l.to)
    );
    if (hasLeave) return { in: null, out: null, hours: null, status: 'Leave' };
    if (manualStatus) {
      return { in: null, out: null, hours: null, status: manualStatus };
    }

    let mode = 'biometric';
    try { mode = localStorage.getItem('kts_staff_attendance_mode') || 'biometric'; } catch(e) {}
    if (mode === 'manual') {
      return { in: null, out: null, hours: null, status: 'Present' };
    }

    // biometric & local punches
    const punches: string[] = [];
    
    dailyLocalPunches.forEach(p => {
      if (String(p.staffId) === String(staff.id) && p.timestamp.startsWith(targetDate)) punches.push(p.timestamp);
    });

    const normalizeName = (name: string) => (name||'').toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const staffBioCode = String(staff.biometric_employee_code || staff.id).toLowerCase().trim();
    const staffNameNorm = normalizeName(staff.name);

    dailyBiometricLogs.forEach(l => {
      const eCode = String(l.employee_code || l.Empcode || '').toLowerCase().trim();
      const lName = normalizeName(l.raw_data?.name || l.raw_data?.Name || '');
      let logDate = l.scan_datetime ? l.scan_datetime.substring(0, 10) : '';
      if (!logDate && l.raw_data?.in_time) logDate = targetDate;
      
      if (logDate === targetDate || l.scan_datetime?.startsWith(targetDate) || (l.raw_data?.in_time && l.PunchDate?.startsWith(targetDate))) {
          if (eCode === staffBioCode || (lName && lName === staffNameNorm)) {
            if (l.scan_datetime) punches.push(l.scan_datetime);
            else if (l.raw_data?.in_time) punches.push(`${targetDate} ${l.raw_data.in_time}:00`);
            else if (l.raw_data?.out_time) punches.push(`${targetDate} ${l.raw_data.out_time}:00`);
          }
      }
    });

    if (punches.length === 0) return { in: null, out: null, hours: null, status: 'Absent' };

    const sorted = [...new Set(punches)].sort();
    const inTimeStr = sorted[0].split(' ')[1]?.substring(0, 5) || null;
    const outTimeStr = sorted.length > 1 ? sorted[sorted.length - 1].split(' ')[1]?.substring(0, 5) : null;

    let status = 'Absent';
    let hasCheckIn = false;
    let hasCheckOut = false;
    if (inTimeStr && inTimeStr <= (settings.lateEntryCutoff + ':59')) hasCheckIn = true;
    if (outTimeStr && outTimeStr >= (settings.earlyEntryCutoff + ':00')) hasCheckOut = true;
    if (!hasCheckIn && !hasCheckOut) {
      if (sorted.length >= 2) { hasCheckIn = true; hasCheckOut = true; } else { hasCheckIn = true; } 
    }
    if (hasCheckIn && hasCheckOut) status = 'Present';
    else if (hasCheckIn || hasCheckOut) status = 'Half Day';

    let hours = null;
    if (inTimeStr && outTimeStr) {
      const [ih, im] = inTimeStr.split(':').map(Number);
      const [oh, om] = outTimeStr.split(':').map(Number);
      const diff = (oh * 60 + om) - (ih * 60 + im);
      if (diff > 0) {
        hours = `${Math.floor(diff / 60).toString().padStart(2, '0')}:${(diff % 60).toString().padStart(2, '0')}`;
      }
    }

    return {
      in: inTimeStr,
      out: outTimeStr,
      hours,
      status,
      isLate: inTimeStr ? inTimeStr > settings.presentCutoffMorning : false,
      isEarly: outTimeStr ? outTimeStr < settings.presentCutoffEvening : false
    };
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg)] space-y-4 pb-12 print-only-container">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[20px] font-bold text-[var(--tx)] flex items-center gap-2">
          Faculty Attendance Analysis Report
        </h1>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-[var(--teal-bg)] text-[var(--teal-tx)] font-semibold rounded-md text-[13px] hover:brightness-95 transition-all">
          <TrendingUp size={15} /> Performance Insights
        </button>
      </div>

      {/* Top Filter Bar */}
      <Card>
        <div className="p-4 flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-semibold text-[var(--tx3)] uppercase tracking-wider mb-1">Department</label>
            <select
              value={department}
              onChange={e => setDepartment(e.target.value)}
              className="w-full bg-[var(--surf1)] border border-[var(--bd)] rounded-md px-3 py-2 text-[13px] text-[var(--tx)]"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-semibold text-[var(--tx3)] uppercase tracking-wider mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-[var(--surf1)] border border-[var(--bd)] rounded-md px-3 py-2 text-[13px] text-[var(--tx)]"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-semibold text-[var(--tx3)] uppercase tracking-wider mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-[var(--surf1)] border border-[var(--bd)] rounded-md px-3 py-2 text-[13px] text-[var(--tx)]"
            />
          </div>
          <button 
            onClick={generateReport}
            className="h-[38px] px-6 bg-[#6366F1] text-white rounded-md text-[13px] font-semibold flex items-center gap-2 hover:bg-[#4F46E5] transition-colors"
          >
            <Filter size={15} /> Generate
          </button>
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl overflow-hidden border-l-4 border-[#3B82F6]">
          <KPICard
            label="TOTAL FACULTY"
            value={kpis.totalFaculty}
            icon={<Users size={16} />}
            iconBg="var(--blue-bg)"
            iconColor="var(--blue-tx)"
          />
        </div>
        <div className="rounded-xl overflow-hidden border-l-4 border-[#10B981]">
          <KPICard
            label="AVG. ATTENDANCE"
            value={kpis.avgAttendance}
            icon={<TrendingUp size={16} />}
            iconBg="var(--teal-bg)"
            iconColor="var(--teal-tx)"
          />
        </div>
        <div className="rounded-xl overflow-hidden border-l-4 border-[#06B6D4]">
          <KPICard
            label="AVG. PRESENT DAYS"
            value={kpis.avgPresentDays}
            icon={<CheckCircle2 size={16} />}
            iconBg="var(--surf2)"
            iconColor="var(--tx2)"
          />
        </div>
        <div className="rounded-xl overflow-hidden border-l-4 border-[#EF4444]">
          <KPICard
            label="AVG. ABSENT DAYS"
            value={kpis.avgAbsentDays}
            icon={<XCircle size={16} />}
            iconBg="var(--red-bg)"
            iconColor="var(--red-tx)"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-[14px] font-bold text-[#3B82F6] mb-4">Attendance Distribution (Faculty)</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--b)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--tx3)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--tx3)' }} />
                <RechartsTooltip
                  cursor={{ fill: 'var(--surf2)' }}
                  contentStyle={{ backgroundColor: 'var(--surf)', border: '0.5px solid var(--b2)', borderRadius: 8, fontSize: 11, color: 'var(--tx)' }}
                  itemStyle={{ color: 'var(--tx)' }}
                />
                <Bar dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card className="p-4">
          <h3 className="text-[14px] font-bold text-[#3B82F6] mb-4">Overall Status Breakdown</h3>
          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'var(--surf)', border: '0.5px solid var(--b2)', borderRadius: 8, fontSize: 11, color: 'var(--tx)' }}
                  itemStyle={{ color: 'var(--tx)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Detailed Attendance Data Table */}
      <Card>
        <div className="p-4 flex items-center justify-between border-b border-[var(--b)]">
          <h3 className="text-[14px] font-bold text-[#3B82F6]">Detailed Attendance Data {startDate === endDate ? `(${formatDate(startDate)})` : ''}</h3>
          <div className="flex gap-2">
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--teal)] text-white rounded-lg text-[12px] font-medium hover:opacity-90 transition-opacity no-print">
              <Download size={14} /> Export Excel
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surf2)] border border-[var(--b)] text-[var(--tx)] rounded-lg text-[12px] font-medium hover:bg-[var(--surf3)] transition-colors no-print">
              <Printer size={14} /> Print
            </button>
          </div>
        </div>

        {startDate === endDate ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px] min-w-[850px]">
              <thead>
                <tr>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Staff Member</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Category & Department</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Check-In</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Check-Out</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Working Hours</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => {
                  const d = getStaffDailyData(staff);
                  const inDisp = d.in || '--:--';
                  const outDisp = d.out || '--:--';
                  return (
                    <tr key={staff.id} className="hover:bg-[var(--surf2)] transition-colors group">
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2 text-[var(--blue-tx)] font-medium">
                          <Avatar initials={staff.name.substring(0, 2).toUpperCase()} bg="var(--blue-bg)" color="var(--blue-tx)" />
                          <div>
                            <div>{staff.name}</div>
                            <div className="text-[10px] text-[var(--tx3)] font-normal">{staff.designation || 'Staff'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-[var(--tx2)]">
                        <div className="font-medium">{staff.category || 'Teaching'}</div>
                        <div className="text-[10px] text-[var(--tx3)] font-normal">{staff.department || 'Other'}</div>
                      </td>
                      <td className="px-2 py-2 text-center text-[var(--teal-tx)] font-medium">
                        {inDisp}
                        {d.isLate && <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-[var(--amber-bg)] text-[var(--amber-tx)] rounded font-medium">Late</span>}
                      </td>
                      <td className="px-2 py-2 text-center text-[var(--red-tx)] font-medium">
                        {outDisp}
                        {d.isEarly && <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-[var(--amber-bg)] text-[var(--amber-tx)] rounded font-medium">Early</span>}
                      </td>
                      <td className="px-2 py-2 font-medium text-[var(--tx)] text-center">
                        {d.hours || '--:--'}
                      </td>
                      <td className="px-2 py-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-medium ${
                          d.status === 'Present' ? 'bg-[var(--teal-bg)]/50 text-[var(--teal-tx)]' :
                          d.status === 'Absent' ? 'bg-[var(--red-bg)]/50 text-[var(--red-tx)]' :
                          d.status === 'Half Day' ? 'bg-[var(--amber-bg)]/50 text-[var(--amber-tx)]' :
                          'bg-[var(--purple-bg)]/50 text-[var(--purple-tx)]'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 px-2 text-center text-[var(--tx3)]">No staff members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px] min-w-[1000px]">
              <thead>
                <tr>
                  <th colSpan={2} className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-r border-[var(--b)] whitespace-nowrap">Faculty Info</th>
                  {monthsPresent.map(m => (
                    <th key={m} colSpan={7} className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-r border-[var(--b)] whitespace-nowrap">{m}</th>
                  ))}
                  <th colSpan={7} className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Overall Summary</th>
                </tr>
                <tr>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Name</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-left px-2 py-2 border-b border-r border-[var(--b)] whitespace-nowrap">Bio/Emp ID</th>
                  
                  {monthsPresent.map(m => (
                    <React.Fragment key={m + '_cols'}>
                      <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Work</th>
                      <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Present</th>
                      <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Late</th>
                      <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Half</th>
                      <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Absent</th>
                      <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Leave</th>
                      <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-r border-[var(--b)] whitespace-nowrap">%</th>
                    </React.Fragment>
                  ))}
                  
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Working</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Present</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Late</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Half</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Absent</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">Leave</th>
                  <th className="text-[10.5px] font-medium text-[var(--tx3)] text-center px-2 py-2 border-b border-[var(--b)] whitespace-nowrap">%</th>
                </tr>
              </thead>
              <tbody>
                {facultyReports.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--surf2)] transition-colors group">
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-2 text-[var(--blue-tx)] font-medium">
                        <Avatar initials={row.name.substring(0, 2).toUpperCase()} bg="var(--blue-bg)" color="var(--blue-tx)" />
                        <div>
                          <div>{row.name}</div>
                          <div className="text-[10px] text-[var(--tx3)] font-normal">{row.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-[var(--tx2)] font-medium border-r border-[var(--b)]">{row.empId}</td>
                    
                    {monthsPresent.map(m => (
                      <React.Fragment key={m + '_data'}>
                        <td className="px-2 py-2 text-center text-[var(--tx)]">{row.months[m].workDays}</td>
                        <td className="px-2 py-2 text-center font-medium" style={{ color: 'var(--teal)' }}>{row.months[m].present}</td>
                        <td className="px-2 py-2 text-center font-medium" style={{ color: 'var(--amber)' }}>{row.months[m].late}</td>
                        <td className="px-2 py-2 text-center font-medium" style={{ color: 'var(--blue)' }}>{row.months[m].half}</td>
                        <td className="px-2 py-2 text-center font-medium" style={{ color: 'var(--red)' }}>{row.months[m].absent}</td>
                        <td className="px-2 py-2 text-center font-medium" style={{ color: 'var(--purple)' }}>{row.months[m].leave}</td>
                        <td className="px-2 py-2 text-center font-medium text-[var(--tx)] border-r border-[var(--b)]">{row.months[m].percentage}</td>
                      </React.Fragment>
                    ))}
                    
                    <td className="px-2 py-2 text-center text-[var(--tx)]">{row.overall.workDays}</td>
                    <td className="px-2 py-2 text-center font-medium" style={{ color: 'var(--teal)' }}>{row.overall.present}</td>
                    <td className="px-2 py-2 text-center font-medium" style={{ color: 'var(--amber)' }}>{row.overall.late}</td>
                    <td className="px-2 py-2 text-center font-medium" style={{ color: 'var(--blue)' }}>{row.overall.half}</td>
                    <td className="px-2 py-2 text-center font-medium" style={{ color: 'var(--red)' }}>{row.overall.absent}</td>
                    <td className="px-2 py-2 text-center font-medium" style={{ color: 'var(--purple)' }}>{row.overall.leave}</td>
                    <td className="px-2 py-2 text-center font-medium text-[var(--tx)]">{row.overall.percentage}</td>
                  </tr>
                ))}
                
                {facultyReports.length === 0 && (
                  <tr>
                    <td colSpan={100} className="py-8 px-2 text-center text-[var(--tx3)]">No attendance data found for the selected period.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
