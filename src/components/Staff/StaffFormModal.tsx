import React from 'react';
import { X, CheckCircle2, Plus, FileText } from 'lucide-react';


interface StaffFormModalProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modal: any;

  onClose: () => void;
  handleSave: (e: React.FormEvent<HTMLFormElement>) => void;

  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  customCategory: string;
  setCustomCategory: (c: string) => void;
  getDocsForCategory: (c: string) => string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customDocs?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setCustomDocs: (docs: any) => void;
  uploadedFiles: Record<string, File>;
  setUploadedFiles: React.Dispatch<React.SetStateAction<Record<string, File>>>;
}

export function StaffFormModal({
  modal,
  onClose,
  handleSave,
  selectedCategory,
  setSelectedCategory,
  customCategory,
  setCustomCategory,
  getDocsForCategory,
  customDocs,
  setCustomDocs,
  uploadedFiles,
  setUploadedFiles
}: StaffFormModalProps) {
  return (
      
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <form onSubmit={handleSave} className="bg-[var(--surf)] border border-[var(--b)] rounded-2xl w-full max-w-[540px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-[var(--b)] sticky top-0 bg-[var(--surf)] z-10">
              <div>
                <div className="text-[14px] font-bold text-[var(--tx)]">{modal.type === 'add' ? 'Add New Staff' : 'Edit Staff Profile'}</div>
                <div className="text-[12px] text-[var(--tx3)]">Fill in all staff details</div>
              </div>
              <button type="button" onClick={() => onClose()} className="p-1.5 rounded-lg hover:bg-[var(--surf2)] cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Category Selector on Top */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Staff Category *</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]"
                  >
                    <option value="Teaching">Teaching</option>
                    <option value="Non-Teaching">Non-Teaching</option>
                    <option value="House Keeping">House Keeping</option>
                    <option value="Driver">Driver</option>
                    <option value="Cleaner">Cleaner</option>
                    <option value="Watchman">Watchman</option>
                    <option value="manual_entry">Manual Entry</option>
                  </select>
                </div>
                {selectedCategory === 'manual_entry' && (
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Custom Category *</label>
                    <input
                      type="text"
                      required
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]"
                      placeholder="e.g. Accountant"
                    />
                  </div>
                )}
              </div>

              {/* Common Fields for Every Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-[var(--b)] pt-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Full Name *</label>
                  <input name="name" required defaultValue={modal.staff?.name} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Mrs. Lakshmi Devi" />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Designation *</label>
                  <input name="designation" required defaultValue={modal.staff?.designation} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Senior Teacher" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Phone *</label>
                  <input name="phone" required defaultValue={modal.staff?.phone} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="9876501234" />
                </div>
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Join Date</label>
                  <input name="joinDate" type="date" defaultValue={modal.staff?.joinDate || new Date().toISOString().slice(0, 10)} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Biometric Machine Employee Code</label>
                  <input name="biometric_employee_code" defaultValue={modal.staff?.biometric_employee_code} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)] font-mono" placeholder="e.g. 00000001" />
                </div>
              </div>

              {/* Conditional Fields based on Category Selection */}
              {selectedCategory === 'Teaching' && (
                <div className="space-y-4 border-t border-[var(--b)] pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Department *</label>
                      <select name="department" defaultValue={modal.staff?.department || 'Mathematics'} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]">
                        <option>Mathematics</option><option>Science</option><option>English</option><option>Languages</option><option>Social Sciences</option><option>Sports</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Subject(s)</label>
                      <input name="subject" defaultValue={modal.staff?.subject} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Physics, Chemistry" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Email</label>
                      <input name="email" defaultValue={modal.staff?.email} type="email" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="email@krishnaveni.edu" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Monthly Salary (₹)</label>
                      <input name="salary" type="number" defaultValue={modal.staff?.salary || 45000} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Qualifications</label>
                    <input name="qualifications" defaultValue={modal.staff?.qualifications} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="M.Sc, B.Ed" />
                  </div>
                </div>
              )}

              {selectedCategory === 'Non-Teaching' && (
                <div className="space-y-4 border-t border-[var(--b)] pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Department *</label>
                      <select name="department" defaultValue={modal.staff?.department || 'Science'} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] cursor-pointer outline-none focus:border-[var(--blue)]">
                        <option>Admin</option><option>Science</option><option>Sports</option><option>Office</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Email</label>
                      <input name="email" defaultValue={modal.staff?.email} type="email" className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="email@krishnaveni.edu" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Monthly Salary (₹)</label>
                      <input name="salary" type="number" defaultValue={modal.staff?.salary || 30000} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Qualifications</label>
                      <input name="qualifications" defaultValue={modal.staff?.qualifications} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="B.Sc, B.Com" />
                    </div>
                  </div>
                </div>
              )}

              {selectedCategory === 'Driver' && (
                <div className="space-y-4 border-t border-[var(--b)] pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Driving License Number *</label>
                      <input name="qualifications" required defaultValue={modal.staff?.qualifications} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="DL-142026XXXXXX" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Vehicle Assigned / Route</label>
                      <input name="subject" defaultValue={modal.staff?.subject} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Bus Route 4" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Monthly Salary (₹)</label>
                      <input name="salary" type="number" defaultValue={modal.staff?.salary || 25000} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">License Expiry Date</label>
                      <input name="email" type="date" defaultValue={modal.staff?.email?.includes('@') ? '' : modal.staff?.email} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                    </div>
                  </div>
                </div>
              )}

              {selectedCategory !== 'Teaching' && selectedCategory !== 'Non-Teaching' && selectedCategory !== 'Driver' && (
                <div className="space-y-4 border-t border-[var(--b)] pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Monthly Salary (₹)</label>
                      <input name="salary" type="number" defaultValue={modal.staff?.salary || 18000} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Shift Assigned / Timing</label>
                      <input name="subject" defaultValue={modal.staff?.subject} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="Day Shift (8 AM - 4 PM)" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-medium text-[var(--tx2)] mb-1.5">Qualifications / Experience Details</label>
                    <input name="qualifications" defaultValue={modal.staff?.qualifications} className="w-full bg-[var(--surf2)] border border-[var(--b)] rounded-lg px-3 py-2 text-[12px] text-[var(--tx)] outline-none focus:border-[var(--blue)]" placeholder="e.g. 3 years experience" />
                  </div>
                </div>
              )}

              {/* Dynamic Documents List based on Category with Custom Document Adding option */}
              <div className="border-t border-[var(--b)] pt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11.5px] font-medium text-[var(--tx2)]">Documents Required</label>
                  <button
                    type="button"
                    onClick={() => {
                      const docName = prompt("Enter the name of the other document:");
                      if (docName && docName.trim()) {
                        setCustomDocs((prev: string[]) => [...prev, docName.trim()]);
                      }
                    }}
                    className="flex items-center gap-1 text-[10.5px] text-[var(--blue-tx)] hover:underline cursor-pointer"
                  >
                    <Plus size={10} /> Add Other Document
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Standard Docs */}
                  {getDocsForCategory(selectedCategory).map((doc) => {
                    const file = uploadedFiles[doc];
                    return (
                      <div
                        key={doc}
                        onClick={() => {
                          const input = document.getElementById(`file-input-${doc}`);
                          if (input) input.click();
                        }}
                        className={`relative border border-dashed rounded-lg p-2.5 text-center cursor-pointer transition-colors ${
                          file
                            ? 'border-[var(--teal)] bg-[var(--teal-bg)]/10'
                            : 'border-[var(--b)] bg-[var(--surf2)]/20 hover:border-[var(--blue)]'
                        }`}
                      >
                        <input
                          id={`file-input-${doc}`}
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const selectedFile = e.target.files[0];
                              setUploadedFiles(prev => ({
                                ...prev,
                                [doc]: selectedFile
                              }));
                            }
                          }}
                          className="hidden"
                        />
                        {file ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setUploadedFiles(prev => {
                                  const next = { ...prev };
                                  delete next[doc];
                                  return next;
                                });
                              }}
                              className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-[var(--surf2)] text-[var(--red)] cursor-pointer flex items-center justify-center z-10"
                              title="Delete File"
                            >
                              <X size={10} />
                            </button>
                            <CheckCircle2 size={14} className="text-[var(--teal)] mx-auto mb-1" />
                            <div className="text-[10.5px] text-[var(--tx)] font-semibold truncate px-1">{doc}</div>
                            <div className="text-[9px] text-[var(--tx3)] truncate px-1">{file.name}</div>
                          </>
                        ) : (
                          <>
                            <FileText size={14} className="text-[var(--tx3)] mx-auto mb-1" />
                            <div className="text-[10.5px] text-[var(--tx3)] font-medium">{doc}</div>
                            <div className="text-[9px] text-[var(--tx3)] opacity-60">Click to upload</div>
                          </>
                        )}
                      </div>
                    );
                  })}
                  {/* Custom Docs */}
                  {(customDocs || []).map((doc, index) => {
                    const file = uploadedFiles[doc];
                    return (
                      <div
                        key={doc + '-' + index}
                        onClick={() => {
                          const input = document.getElementById(`file-input-${doc}`);
                          if (input) input.click();
                        }}
                        className={`relative border border-dashed rounded-lg p-2.5 text-center cursor-pointer transition-colors ${
                          file
                            ? 'border-[var(--teal)] bg-[var(--teal-bg)]/10'
                            : 'border-[var(--blue)] bg-[var(--blue-bg)]/10 hover:border-[var(--blue)]'
                        }`}
                      >
                        <input
                          id={`file-input-${doc}`}
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const selectedFile = e.target.files[0];
                              setUploadedFiles(prev => ({
                                ...prev,
                                [doc]: selectedFile
                              }));
                            }
                          }}
                          className="hidden"
                        />
                        <button
                          type="button"
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          onClick={(e) => {
                            e.stopPropagation();
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            setCustomDocs((prev: string[]) => prev.filter((_: any, idx: number) => idx !== index));
                            setUploadedFiles(prev => {
                              const next = { ...prev };
                              delete next[doc];
                              return next;
                            });
                          }}
                          className="absolute top-1 right-1 p-0.5 rounded-full hover:bg-[var(--surf2)] text-[var(--red)] cursor-pointer flex items-center justify-center z-10"
                          title="Remove Document"
                        >
                          <X size={10} />
                        </button>
                        {file ? (
                          <>
                            <CheckCircle2 size={14} className="text-[var(--teal)] mx-auto mb-1" />
                            <div className="text-[10.5px] text-[var(--tx)] font-semibold truncate px-2">{doc}</div>
                            <div className="text-[9px] text-[var(--tx3)] truncate px-2">{file.name}</div>
                          </>
                        ) : (
                          <>
                            <FileText size={14} className="text-[var(--blue-tx)] mx-auto mb-1" />
                            <div className="text-[10.5px] text-[var(--tx2)] font-medium truncate px-2">{doc}</div>
                            <div className="text-[9px] text-[var(--tx3)] opacity-60">Click to upload</div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-2 p-5 pt-0">
              <button type="button" onClick={() => onClose()} className="flex-1 py-2.5 border border-[var(--b)] bg-[var(--surf2)] rounded-xl text-[12.5px] font-medium text-[var(--tx)] cursor-pointer">Cancel</button>
              <button type="submit" className="flex-1 py-2.5 bg-[var(--blue)] text-white rounded-xl text-[12.5px] font-semibold cursor-pointer hover:opacity-90">{modal.type === 'add' ? 'Add Staff' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
  );
}
