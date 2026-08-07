import React from 'react';
import { X, Printer } from 'lucide-react';

interface StaffPayslipModalProps {
   
  selectedSlip: any;
  onClose: () => void;
}

export function StaffPayslipModal({ selectedSlip, onClose }: StaffPayslipModalProps) {
  if (!selectedSlip) return null;

  const schoolName = localStorage.getItem('school_name') || 'Krishnaveni Talent School';
  const schoolAddress = localStorage.getItem('school_address') || 'Nizamabad, Telangana';
  const schoolLogo = localStorage.getItem('school_logo') || '/KTHS_Logo.png';

  const handlePrintPayslip = () => {
    const printContent = document.getElementById('printable-payslip-ref')?.innerHTML;
    if (!printContent) return;

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Payslip - ${selectedSlip.name}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; background: white; }
            .text-center { text-align: center; }
            .mb-4 { margin-bottom: 16px; }
            .pb-4 { padding-bottom: 16px; }
            .border-b { border-bottom: 1px solid #e2e8f0; }
            .text-\[14px\] { font-size: 14px; }
            .font-bold { font-weight: bold; }
            .text-\[11px\] { font-size: 11px; }
            .text-\[var\(--tx3\)\] { color: #64748b; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .gap-2 { gap: 8px; }
            .p-3 { padding: 12px; }
            .bg-\[var\(--surf-2\)\] { background: #f8fafc; }
            .rounded-xl { border-radius: 12px; }
            .text-\[10px\] { font-size: 10px; }
            .text-\[12px\] { font-size: 12px; }
            .text-\[var\(--tx\)\] { color: #0f172a; }
            .mb-2 { margin-bottom: 8px; }
            .font-semibold { font-weight: 600; }
            .text-\[var\(--teal-tx\)\] { color: #0f766e; }
            .text-\[var\(--red-tx\)\] { color: #b91c1c; }
            .space-y-1\.5 > * + * { margin-top: 6px; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .font-medium { font-weight: 500; }
            .pt-1\.5 { padding-top: 6px; }
            .border-t { border-top: 1px solid #e2e8f0; }
            .p-3\.5 { padding: 14px; }
            .bg-\[var\(--blue-bg\)\] { background: #eff6ff; }
            .border-\[var\(--blue-tx\)\]\/10 { border-color: rgba(29, 78, 216, 0.1); }
            .text-\[13px\] { font-size: 13px; }
            .text-\[18px\] { font-size: 18px; }
            .items-center { align-items: center; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[460px] shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-[var(--b)]">
          <div>
            <div className="text-[14px] font-bold text-[var(--tx)]">Payslip Preview</div>
            <div className="text-[12px] text-[var(--tx3)]">{selectedSlip.month}</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[var(--hover)] flex items-center justify-center text-[var(--tx3)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[60vh]" id="printable-payslip-ref">
          <div className="text-center mb-4 pb-4 border-b border-[var(--b)]" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <img src={schoolLogo} alt="School Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            <div>
              <div className="text-[14px] font-bold text-[var(--tx)]">{schoolName}</div>
              <div className="text-[11px] text-[var(--tx3)]">{schoolAddress} · Salary Payslip</div>
              <div className="text-[11px] text-[var(--tx3)]">{selectedSlip.month}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: 'Employee Name', value: selectedSlip.name },
              { label: 'Designation', value: selectedSlip.designation },
              { label: 'Pay Period', value: selectedSlip.month },
              { label: 'Payment Status', value: selectedSlip.status },
            ].map((d, i) => (
              <div key={i} className="p-3 bg-[var(--surf-2)] rounded-xl">
                <div className="text-[10px] text-[var(--tx3)] mb-1">{d.label}</div>
                <div className="text-[12px] font-semibold text-[var(--tx)]">{d.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-[11px] font-semibold text-[var(--teal-tx)] mb-2">Earnings</div>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[var(--tx3)]">Basic</span>
                  <span className="text-[var(--tx)] font-medium">₹{selectedSlip.basic?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--tx3)]">HRA</span>
                  <span className="text-[var(--tx)] font-medium">₹{selectedSlip.hra?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--tx3)]">Allowances</span>
                  <span className="text-[var(--tx)] font-medium">₹{selectedSlip.allowances?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-[var(--b)] font-semibold">
                  <span className="text-[var(--tx)]">Gross</span>
                  <span className="text-[var(--teal-tx)]">₹{selectedSlip.gross?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-[var(--red-tx)] mb-2">Deductions</div>
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[var(--tx3)]">PF / Tax</span>
                  <span className="text-[var(--red-tx)] font-medium">₹{selectedSlip.deductions?.toLocaleString() || 0}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-[var(--b)] font-semibold">
                  <span className="text-[var(--tx)]">Total</span>
                  <span className="text-[var(--red-tx)]">₹{selectedSlip.deductions?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--blue-bg)] border border-[var(--blue-tx)]/10 rounded-xl p-3.5 flex justify-between items-center">
            <span className="text-[13px] font-bold text-[var(--blue-tx)]">Net Pay</span>
            <span className="text-[18px] font-bold text-[var(--blue-tx)]">₹{selectedSlip.net?.toLocaleString() || 0}</span>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--b)] flex justify-end">
          <button
            onClick={handlePrintPayslip}
            className="h-10 px-6 rounded-xl bg-[var(--blue-bg)] text-[var(--blue-tx)] font-semibold text-[13px] flex items-center gap-2 hover:bg-[var(--blue-tx)] hover:text-white transition-all"
          >
            <Printer size={16} />
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}
