import type { User, Transaction, Recap, Comment, CalendarEvent } from './definitions';
import { subDays, subHours } from 'date-fns';

// This data is now for placeholder/fallback purposes.
// The main data will be managed via Firebase in the page component.

export const initialUsers: User[] = [
  { id: 'user-patron-1', name: 'Alexandre', email: 'alex@tracklyo.com', role: 'PATRON', avatar: 'https://picsum.photos/seed/patron/100/100', phoneNumber: '33612345678' },
  { id: 'user-responsable-1', name: 'Léa Dubois', email: 'lea@tracklyo.com', role: 'RESPONSABLE', avatar: 'https://picsum.photos/seed/responsable1/100/100', phoneNumber: '33787654321' },
];

const responsableId = 'user-responsable-1';

export const initialTransactions: Transaction[] = [
  { id: 'tx-1', authorId: responsableId, amount: 2500, reason: 'Budget Initial', date: subDays(new Date(), 10).toISOString(), type: 'BUDGET_ADD', currency: 'EUR' },
  { id: 'tx-2', authorId: responsableId, amount: 150, reason: 'Achat de licences', date: subDays(new Date(), 8).toISOString(), type: 'EXPENSE', currency: 'USD' },
  { id: 'tx-3', authorId: responsableId, amount: 75, reason: 'Repas d\'équipe', date: subDays(new Date(), 5).toISOString(), type: 'EXPENSE', currency: 'EUR' },
  { id: 'tx-4', authorId: responsableId, amount: 50000, reason: 'Transport local', date: subDays(new Date(), 3).toISOString(), type: 'EXPENSE', currency: 'XOF' },
  { id: 'tx-5', authorId: responsableId, amount: 200, reason: 'Fournitures de bureau', date: subDays(new Date(), 1).toISOString(), type: 'EXPENSE', currency: 'EUR' },
  { id: 'tx-6', authorId: responsableId, amount: 1000, reason: 'Recharge Budget', date: subDays(new Date(), 2).toISOString(), type: 'BUDGET_ADD', currency: 'EUR' },
];

export const initialRecaps: Recap[] = [
  { id: 'recap-1', authorId: responsableId, title: 'Avancement Projet Phoenix', type: 'WEEKLY', description: 'La phase de design est terminée à 90%. Prochaine étape : validation client.', date: subDays(new Date(), 7).toISOString() },
  { id: 'recap-2', authorId: responsableId, title: 'Point quotidien', type: 'DAILY', description: 'Finalisation des maquettes pour la nouvelle feature. Aucun bloqueur identifié.', date: subHours(new Date(), 10).toISOString() },
  { id: 'recap-3', authorId: responsableId, title: 'Réunion de lancement', type: 'WEEKLY', description: 'Kick-off du projet Apollo réussi. Equipe motivée et objectifs clairs.', date: subDays(new Date(), 14).toISOString() },
];

export const initialComments: Comment[] = [
    { id: 'comment-1', recapId: 'recap-1', authorId: 'user-patron-1', content: 'Excellent travail ! Pensez à planifier la démo.', date: subDays(new Date(), 6).toISOString() },
    { id: 'comment-2', recapId: 'recap-1', authorId: responsableId, content: 'Bien noté, ce sera fait demain.', date: subDays(new Date(), 6).toISOString() },
];

export const initialEvents: CalendarEvent[] = [
    { id: 'event-1', authorId: responsableId, title: 'Daily Stand-up', description: 'Point rapide sur les tâches.', date: new Date().toISOString() },
    { id: 'event-2', authorId: responsableId, title: 'Réunion Client - Phoenix', description: 'Validation des maquettes.', date: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString() },
    { id: 'event-3', authorId: responsableId, title: 'Point projet Apollo', description: 'Point hebdomadaire sur l\'avancement.', date: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString() },
];
