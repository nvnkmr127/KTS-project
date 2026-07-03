const fs = require('fs');
let code = fs.readFileSync('src/pages/Attendance.tsx', 'utf8');

const fallbackSearch = `} else {
            percentage = 90 + (Number(cId) % 3) * 3;
          }`;
const fallbackReplace = `} else {
            percentage = 0;
          }`;
code = code.replace(fallbackSearch, fallbackReplace);

const cardsSearchStart = `  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)] pb-10">
      {/* Top Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard
          label="Present Today"
          value="258"`;

const cardsSearchEnd = `        <KPICard
          label="Low Attendance"
          value="8"
          sub="Below 75% this month"
          icon={<AlertTriangle size={15} />}
          iconBg="var(--amber-bg)"
          iconColor="var(--amber-tx)"
        />
      </div>`;

const newKpiBlock = `  const totalSchoolStudents = students.length;
  let totalPresent = 0;
  let totalAbsent = 0;

  students.forEach(student => {
    const studentAtt = todayAttendance.filter(
      (att: any) => String(att.student_id) === String(student.id)
    );
    if (studentAtt.length > 0) {
      const hasPresent = studentAtt.some(att => ['present', 'late'].includes(att.status));
      if (hasPresent) {
        totalPresent++;
      } else {
        const hasAbsent = studentAtt.some(att => att.status === 'absent');
        if (hasAbsent) {
          totalAbsent++;
        }
      }
    }
  });

  const presentPercentage = totalSchoolStudents > 0 
    ? Math.round((totalPresent / totalSchoolStudents) * 100) 
    : 0;
    
  const currentMonthName = monthNames[new Date().getMonth()];
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex-1 overflow-y-auto p-3.5 bg-[var(--bg)] pb-10">
      {/* Top Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KPICard
          label="Present Today"
          value={totalPresent}
          sub={\`Out of \${totalSchoolStudents}\`}
          icon={<CheckCircle size={15} />}
          iconBg="var(--teal-bg)"
          iconColor="var(--teal-tx)"
        />
        <KPICard
          label="Absent Today"
          value={totalAbsent}
          sub="Alerts sent via WA+SMS"
          icon={<XCircle size={15} />}
          iconBg="var(--red-bg)"
          iconColor="var(--red-tx)"
        />
        <KPICard
          label="Today's Avg"
          value={<>{presentPercentage}<span className="text-[13px] font-normal text-[var(--tx3)]">%</span></>}
          sub={\`\${currentMonthName} \${currentYear}\`}
          icon={<BarChart2 size={15} />}
          iconBg="var(--blue-bg)"
          iconColor="var(--blue-tx)"
        />
        <KPICard
          label="Low Attendance"
          value="-"
          sub="Requires monthly data"
          icon={<AlertTriangle size={15} />}
          iconBg="var(--amber-bg)"
          iconColor="var(--amber-tx)"
        />
      </div>`;

const startIdx = code.indexOf(cardsSearchStart);
const endIdx = code.indexOf(cardsSearchEnd);

if (startIdx > -1 && endIdx > -1) {
    code = code.substring(0, startIdx) + newKpiBlock + code.substring(endIdx + cardsSearchEnd.length);
    fs.writeFileSync('src/pages/Attendance.tsx', code);
    console.log("Success");
} else {
    console.log("Failed to find boundaries", startIdx, endIdx);
}
