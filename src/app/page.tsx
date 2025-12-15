"use client";

import React, { useState, useMemo } from 'react';
import { initialUsers, initialTransactions, initialRecaps, initialEvents } from '@/lib/data';
import type { User, Transaction, Recap, CalendarEvent } from '@/lib/definitions';
import AppSidebar from '@/components/app/app-sidebar';
import AppHeader from '@/components/app/app-header';
import DashboardView from '@/components/app/dashboard-view';
import FinancesView from '@/components/app/finances-view';
import ActivityView from '@/components/app/activity-view';
import CalendarView from '@/components/app/calendar-view';
import WhatsAppFab from '@/components/app/whatsapp-fab';
import { PaywallModal, AddUserModal, AddTransactionModal, AddRecapModal, AddEventModal } from '@/components/app/modals';
import { SidebarProvider } from '@/components/ui/sidebar';
import { initialComments } from '@/lib/data';

export default function Home() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [recaps, setRecaps] = useState<Recap[]>(initialRecaps);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  
  const patron = useMemo(() => users.find(u => u.role === 'PATRON')!, [users]);
  const responsables = useMemo(() => users.filter(u => u.role === 'RESPONSABLE'), [users]);
  
  const [currentUser, setCurrentUser] = useState<User>(patron);
  const [viewAs, setViewAs] = useState<'PATRON' | 'RESPONSABLE'>('PATRON');
  const [selectedResponsable, setSelectedResponsable] = useState<User>(responsables[0]);
  const [activeView, setActiveView] = useState('accueil');

  const [modal, setModal] = useState<string | null>(null);

  const handleAddCollaborator = () => {
    if (responsables.length >= 2) { // Allow 2 responsables before paywall
      setModal('paywall');
    } else {
      setModal('addUser');
    }
  };

  const activeUser = viewAs === 'PATRON' ? selectedResponsable : currentUser;

  const filteredTransactions = useMemo(() => transactions.filter(t => t.authorId === activeUser.id), [transactions, activeUser]);
  const filteredRecaps = useMemo(() => recaps.filter(r => r.authorId === activeUser.id), [recaps, activeUser]);
  const filteredEvents = useMemo(() => events.filter(e => e.authorId === activeUser.id), [events, activeUser]);

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [...prev, { ...newTransaction, id: `tx-${Date.now()}` }]);
    setModal(null);
  };
  
  const handleAddRecap = (newRecap: Omit<Recap, 'id'>) => {
    setRecaps(prev => [...prev, { ...newRecap, id: `recap-${Date.now()}` }]);
    setModal(null);
  };
  
  const handleAddEvent = (newEvent: Omit<CalendarEvent, 'id'>) => {
    setEvents(prev => [...prev, { ...newEvent, id: `evt-${Date.now()}` }]);
    setModal(null);
  };

  const whatsAppTarget = viewAs === 'PATRON' ? selectedResponsable : patron;

  const renderContent = () => {
    switch(activeView) {
      case 'accueil':
        return (
          <DashboardView
            user={activeUser}
            transactions={filteredTransactions}
            recaps={filteredRecaps}
            events={filteredEvents}
            onQuickAdd={(type) => setModal(type)}
            viewAs={viewAs}
          />
        );
      case 'finances':
        return (
          <FinancesView 
            transactions={filteredTransactions} 
            onAddTransaction={() => setModal('addTransaction')}
            viewAs={viewAs}
          />
        );
      case 'activite':
        return (
          <ActivityView
            recaps={filteredRecaps}
            comments={initialComments}
            users={users}
            onAddRecap={() => setModal('addRecap')}
            viewAs={viewAs}
          />
        );
      case 'agenda':
        return (
          <CalendarView 
            events={filteredEvents} 
            onAddEvent={() => setModal('addEvent')} 
          />
        );
      default:
        return <DashboardView user={activeUser} transactions={filteredTransactions} recaps={filteredRecaps} events={filteredEvents} onQuickAdd={(type) => setModal(type)} viewAs={viewAs} />;
    }
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen bg-background">
        <AppSidebar
          currentUser={currentUser}
          viewAs={viewAs}
          setViewAs={setViewAs}
          responsables={responsables}
          selectedResponsable={selectedResponsable}
          setSelectedResponsable={setSelectedResponsable}
          onAddCollaborator={handleAddCollaborator}
          activeView={activeView}
          setActiveView={setActiveView}
          onLogout={() => console.log('logout')}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <AppHeader user={activeUser} />
            <div className="mt-6">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      <WhatsAppFab phoneNumber={whatsAppTarget.phoneNumber} />
      
      <PaywallModal isOpen={modal === 'paywall'} onClose={() => setModal(null)} />
      <AddUserModal isOpen={modal === 'addUser'} onClose={() => setModal(null)} onAddUser={(newUser) => { setUsers(prev => [...prev, newUser]); setModal(null); }} />
      <AddTransactionModal 
        isOpen={modal === 'addTransaction'} 
        onClose={() => setModal(null)} 
        onAddTransaction={handleAddTransaction} 
        authorId={activeUser.id}
        viewAs={viewAs}
        transactions={filteredTransactions}
      />
      <AddRecapModal 
        isOpen={modal === 'addRecap'} 
        onClose={() => setModal(null)} 
        onAddRecap={handleAddRecap}
        authorId={activeUser.id}
      />
      <AddEventModal
        isOpen={modal === 'addEvent'}
        onClose={() => setModal(null)}
        onAddEvent={handleAddEvent}
        authorId={activeUser.id}
      />
    </SidebarProvider>
  );
}
