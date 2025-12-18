import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

export async function generatePDFReport(data: ExportData): Promise<Blob> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Rapport Complet - Tracklyo', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 10;

  // User info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Utilisateur: ${data.user.name}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Email: ${data.user.email}`, 20, yPosition);
  yPosition += 7;
  doc.text(`Rôle: ${data.user.role}`, 20, yPosition);
  yPosition += 7;

  const dateStr = format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr });
  doc.text(`Date d'export: ${dateStr}`, 20, yPosition);
  yPosition += 15;

  // Financial Summary
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Synthèse Financière', 20, yPosition);
  yPosition += 10;

  const { balance, totalBudget, totalExpenses } = calculateBalance(data.transactions);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const summaryData = [
    ['Total Budget', formatCurrency(totalBudget, 'EUR')],
    ['Total Dépenses', formatCurrency(totalExpenses, 'EUR')],
    ['Solde', formatCurrency(balance, 'EUR')],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [['Indicateur', 'Montant']],
    body: summaryData,
    theme: 'grid',
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 10 },
    margin: { left: 20 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Transactions
  if (data.transactions.length > 0) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Historique des Transactions', 20, yPosition);
    yPosition += 10;

    const transactionRows = data.transactions.map(tx => [
      format(parseISO(tx.date), 'dd/MM/yyyy HH:mm', { locale: fr }),
      tx.reason,
      tx.type === 'BUDGET_ADD' ? 'Budget' : 'Dépense',
      tx.paymentMethod || '-',
      `${tx.type === 'BUDGET_ADD' ? '+' : '-'}${formatCurrency(tx.amount, tx.currency)}`,
      tx.attachments && tx.attachments.length > 0 ? `${tx.attachments.length} fichier(s)` : '-',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Date', 'Motif', 'Type', 'Paiement', 'Montant', 'Justificatifs']],
      body: transactionRows,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 },
      margin: { left: 20 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 50 },
        2: { cellWidth: 20 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Missions
  if (data.missions.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Liste des Missions', 20, yPosition);
    yPosition += 10;

    const missionRows = data.missions.map(mission => [
      mission.title,
      mission.type === 'PERSONAL' ? 'Personnelle' : 'Partagée',
      mission.status === 'TODO' ? 'À faire' : mission.status === 'IN_PROGRESS' ? 'En cours' : 'Terminée',
      format(parseISO(mission.createdAt), 'dd/MM/yyyy', { locale: fr }),
      mission.description || '-',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Titre', 'Type', 'Statut', 'Créée le', 'Description']],
      body: missionRows,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 },
      margin: { left: 20 },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 25 },
        4: { cellWidth: 60 },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Recaps
  if (data.recaps.length > 0) {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapports d\'Activité', 20, yPosition);
    yPosition += 10;

    const recapRows = data.recaps.map(recap => [
      recap.title,
      recap.type === 'DAILY' ? 'Quotidien' : 'Hebdomadaire',
      format(parseISO(recap.date), 'dd/MM/yyyy HH:mm', { locale: fr }),
      recap.description.substring(0, 100) + (recap.description.length > 100 ? '...' : ''),
      recap.mediaUrl ? 'Oui' : 'Non',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Titre', 'Type', 'Date', 'Description', 'Média']],
      body: recapRows,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 },
      margin: { left: 20 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 30 },
        3: { cellWidth: 80 },
        4: { cellWidth: 15 },
      },
    });
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Page ${i} sur ${pageCount} - Généré par Tracklyo`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc.output('blob');
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
