// ============================================================
// Zustand Store — Uygulama Genelinde State Yönetimi
// ============================================================
import { create } from 'zustand';
import {
  groupByEmployer,
  checkDeclarationRequired,
  generateGibTableRows,
  calculateTaxBalance,
  hesaplaIndirimDetayi,
} from '../services/taxCalculator.js';

// Aktif beyan yılı — sadece bu yılın bordrolarını işle
const TARGET_YEAR = 2025;

const useTaxStore = create((set, get) => ({
  currentStep: 1,
  records: [],
  employers: [],
  primaryEmployerKey: null,
  declarationCheck: null,
  taxBalance: null,
  gibTableRows: [],
  indirimDetayi: [],   // GİB modal için — ana tablodan AYRI

  setStep: (step) => set({ currentStep: step }),

  addRecord: (record) => {
    set((state) => ({ records: [...state.records, record] }));
    get().recalculate();
  },

  updateRecord: (index, updates) => {
    set((state) => {
      const records = [...state.records];
      records[index] = { ...records[index], ...updates };
      return { records };
    });
    get().recalculate();
  },

  removeRecord: (index) => {
    set((state) => ({
      records: state.records.filter((_, i) => i !== index),
    }));
    get().recalculate();
  },

  clearAll: () => set({
    records: [],
    employers: [],
    declarationCheck: null,
    taxBalance: null,
    gibTableRows: [],
    indirimDetayi: [],
    currentStep: 1,
    primaryEmployerKey: null,
  }),

  setPrimaryEmployer: (key) => {
    set({ primaryEmployerKey: key });
    get().recalculate();
  },

  recalculate: () => {
    // Kayıtları kronolojik sırala
    set((state) => {
      const sorted = [...state.records].sort((a, b) => {
        const va = (a.year || 0) * 100 + (a.month || 0);
        const vb = (b.year || 0) * 100 + (b.month || 0);
        return va - vb;
      });
      return { records: sorted };
    });

    const { records, primaryEmployerKey } = get();
    if (records.length === 0) {
      set({ employers: [], declarationCheck: null, taxBalance: null, gibTableRows: [], indirimDetayi: [] });
      return;
    }

    // Sadece TARGET_YEAR (2025) bordrolarını hesaplamaya al
    const employers = groupByEmployer(records, TARGET_YEAR);

    const gibTableRows = generateGibTableRows(employers, primaryEmployerKey);
    const declarationCheck = checkDeclarationRequired(employers, primaryEmployerKey, gibTableRows);
    const taxBalance = calculateTaxBalance(employers, gibTableRows);
    const indirimDetayi = hesaplaIndirimDetayi(employers);

    set({ employers, declarationCheck, taxBalance, gibTableRows, indirimDetayi });
  },
}));

export default useTaxStore;
