/**
 * alumniStore.ts
 *
 * A simple localStorage-backed store for alumni records.
 * Used as a reliable cross-page fallback when the backend /alumni endpoint
 * is not yet implemented. Both Promotion.tsx and Alumni.tsx read/write here
 * so that graduates created during promotion immediately appear in the Alumni tab.
 */

export const ALUMNI_STORE_KEY = 'kts_alumni_records';

export interface LocalAlumni {
  id: string;               // "local-<timestamp>" or backend id as string
  name: string;
  roll: string;
  passOutYear: string;
  class: string;
  section: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  phone: string;
  email: string;
  address: string;
  currentOccupation: string;
  achievement: string;
  status: 'Verified' | 'Unverified' | 'Inactive' | 'Deleted';
  source: 'promotion' | 'manual' | 'backend'; // where the record came from
}

/** Read all locally stored alumni records */
export function readLocalAlumni(): LocalAlumni[] {
  try {
    const raw = localStorage.getItem(ALUMNI_STORE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalAlumni[];
  } catch {
    return [];
  }
}

/** Persist the full list to localStorage */
export function writeLocalAlumni(records: LocalAlumni[]): void {
  try {
    // Use originalSetItem to bypass the DB-sync monkey-patch for this key
    const rawSet = Object.getOwnPropertyDescriptor(Storage.prototype, 'setItem');
    if (rawSet?.value) {
      rawSet.value.call(localStorage, ALUMNI_STORE_KEY, JSON.stringify(records));
    } else {
      localStorage.setItem(ALUMNI_STORE_KEY, JSON.stringify(records));
    }
  } catch {
    // ignore storage quota errors
  }
}

/** Add a new alumni record, de-duplicated by id or name+year */
export function addLocalAlumni(record: Omit<LocalAlumni, 'id'> & { id?: string }): LocalAlumni {
  const existing = readLocalAlumni();
  const id = record.id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // De-duplicate: same name + passOutYear + class
  const isDuplicate = existing.some(
    a =>
      a.name.toLowerCase() === record.name.toLowerCase() &&
      a.passOutYear === record.passOutYear &&
      a.class === record.class &&
      a.section === record.section
  );

  const newRecord: LocalAlumni = { ...record, id } as LocalAlumni;
  if (!isDuplicate) {
    writeLocalAlumni([newRecord, ...existing]);
  }
  return newRecord;
}

/** Update an existing local alumni record by id */
export function updateLocalAlumni(id: string, updates: Partial<LocalAlumni>): void {
  const existing = readLocalAlumni();
  const updated = existing.map(a => (a.id === id ? { ...a, ...updates } : a));
  writeLocalAlumni(updated);
}

/** Remove a local alumni record by id */
export function deleteLocalAlumni(id: string): void {
  const existing = readLocalAlumni();
  writeLocalAlumni(existing.filter(a => a.id !== id));
}

/**
 * Merge backend alumni records with local ones.
 * Backend records take precedence; local-only records are appended.
 */
export function mergeAlumni(backendRecords: LocalAlumni[]): LocalAlumni[] {
  const local = readLocalAlumni();
  const backendIds = new Set(backendRecords.map(a => a.id));
  const backendKeys = new Set(
    backendRecords.map(a => `${a.name.toLowerCase()}|${a.passOutYear}|${a.class}|${a.section}`)
  );

  // Include local records that aren't already covered by backend
  const localOnly = local.filter(
    a => !backendIds.has(a.id) &&
         !backendKeys.has(`${a.name.toLowerCase()}|${a.passOutYear}|${a.class}|${a.section}`)
  );

  return [...backendRecords, ...localOnly];
}
