import { create } from 'zustand';

export interface Category {
  key: string;
  label: string;
  defaultAmount: number;
}

export interface GradeFee {
  grade: string;
  fees: Record<string, number>;
}

export interface VillageRate {
  id: string;
  village: string;
  amount: number;
}

export const DEMO_VILLAGE_RATES: VillageRate[] = [
  { id: '1', village: 'Chevella', amount: 7000 },
  { id: '2', village: 'Urella', amount: 7500 },
  { id: '3', village: 'DharmaSagar', amount: 8000 },
  { id: '4', village: 'Devuni Yerravally', amount: 8000 },
  { id: '5', village: 'Nyalata', amount: 9000 },
  { id: '6', village: 'Mirzaguda', amount: 9000 },
  { id: '7', village: 'Malkapur', amount: 7000 },
  { id: '8', village: 'Kesaram', amount: 6500 },
  { id: '9', village: 'Jajugutta', amount: 8500 },
  { id: '10', village: 'Gollapally', amount: 8500 },
  { id: '11', village: 'Damarigidda', amount: 9000 },
  { id: '12', village: 'Dall Company', amount: 8500 },
  { id: '13', village: 'Ramannaguda', amount: 9000 },
  { id: '14', village: 'Pamena', amount: 9500 },
  { id: '15', village: 'Allada', amount: 9500 },
  { id: '16', village: 'Bastepur', amount: 10000 },
  { id: '17', village: 'Chanvally', amount: 11500 },
  { id: '18', village: 'Nancheri', amount: 11500 },
  { id: '19', village: 'Kammeta', amount: 11500 },
  { id: '20', village: 'Yenkapally Gate', amount: 11000 },
  { id: '21', village: 'Khanapur Gate', amount: 11000 },
  { id: '22', village: 'Gollaguda', amount: 12000 },
  { id: '23', village: 'Khanapuram', amount: 11500 },
  { id: '24', village: 'Ghanapur', amount: 12000 },
  { id: '25', village: 'Devarampally', amount: 12000 },
  { id: '26', village: 'Kothapally', amount: 12500 },
  { id: '27', village: 'Koukuntla', amount: 12500 },
  { id: '28', village: 'Antaram', amount: 12500 },
  { id: '29', village: 'Aloor', amount: 12500 },
  { id: '30', village: 'Hastepur', amount: 12500 },
  { id: '31', village: 'Pragathi', amount: 13500 },
  { id: '32', village: 'Singappaguda', amount: 9000 },
  { id: '33', village: 'Ibramhimpally', amount: 9000 },
  { id: '34', village: 'Tangedipally', amount: 12000 },
  { id: '35', village: 'Yetla Erravelly', amount: 12500 },
  { id: '36', village: 'Nagarguda', amount: 12500 },
  { id: '37', village: 'Kandada', amount: 9000 },
  { id: '38', village: 'Palgutta', amount: 9000 },
];

interface FeeState {
  categories: Category[];
  feeData: GradeFee[];
  villageRates: VillageRate[];
  updateClassFee: (grade: string, categoryKey: string, amount: number) => void;
  addCategory: (label: string, defaultAmount: number) => void;
  removeCategory: (categoryKey: string) => void;
  setVillageRates: (rates: VillageRate[]) => void;
  addVillageRate: (village: string, amount: number) => void;
  updateVillageRate: (id: string, village: string, amount: number) => void;
  removeVillageRate: (id: string) => void;
}

export const useFeeStore = create<FeeState>((set) => ({
  categories: [
    { key: 'tuition', label: 'Tuition Fees', defaultAmount: 4500 },
    { key: 'transport', label: 'Transport Fee', defaultAmount: 1200 },
  ],
  feeData: [
    { grade: 'Class 1', fees: { tuition: 4500, transport: 1200 } },
    { grade: 'Class 2', fees: { tuition: 4500, transport: 1200 } },
    { grade: 'Class 3', fees: { tuition: 4800, transport: 1200 } },
    { grade: 'Class 4', fees: { tuition: 4800, transport: 1200 } },
    { grade: 'Class 5', fees: { tuition: 5200, transport: 1400 } },
    { grade: 'Class 6', fees: { tuition: 5500, transport: 1400 } },
    { grade: 'Class 7', fees: { tuition: 5500, transport: 1400 } },
    { grade: 'Class 8', fees: { tuition: 6000, transport: 1600 } },
    { grade: 'Class 9', fees: { tuition: 6800, transport: 1600 } },
    { grade: 'Class 10', fees: { tuition: 7200, transport: 1600 } },
    { grade: 'Class 11', fees: { tuition: 8500, transport: 1800 } },
    { grade: 'Class 12', fees: { tuition: 9000, transport: 1800 } },
  ],
  villageRates: DEMO_VILLAGE_RATES,
  updateClassFee: (grade, categoryKey, amount) => {
    set((state) => ({
      feeData: state.feeData.map((item) => {
        if (item.grade === grade) {
          return {
            ...item,
            fees: {
              ...item.fees,
              [categoryKey]: amount,
            },
          };
        }
        return item;
      }),
    }));
  },
  addCategory: (label, defaultAmount) => {
    const key = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const newCat: Category = { key, label, defaultAmount };

    set((state) => {
      // Check if key already exists to prevent duplicate entries
      if (state.categories.some((c) => c.key === key)) {
        return {};
      }

      return {
        categories: [...state.categories, newCat],
        feeData: state.feeData.map((item) => ({
          ...item,
          fees: {
            ...item.fees,
            [key]: defaultAmount,
          },
        })),
      };
    });
  },
  removeCategory: (categoryKey) => {
    set((state) => ({
      categories: state.categories.filter((c) => c.key !== categoryKey),
      feeData: state.feeData.map((item) => {
        const updatedFees = { ...item.fees };
        delete updatedFees[categoryKey];
        return {
          ...item,
          fees: updatedFees,
        };
      }),
    }));
  },
  setVillageRates: (rates) => set({ villageRates: rates }),
  addVillageRate: (village, amount) => {
    const newRate: VillageRate = {
      id: `vr_${Date.now()}`,
      village: village.trim(),
      amount,
    };
    set((state) => ({ villageRates: [...state.villageRates, newRate] }));
  },
  updateVillageRate: (id, village, amount) => {
    set((state) => ({
      villageRates: state.villageRates.map((r) =>
        r.id === id ? { ...r, village: village.trim(), amount } : r
      ),
    }));
  },
  removeVillageRate: (id) => {
    set((state) => ({
      villageRates: state.villageRates.filter((r) => r.id !== id),
    }));
  },
}));
