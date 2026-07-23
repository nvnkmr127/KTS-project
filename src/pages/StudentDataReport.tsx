import React, { useState, useMemo } from 'react';
import { Download, Search, Users, UserCheck } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { Card } from '../components/Card';
import * as XLSX from 'xlsx-js-style';

interface StudentDataReportProps {
  students: any[];
  studentFees: any[];
}

export function StudentDataReport({ students, studentFees }: StudentDataReportProps) {
  const [search, setSearch] = useState('');
  const [academicYearFilter, setAcademicYearFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const processedData = useMemo(() => {
    return students.map(student => {
      const fees = studentFees.filter(f => f.student_id === student.id);
      const totalFee = fees.reduce((sum, f) => sum + (Number(f.total_amount) || 0), 0);
      const feePaid = fees.reduce((sum, f) => sum + (Number(f.paid_amount) || 0), 0);
      const feeDue = totalFee - feePaid;

      let formattedDob = student.dob || '';
      let calculatedAge = '-';
      
      if (formattedDob) {
        const d = new Date(formattedDob);
        if (!isNaN(d.getTime())) {
          formattedDob = `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
          
          const now = new Date();
          let years = now.getFullYear() - d.getFullYear();
          let months = now.getMonth() - d.getMonth();
          if (months < 0) {
            years--;
            months += 12;
          }
          if (now.getDate() < d.getDate()) {
            months--;
            if (months < 0) {
              years--;
              months += 12;
            }
          }
          if (years === 0 && months === 0) calculatedAge = '0 Months';
          else {
            let res = [];
            if (years > 0) res.push(`${years} Years`);
            if (months > 0) res.push(`${months} Months`);
            calculatedAge = res.join(', ') || '0 Months';
          }
        }
      }

      let rawAdmDate = String(student.admissionDate || student.admission_date || '');
      const dateMatch = rawAdmDate.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);
      if (dateMatch) {
        rawAdmDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
      } else if (rawAdmDate.length > 10 && rawAdmDate.includes('T')) {
        rawAdmDate = rawAdmDate.split('T')[0];
      }

      return {
        ...student,
        roll: student.roll || student.enrollment_number,
        parent: student.parent || student.father_name,
        phone: student.phone || student.student_mobile || student.father_mobile,
        address: student.address || student.village,
        status: (student.status === 'active' || student.status === 'Active') ? 'Active' : (student.status === 'left' || student.status === 'dropout' || student.status === 'Left') ? 'Left' : (student.status === 'transfer' || student.status === 'transferred' || student.status === 'Transferred') ? 'Transferred' : 'Active',
        admissionDate: rawAdmDate,
        displayDob: formattedDob,
        age: calculatedAge,
        totalFee,
        feePaid,
        feeDue,
        batchName: (typeof student.batch?.academic_year === 'object' ? student.batch?.academic_year?.name : student.batch?.academic_year) || student.academicYearName || '-',
      };
    });
  }, [students, studentFees]);

  // Filters
  const academicYears = ['All', ...Array.from(new Set(processedData.map(s => s.batchName))).filter(Boolean)];
  const classes = ['All', ...Array.from(new Set(processedData.map(s => s.class))).filter(Boolean)];

  const filteredData = useMemo(() => {
    return processedData.filter(student => {
      const matchSearch = search ?
        student.name?.toLowerCase().includes(search.toLowerCase()) ||
        student.roll?.toLowerCase().includes(search.toLowerCase()) ||
        student.parent?.toLowerCase().includes(search.toLowerCase()) : true;
      const matchYear = academicYearFilter === 'All' || student.batchName === academicYearFilter;
      const matchClass = classFilter === 'All' || student.class === classFilter;
      const matchStatus = statusFilter === 'All' || student.status === statusFilter;
      return matchSearch && matchYear && matchClass && matchStatus;
    });
  }, [processedData, search, academicYearFilter, classFilter, statusFilter]);

  // KPIs
  const totalStudents = filteredData.length;
  const boys = filteredData.filter(s => s.gender === 'Male').length;
  const girls = filteredData.filter(s => s.gender === 'Female').length;
  const active = filteredData.filter(s => s.status === 'Active').length;

  const exportExcel = () => {
    const wsData = [
      ['Admission No', 'Name', 'PEN NO', 'Gender', 'DOB', 'Age', 'Father Name', 'Parent Mobile', 'Village/Address', 'Class', 'Batch', 'Total Fee', 'Paid Fee', 'Outstanding Fee', 'Admission Date', 'Status']
    ];

    filteredData.forEach(s => {
      wsData.push([
        s.roll || '-',
        s.name || '-',
        s.student_pen_no || '-',
        s.gender || '-',
        s.displayDob || '-',
        s.age || '-', // Age
        s.father_name || s.parent || '-',
        s.father_mobile || s.phone || '-',
        s.address || '-',
        s.class || '-',
        s.batchName || '-',
        s.totalFee || 0,
        s.feePaid || 0,
        s.feeDue || 0,
        s.admissionDate || '-',
        s.status || '-'
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const headerStyle = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'FFFFFF00' } },
      border: {
        top: { style: 'thin', color: { auto: 1 } },
        right: { style: 'thin', color: { auto: 1 } },
        bottom: { style: 'thin', color: { auto: 1 } },
        left: { style: 'thin', color: { auto: 1 } }
      }
    };

    for (let i = 0; i < wsData[0].length; i++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c: i });
      if (ws[cellRef]) ws[cellRef].s = headerStyle;
    }

    XLSX.utils.book_append_sheet(wb, ws, "Student Data");
    XLSX.writeFile(wb, "Student_Data_Report.xlsx");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <KPICard label="Total Student" value={totalStudents} icon={<Users size={15} />} iconBg="var(--blue-bg)" iconColor="var(--blue-tx)" />
        <KPICard label="Boys" value={boys} icon={<Users size={15} />} iconBg="var(--indigo-bg)" iconColor="var(--indigo-tx)" />
        <KPICard label="Girls" value={girls} icon={<Users size={15} />} iconBg="var(--pink-bg)" iconColor="var(--pink-tx)" />
        <KPICard label="Active" value={active} icon={<UserCheck size={15} />} iconBg="var(--green-bg)" iconColor="var(--green-tx)" />
      </div>

      <Card>
        <div className="p-4 border-b border-[var(--b)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-[16px] font-semibold text-[var(--tx)]">Student Data Report</h2>
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--teal)] text-white text-[13px] font-medium rounded-md hover:brightness-110 transition-all"
          >
            <Download size={14} />
            Export Excel
          </button>
        </div>

        <div className="p-4 border-b border-[var(--b)] grid grid-cols-1 sm:grid-cols-12 gap-3 bg-[var(--surf)]">
          <div className="col-span-12 sm:col-span-6 flex items-center h-9 px-3 rounded-md bg-[var(--bg)] border border-[var(--b)] focus-within:border-[var(--blue)] focus-within:ring-1 focus-within:ring-[var(--blue)] transition-all">
            <Search size={14} className="text-[var(--tx3)] mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by name, admission no, parent..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-[13px] text-[var(--tx)] placeholder:text-[var(--tx3)] min-w-0"
            />
          </div>

          <div className="col-span-12 sm:col-span-2">
            <select
              value={academicYearFilter}
              onChange={(e) => setAcademicYearFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-[var(--bg)] border border-[var(--b)] text-[13px] text-[var(--tx)] outline-none focus:border-[var(--blue)] transition-colors appearance-none"
            >
              {academicYears.map(y => <option key={y} value={y}>{y === 'All' ? 'All Academic Years' : y}</option>)}
            </select>
          </div>

          <div className="col-span-12 sm:col-span-2">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-[var(--bg)] border border-[var(--b)] text-[13px] text-[var(--tx)] outline-none focus:border-[var(--blue)] transition-colors appearance-none"
            >
              {classes.map(c => <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>)}
            </select>
          </div>

          <div className="col-span-12 sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-[var(--bg)] border border-[var(--b)] text-[13px] text-[var(--tx)] outline-none focus:border-[var(--blue)] transition-colors appearance-none"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Transferred">Transferred</option>
              <option value="Left">Left</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-[var(--surf)] border-b border-[var(--b)]">
                <th className="py-3 px-4 text-[12px] font-semibold text-[var(--tx2)] whitespace-nowrap">Adm No</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[var(--tx2)] whitespace-nowrap">Name</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[var(--tx2)] whitespace-nowrap">PEN No</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[var(--tx2)] whitespace-nowrap">Adm Date</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[var(--tx2)] whitespace-nowrap">DOB</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[var(--tx2)] whitespace-nowrap">Father Name</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[var(--tx2)] whitespace-nowrap">Mother Name</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[var(--tx2)] whitespace-nowrap">Parent Mobile</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[var(--tx2)] whitespace-nowrap">Address</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[var(--tx2)] whitespace-nowrap">Class</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[var(--tx2)] whitespace-nowrap">Batch</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[var(--tx2)] whitespace-nowrap">Total Fee</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[var(--tx2)] whitespace-nowrap">Fee Paid</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[var(--tx2)] whitespace-nowrap">Fee Due</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[var(--tx2)] whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--b)]">
              {filteredData.map(student => (
                <tr key={student.id} className="hover:bg-[var(--surf)] transition-colors">
                  <td className="py-3 px-4 text-[13px] text-[var(--tx)] whitespace-nowrap">{student.roll || '-'}</td>
                  <td className="py-3 px-4 text-[13px] text-[var(--tx)] whitespace-nowrap font-medium">{student.name || '-'}</td>
                  <td className="py-3 px-4 text-[13px] text-[var(--tx)] whitespace-nowrap">{student.student_pen_no || '-'}</td>
                  <td className="py-3 px-4 text-[13px] text-[var(--tx)] whitespace-nowrap">{student.admissionDate || '-'}</td>
                  <td className="py-3 px-4 text-[13px] text-[var(--tx)] whitespace-nowrap">{student.displayDob || '-'}</td>
                  <td className="py-3 px-4 text-[13px] text-[var(--tx)] whitespace-nowrap">{student.father_name || student.parent || '-'}</td>
                  <td className="py-3 px-4 text-[13px] text-[var(--tx)] whitespace-nowrap">{student.mother_name || '-'}</td>
                  <td className="py-3 px-4 text-[13px] text-[var(--tx)] whitespace-nowrap">{student.father_mobile || student.phone || '-'}</td>
                  <td className="py-3 px-4 text-[13px] text-[var(--tx)] max-w-[150px] truncate" title={student.address}>{student.address || '-'}</td>
                  <td className="py-3 px-4 text-[13px] text-[var(--tx)] whitespace-nowrap">{student.class || '-'}</td>
                  <td className="py-3 px-4 text-[13px] text-[var(--tx)] whitespace-nowrap">{student.batchName || '-'}</td>
                  <td className="py-3 px-4 text-[13px] text-[var(--tx)] whitespace-nowrap">₹{student.totalFee?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4 text-[13px] text-emerald-600 font-medium whitespace-nowrap">₹{student.feePaid?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4 text-[13px] text-rose-600 font-medium whitespace-nowrap">₹{student.feeDue?.toLocaleString() || 0}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${student.status === 'Active' ? 'bg-emerald-100 text-emerald-700' :
                      student.status === 'Left' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                      {student.status || '-'}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={15} className="py-8 text-center text-[13px] text-[var(--tx3)]">
                    No students found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
