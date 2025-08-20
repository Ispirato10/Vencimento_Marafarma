import type { Product, CatalogItem } from '@/types';
import { addDays, addMonths } from 'date-fns';

// These are now for reference or seeding, not for initial state.
export const initialCatalog: CatalogItem[] = [
  { code: '7896094900118', name: 'Dipirona Monoidratada 500mg', category: 'Analgésico' },
  { code: '7891058001719', name: 'Paracetamol 750mg', category: 'Analgésico' },
  { code: '7896004706505', name: 'Amoxicilina 500mg', category: 'Antibiótico' },
  { code: '7896112122331', name: 'Nimesulida 100mg', category: 'Anti-inflamatório' },
  { code: '7897322703870', name: 'Loratadina 10mg', category: 'Antialérgico' },
];

export const initialProducts: Product[] = [];

export const initialReportAuthor = 'By Rogério N. Nunes';
