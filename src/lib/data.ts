import type { Product, CatalogItem } from '@/types';
import { addDays, addMonths } from 'date-fns';

export const catalog: CatalogItem[] = [
  { code: '7896094900118', name: 'Dipirona Monoidratada 500mg', category: 'Analgésico' },
  { code: '7891058001719', name: 'Paracetamol 750mg', category: 'Analgésico' },
  { code: '7896004706505', name: 'Amoxicilina 500mg', category: 'Antibiótico' },
  { code: '7896112122331', name: 'Nimesulida 100mg', category: 'Anti-inflamatório' },
  { code: '7897322703870', name: 'Loratadina 10mg', category: 'Antialérgico' },
];

export const products: Product[] = [
  {
    id: '1',
    code: '7896094900118',
    name: 'Dipirona Monoidratada 500mg',
    quantity: 15,
    category: 'Analgésico',
    batch: 'A22-001',
    expirationDate: addDays(new Date(), 25), // Vence em 25 dias
  },
  {
    id: '2',
    code: '7891058001719',
    name: 'Paracetamol 750mg',
    quantity: 30,
    category: 'Analgésico',
    batch: 'P22-005',
    expirationDate: addDays(new Date(), 50), // Vence em 50 dias
  },
  {
    id: '3',
    code: '7896004706505',
    name: 'Amoxicilina 500mg',
    quantity: 8,
    category: 'Antibiótico',
    batch: 'AMX-012',
    expirationDate: addDays(new Date(), 80), // Vence em 80 dias
  },
  {
    id: '4',
    code: '7897322703870',
    name: 'Loratadina 10mg',
    quantity: 22,
    category: 'Antialérgico',
    batch: 'LOR-001',
    expirationDate: addDays(new Date(), 15), // Vence em 15 dias
  },
  {
    id: '5',
    code: '7896112122331',
    name: 'Nimesulida 100mg',
    quantity: 10,
    category: 'Anti-inflamatório',
    batch: 'NIM-089',
    expirationDate: addMonths(new Date(), 4), // Vence em 4 meses
  },
  {
    id: '6',
    code: '7891058001719',
    name: 'Paracetamol 750mg',
    quantity: 18,
    category: 'Analgésico',
    batch: 'P23-001',
    expirationDate: addDays(new Date(), 95), // Vence em 95 dias
  },
];
