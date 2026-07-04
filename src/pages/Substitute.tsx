import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Users, Calendar, Clock, AlertCircle, X, Loader2, Check, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';

// Reusable Custom Date Picker Component
const CustomDatePicker = ({
  value,
  onChange,
  holidays
}: {
  value: string;
  onChange: (date: string) => void;
  holidays: Record<string, string>;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Parse initial date value
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewDate, setViewDate] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayYmd = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      setViewDate(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  const days = [];
  // Padding cells for previous month
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const handleDaySelect = (d: Date) => {
    const ymd = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    onChange(ymd);
    setIsOpen(false);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Select Date';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative w-full" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none hover:border-[var(--blue)] transition-colors text-left"
      >
        <span className="flex items-center gap-2">
          <Calendar size={13} className="text-[var(--blue-tx)]" />
          {formatDisplayDate(value)}
        </span>
        <span className="text-[var(--tx3)] text-[10px]">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 md:left-0 mt-1.5 w-72 bg-[var(--surf)] border border-[var(--b)] rounded-xl shadow-xl z-50 p-3.5 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-[var(--surf2)] rounded-lg text-[var(--tx2)] transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[12px] font-bold text-[var(--tx)]">
              {monthNames[month]} {year}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-[var(--surf2)] rounded-lg text-[var(--tx2)] transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-[var(--tx3)] mb-1">
            <span>Su</span>
            <span>Mo</span>
            <span>Tu</span>
            <span>We</span>
            <span>Th</span>
            <span>Fr</span>
            <span>Sa</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-7" />;
              }

              const dYmd = day.getFullYear() + '-' + String(day.getMonth() + 1).padStart(2, '0') + '-' + String(day.getDate()).padStart(2, '0');
              const isSelected = dYmd === value;
              const isToday = dYmd === todayYmd;

              // Disabling Rules:
              // 1. Sunday
              const isSunday = day.getDay() === 0;
              // 2. Past Date (Strictly before today)
              const isPast = dYmd < todayYmd;
              // 3. Holiday Check
              const holidayName = holidays[dYmd];
              const isHoliday = !!holidayName;

              const isDisabled = isSunday || isPast || isHoliday;

              let btnClass = "h-7 w-7 rounded-lg text-[10.5px] font-semibold transition-all relative flex items-center justify-center ";
              if (isDisabled) {
                btnClass += "text-[var(--tx3)]/30 cursor-not-allowed ";
                if (isHoliday) {
                  btnClass += "bg-[var(--red-bg)]/20 text-[var(--red-tx)]/50 line-through ";
                } else if (isSunday) {
                  btnClass += "bg-[var(--surf2)]/40 ";
                }
              } else if (isSelected) {
                btnClass += "bg-[var(--blue)] text-white shadow-md ";
              } else if (isToday) {
                btnClass += "bg-[var(--blue-bg)] text-[var(--blue-tx)] border border-[var(--blue-tx)]/20 ";
              } else {
                btnClass += "hover:bg-[var(--surf2)] text-[var(--tx)] cursor-pointer ";
              }

              return (
                <button
                  key={`day-${dYmd}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDaySelect(day)}
                  className={btnClass}
                  title={holidayName ? `Holiday: ${holidayName}` : undefined}
                >
                  {day.getDate()}
                  {isHoliday && (
                    <span className="absolute bottom-0.5 w-1 h-1 bg-[var(--red)] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="mt-3.5 pt-2 border-t border-[var(--b)] text-[9px] text-[var(--tx3)] flex flex-wrap gap-2">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[var(--red-bg)]/20 border border-[var(--red-tx)]/10 rounded-full inline-block" />
              Holiday
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[var(--surf2)]/80 rounded-full inline-block" />
              Sunday / Past
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Find next valid date if starting date falls on a Sunday or holiday
const findNextValidDate = (startDateStr: string, holidays: Record<string, string>) => {
  const current = new Date(startDateStr + 'T00:00:00');

  for (let i = 0; i < 30; i++) {
    const ymd = current.getFullYear() + '-' + String(current.getMonth() + 1).padStart(2, '0') + '-' + String(current.getDate()).padStart(2, '0');

    const isSunday = current.getDay() === 0;
    const isHoliday = !!holidays[ymd];

    if (!isSunday && !isHoliday) {
      return ymd;
    }

    current.setDate(current.getDate() + 1);
  }
  return startDateStr;
};

const Substitute = () => {
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [staffList, setStaffList] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [schedule, setSchedule] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [availableSubstitutes, setAvailableSubstitutes] = useState<any[]>([]);
  const [holidaysMap, setHolidaysMap] = useState<Record<string, string>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedPeriod, setSelectedPeriod] = useState<any>(null);
  const [selectedSubstitute, setSelectedSubstitute] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [loadingStaff, setLoadingStaff] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch staff list on mount
  useEffect(() => {
    async function fetchStaff() {
      setLoadingStaff(true);
      try {
        const data = await api.getSubstituteStaff();
        if (Array.isArray(data)) {
          setStaffList(data);
        }
      } catch (err) {
        console.error('Error fetching staff list:', err);
      } finally {
        setLoadingStaff(false);
      }
    }
    fetchStaff();
  }, []);

  // Fetch holidays on mount
  useEffect(() => {
    async function fetchHolidays() {
      try {
        const data = await api.getResources('holidays');
        if (Array.isArray(data)) {
          const map: Record<string, string> = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.forEach((h: any) => {
            if (h.date) {
              const ymd = h.date.slice(0, 10);
              map[ymd] = h.name || 'Holiday';
            }
          });
          setHolidaysMap(map);
        }
      } catch (err) {
        console.error('Error fetching holidays:', err);
      }
    }
    fetchHolidays();
  }, []);  // Auto-advance selectedDate if it lands on a Sunday or holiday
  useEffect(() => {
    if (selectedDate) {
      const validDate = findNextValidDate(selectedDate, holidaysMap);
      if (validDate !== selectedDate) {
        setSelectedDate(validDate);
      }
    }
  }, [selectedDate, holidaysMap]);

  // Fetch schedule when selectedStaff or selectedDate changes
  useEffect(() => {
    if (!selectedStaff || !selectedDate) {
      setSchedule([]);
      return;
    }

    async function fetchSchedule() {
      setLoadingSchedule(true);
      try {
        const data = await api.getSubstituteSchedule(selectedStaff, selectedDate);
        if (Array.isArray(data)) {
          setSchedule(data);
        } else {
          setSchedule([]);
        }
      } catch (err) {
        console.error('Error fetching schedule:', err);
        setSchedule([]);
      } finally {
        setLoadingSchedule(false);
      }
    }
    fetchSchedule();
  }, [selectedStaff, selectedDate]);

  // Fetch available substitutes when a period is selected and modal is opened
  useEffect(() => {
    if (!selectedPeriod || !isModalOpen || !selectedDate || !selectedStaff) {
      setAvailableSubstitutes([]);
      return;
    }

    async function fetchAvailable() {
      setLoadingAvailable(true);
      try {
        const data = await api.getAvailableSubstitutes(
          selectedPeriod.time_slot_id,
          selectedDate,
          selectedStaff
        );
        if (Array.isArray(data)) {
          setAvailableSubstitutes(data);
        } else {
          setAvailableSubstitutes([]);
        }
      } catch (err) {
        console.error('Error fetching available substitutes:', err);
        setAvailableSubstitutes([]);
      } finally {
        setLoadingAvailable(false);
      }
    }
    fetchAvailable();
  }, [selectedPeriod, isModalOpen, selectedDate, selectedStaff]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePeriodClick = (period: any) => {
    setSelectedPeriod(period);
    setSelectedSubstitute(period.substitute ? String(period.substitute.id) : '');
    setNotes(period.notes || '');
    setIsModalOpen(true);
    setErrorMsg('');
  };

  const handleAssign = async () => {
    if (!selectedSubstitute || !selectedPeriod) return;
    setAssigning(true);
    setErrorMsg('');
    try {
      await api.assignSubstitute({
        timetable_id: selectedPeriod.id,
        absent_user_id: selectedStaff,
        substitute_user_id: selectedSubstitute,
        date: selectedDate,
        notes: notes
      });

      // Refresh schedule
      const data = await api.getSubstituteSchedule(selectedStaff, selectedDate);
      if (Array.isArray(data)) {
        setSchedule(data);
      }

      setSuccessMsg('Substitute assigned successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setIsModalOpen(false);
      setSelectedPeriod(null);
      setSelectedSubstitute('');
      setNotes('');
    } catch (err) {
      console.error(err);
      setErrorMsg((err as Error).message || 'Failed to assign substitute.');
    } finally {
      setAssigning(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[var(--bg)]">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[var(--purple)] to-[#7c3aed] rounded-2xl p-4 mb-4 text-white relative overflow-hidden shadow-lg">
        <div className="absolute right-4 top-4 opacity-10">
          <Users size={64} />
        </div>
        <div className="relative z-10">
          <div className="text-[11px] font-medium opacity-70 uppercase tracking-wider mb-1">Administrative Portal</div>
          <div className="text-[18px] font-bold mb-1">Substitute Teacher Assignment</div>
          <div className="text-[12px] opacity-80">
            Reassign classes for absent teachers to available staff members for any specific date.
          </div>
        </div>
      </div>

      {/* Selector Card */}
      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-medium text-[var(--tx3)] uppercase mb-1.5 flex items-center gap-1">
              <Users size={11} /> Select Absent Staff Member
            </label>
            {loadingStaff ? (
              <div className="flex items-center gap-2 px-3 py-2 text-[12px] text-[var(--tx3)] bg-[var(--surf2)] rounded-lg">
                <Loader2 size={12} className="animate-spin text-[var(--blue-tx)]" />
                <span>Loading staff list...</span>
              </div>
            ) : (
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
              >
                <option value="">-- Choose Absent Teacher --</option>

                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} {staff.department ? `(${staff.department})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[var(--tx3)] uppercase mb-1.5 flex items-center gap-1">
              <Calendar size={11} /> Select Assignment Date
            </label>
            {/* Embedded Custom Calendar Date Picker */}
            <CustomDatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              holidays={holidaysMap}
            />
          </div>
        </div>
      </Card>

      {/* Success Banner */}
      {successMsg && (
        <div className="mb-4 p-3 bg-[var(--teal-bg)]/25 border border-[var(--teal-tx)]/15 rounded-xl flex items-center gap-2 text-[12px] text-[var(--teal-tx)] animate-pulse">
          <Check size={14} className="stroke-[3]" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Schedule Card */}
      {selectedStaff ? (
        <Card>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-[var(--b)]">
            <h3 className="text-[13px] font-bold text-[var(--tx)]">
              Daily Schedule: {formatDisplayDate(selectedDate)}
            </h3>
            {loadingSchedule && (
              <Loader2 size={14} className="animate-spin text-[var(--blue-tx)]" />
            )}
          </div>

          {loadingSchedule ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 size={24} className="animate-spin text-[var(--blue-tx)]" />
            </div>
          ) : schedule.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px] min-w-[500px]">
                <thead>
                  <tr className="border-b border-[var(--b)] text-[var(--tx3)]">
                    <th className="text-[10.5px] font-medium text-left px-3 py-2 w-28">Time / Period</th>
                    <th className="text-[10.5px] font-medium text-left px-3 py-2">Class / Batch</th>
                    <th className="text-[10.5px] font-medium text-left px-3 py-2">Subject</th>
                    <th className="text-[10.5px] font-medium text-left px-3 py-2 w-48">Status</th>
                    <th className="text-[10.5px] font-medium text-center px-3 py-2 w-40">Action</th>
                  </tr>
                </thead>
                <tbody>

                  {schedule.map((entry) => {
                    const hasSub = !!entry.substitute;
                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-[var(--b)] hover:bg-[var(--surf2)]/40 transition-colors last:border-0"
                      >
                        <td className="px-3 py-3 font-mono text-[11px] text-[var(--tx2)] flex items-center gap-1.5">
                          <Clock size={11} className="text-[var(--tx3)]" />
                          {entry.time_slot ? `${entry.time_slot.start_time.slice(0, 5)} - ${entry.time_slot.end_time.slice(0, 5)}` : `Period ${entry.time_slot_id}`}
                        </td>
                        <td className="px-3 py-3 font-semibold text-[var(--tx)]">Class {entry.batch?.name || 'N/A'}</td>
                        <td className="px-3 py-3 text-[var(--tx2)]">{entry.subject?.name || 'N/A'}</td>
                        <td className="px-3 py-3">
                          {hasSub ? (
                            <Badge variant="teal">Assigned: {entry.substitute.name}</Badge>
                          ) : (
                            <Badge variant="red">Needs Substitute</Badge>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => handlePeriodClick(entry)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 mx-auto ${hasSub
                              ? 'bg-[var(--surf2)] text-[var(--tx2)] border border-[var(--b)] hover:bg-[var(--surf3)]'
                              : 'bg-[var(--blue-bg)] text-[var(--blue-tx)] border border-[var(--blue-tx)]/10 hover:opacity-90'
                              }`}
                          >
                            <UserPlus size={11} />
                            {hasSub ? 'Change Staff' : 'Assign Staff'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-[var(--tx3)]">
              <AlertCircle size={32} className="mb-2 text-[var(--tx3)]/60" />
              <p className="text-[12px] font-medium">No classes scheduled for this teacher on this day.</p>
            </div>
          )}
        </Card>
      ) : (
        <Card className="py-12 flex flex-col items-center justify-center text-center text-[var(--tx3)]">
          <Users size={32} className="mb-2 text-[var(--tx3)]/50" />
          <p className="text-[12.5px] font-medium">Please select an absent teacher to manage substitutions.</p>
        </Card>
      )}

      {/* Substitution Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[440px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-[var(--purple)] to-[#7c3aed] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus size={16} />
                <span className="text-[13.5px] font-bold">Assign Substitute Teacher</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="bg-[var(--surf2)] border border-[var(--b)] rounded-xl p-3.5 space-y-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[var(--tx3)]">Class:</span>
                  <span className="font-semibold text-[var(--tx)]">Class {selectedPeriod?.batch?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--tx3)]">Subject:</span>
                  <span className="font-semibold text-[var(--tx)]">{selectedPeriod?.subject?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--tx3)]">Time Slot:</span>
                  <span className="font-semibold font-mono text-[var(--tx2)]">
                    {selectedPeriod?.time_slot ? `${selectedPeriod.time_slot.start_time.slice(0, 5)} - ${selectedPeriod.time_slot.end_time.slice(0, 5)}` : `Period ${selectedPeriod?.time_slot_id}`}
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-[var(--red-bg)]/25 border border-[var(--red-tx)]/15 text-[11.5px] text-[var(--red-tx)] rounded-xl flex items-center gap-2">
                  <AlertCircle size={13} className="flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">
                  Available Substitute Teachers
                </label>
                {loadingAvailable ? (
                  <div className="flex items-center justify-center gap-2 py-4 bg-[var(--surf2)] rounded-xl border border-[var(--b)] text-[12px] text-[var(--tx3)]">
                    <Loader2 size={13} className="animate-spin text-[var(--blue-tx)]" />
                    <span>Checking staff availability...</span>
                  </div>
                ) : availableSubstitutes.length > 0 ? (
                  <select
                    value={selectedSubstitute}
                    onChange={(e) => setSelectedSubstitute(e.target.value)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-xl px-3 py-2.5 text-[12.5px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                  >
                    <option value="">-- Choose Available Staff --</option>
                    {availableSubstitutes.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.name} {staff.department ? `(${staff.department})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-[var(--red-bg)]/20 border border-[var(--red-tx)]/10 text-[var(--red-tx)] rounded-xl text-[11.5px] flex items-start gap-2">
                    <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                    <p className="leading-relaxed">
                      No staff members are available (not teaching or substituted) during this period.
                    </p>
                  </div>
                )}
              </div>

              {availableSubstitutes.length > 0 && (
                <div>
                  <label className="block text-[11.5px] font-semibold text-[var(--tx2)] mb-1.5">
                    Notes (Optional)
                  </label>
                  <textarea
                    placeholder="Add instructions or details for the substitute..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-xl px-3 py-2 text-[12px] text-[var(--tx)] placeholder-[var(--tx3)]/60 focus:outline-none focus:border-[var(--blue)] resize-none"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 pt-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12px] font-medium text-[var(--tx)] hover:bg-[var(--surf3)] cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAssign}
                disabled={!selectedSubstitute || assigning || loadingAvailable || availableSubstitutes.length === 0}
                className="flex-1 py-2.5 bg-gradient-to-r from-[var(--purple)] to-[#7c3aed] text-white rounded-xl text-[12px] font-bold hover:opacity-90 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {assigning ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
                {assigning ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Substitute;
