import * as XLSX from 'xlsx';
import type { Transaction, Mission, Recap, User } from './definitions';
import { formatCurrency, calculateBalance } from './utils';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface ExportData {
  user: User;
  transactions: Transaction[];
  missions: Mission[];
  recaps: Recap[];
  dateRange?: { start: Date; end: Date };
}

export async function generateExcelReport(data: ExportData): Promise<Blob> {
  const workbook = XLSX.utils.book_new();

  // Summary Sheet
  const { balance, totalBudget, totalExpenses } = calculateBalance(data.transactions);
  const summaryData = [
    ['RAPPORT COMPLET - TRACKLYO'],
    [],
    ['Utilisateur:', data.user.name],
    ['Email:', data.user.email],
    ['Rôle:', data.user.role],
    ['Date d\'export:', format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })],
    [],
    ['SYNTHÈSE FINANCIÈRE'],
    ['Total Budget', formatCurrency(totalBudget, 'EUR')],
    ['Total Dépenses', formatCurrency(totalExpenses, 'EUR')],
    ['Solde', formatCurrency(balance, 'EUR')],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

  // Set column widths
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 30 }];

  // Style the title row
  if (summarySheet['A1']) {
    summarySheet['A1'].s = {
      font: { bold: true, sz: 16 },
      alignment: { horizontal: 'center' },
    };
  }

  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Synthèse');

  // Transactions Sheet
  if (data.transactions.length > 0) {
    const transactionHeaders = [
      'Date',
      'Motif',
      'Type',
      'Méthode de paiement',
      'Montant',
      'Devise',
      'Justificatifs',
    ];

    const transactionRows = data.transactions.map(tx => [
      format(parseISO(tx.date), 'dd/MM/yyyy HH:mm', { locale: fr }),
      tx.reason,
      tx.type === 'BUDGET_ADD' ? 'Budget' : 'Dépense',
      tx.paymentMethod || '-',
      tx.type === 'BUDGET_ADD' ? tx.amount : -tx.amount,
      tx.currency,
      tx.attachments && tx.attachments.length > 0 ? `${tx.attachments.length} fichier(s)` : 'Aucun',
    ]);

    const transactionData = [transactionHeaders, ...transactionRows];
    const transactionSheet = XLSX.utils.aoa_to_sheet(transactionData);

    // Set column widths
    transactionSheet['!cols'] = [
      { wch: 18 },
      { wch: 40 },
      { wch: 12 },
      { wch: 18 },
      { wch: 15 },
      { wch: 8 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Transactions');
  }

  // Missions Sheet
  if (data.missions.length > 0) {
    const missionHeaders = ['Titre', 'Type', 'Statut', 'Créée le', 'Mise à jour', 'Description'];

    const missionRows = data.missions.map(mission => [
      mission.title,
      mission.type === 'PERSONAL' ? 'Personnelle' : 'Partagée',
      mission.status === 'TODO' ? 'À faire' : mission.status === 'IN_PROGRESS' ? 'En cours' : 'Terminée',
      format(parseISO(mission.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr }),
      format(parseISO(mission.updatedAt), 'dd/MM/yyyy HH:mm', { locale: fr }),
      mission.description || '-',
    ]);

    const missionData = [missionHeaders, ...missionRows];
    const missionSheet = XLSX.utils.aoa_to_sheet(missionData);

    // Set column widths
    missionSheet['!cols'] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 50 },
    ];

    XLSX.utils.book_append_sheet(workbook, missionSheet, 'Missions');
  }

  // Recaps Sheet
  if (data.recaps.length > 0) {
    const recapHeaders = ['Titre', 'Type', 'Date', 'Description', 'Média'];

    const recapRows = data.recaps.map(recap => [
      recap.title,
      recap.type === 'DAILY' ? 'Quotidien' : 'Hebdomadaire',
      format(parseISO(recap.date), 'dd/MM/yyyy HH:mm', { locale: fr }),
      recap.description,
      recap.mediaUrl ? 'Oui' : 'Non',
    ]);

    const recapData = [recapHeaders, ...recapRows];
    const recapSheet = XLSX.utils.aoa_to_sheet(recapData);

    // Set column widths
    recapSheet['!cols'] = [
      { wch: 30 },
      { wch: 15 },
      { wch: 18 },
      { wch: 60 },
      { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(workbook, recapSheet, 'Rapports d\'Activité');
  }

  // Convert workbook to blob
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function downloadExcel(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
