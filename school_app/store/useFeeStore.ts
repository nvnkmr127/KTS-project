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

interface FeeState {
  categories: Category[];
  feeData: GradeFee[];
  updateClassFee: (grade: string, categoryKey: string, amount: number) => void;
  addCategory: (label: string, defaultAmount: number) => void;
  removeCategory: (categoryKey: string) => void;
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
}));
