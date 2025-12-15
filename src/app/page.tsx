
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useCollection, useDoc } from '@/firebase';
import type { User, Transaction, Recap, CalendarEvent, Comment } from '@/lib/definitions';
import AppSidebar from '@/components/app/app-sidebar';
import AppHeader from '@/components/app/app-header';
import DashboardView from '@/components/app/dashboard-view';
import FinancesView from '@/components/app/finances-view';
import ActivityView from '@/components/app/activity-view';
import CalendarView from '@/components/app/calendar-view';
import WhatsAppFab from '@/components/app/whatsapp-fab';
import { PaywallModal, AddUserModal, AddTransactionModal, AddRecapModal, AddEventModal } from '@/components/app/modals';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useFirestore } from '@/firebase';
import { setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';


export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const userDocRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);
  const { data: currentUserData } = useDoc<User>(userDocRef);

  const responsablesQuery = useMemoFirebase(() => query(collection(firestore, 'users'), where('role', '==', 'RESPONSABLE')), [firestore]);
  const { data: responsables } = useCollection<User>(responsablesQuery);

  const [viewAs, setViewAs] = useState<'PATRON' | 'RESPONSABLE'>('PATRON');
  const [selectedResponsable, setSelectedResponsable] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('accueil');
  const [modal, setModal] = useState<string | null>(null);

  useEffect(() => {
    if (responsables && responsables.length > 0 && !selectedResponsable) {
      setSelectedResponsable(responsables[0]);
    }
  }, [responsables, selectedResponsable]);
  
  const handleLogout = () => {
    if (auth) {
      signOut(auth);
    }
  };

  const handleAddCollaborator = () => {
    if (responsables && responsables.length >= 2) { 
      setModal('paywall');
    } else {
      setModal('addUser');
    }
  };

  const currentUserForView = useMemoFirebase(() => {
    if (!currentUserData) return null;
    return viewAs === 'PATRON' ? currentUserData : selectedResponsable;
  }, [currentUserData, viewAs, selectedResponsable]);


  const activeUser = viewAs === 'PATRON' ? selectedResponsable : currentUserData;
  const authorId = activeUser?.id;

  const transactionsQuery = useMemoFirebase(() => authorId ? query(collection(firestore, 'users', authorId, 'transactions')) : null, [firestore, authorId]);
  const { data: transactions } = useCollection<Transaction>(transactionsQuery);
  
  const recapsQuery = useMemoFirebase(() => authorId ? query(collection(firestore, 'users', authorId, 'recaps')) : null, [firestore, authorId]);
  const { data: recaps } = useCollection<Recap>(recapsQuery);

  const eventsQuery = useMemoFirebase(() => authorId ? query(collection(firestore, 'users', authorId, 'events')) : null, [firestore, authorId]);
  const { data: events } = useCollection<CalendarEvent>(eventsQuery);
  
  const commentsQuery = useMemoFirebase(() => {
    if (!authorId || !recaps?.length) return null;
    // This is a simplification. In a real app, you'd likely fetch comments for a specific recap.
    const recapIds = recaps.map(r => r.id);
    // Let's assume we are fetching for the latest recap for now.
    if (recapIds.length === 0) return null;
    return query(collection(firestore, `users/${authorId}/recaps/${recapIds[0]}/comments`));
  }, [firestore, authorId, recaps]);
  const { data: comments } = useCollection<Comment>(commentsQuery);

  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id' | 'authorId' | 'date'>) => {
    if (!authorId) return;
    const ref = collection(firestore, 'users', authorId, 'transactions');
    addDocumentNonBlocking(ref, {
      ...newTransaction,
      authorId,
      date: new Date().toISOString(),
    });
    setModal(null);
  };
  
  const handleAddRecap = (newRecap: Omit<Recap, 'id' | 'authorId' | 'date'>) => {
    if (!authorId) return;
    const ref = collection(firestore, 'users', authorId, 'recaps');
    addDocumentNonBlocking(ref, { 
        ...newRecap,
        authorId,
        date: new Date().toISOString()
     });
    setModal(null);
  };
  
  const handleAddEvent = (newEvent: Omit<CalendarEvent, 'id' | 'authorId'>) => {
    if (!authorId) return;
    const ref = collection(firestore, 'users', authorId, 'events');
    addDocumentNonBlocking(ref, { 
        ...newEvent,
        authorId
     });
    setModal(null);
  };
  
  const handleAddUser = (newUser: Omit<User, 'id' | 'email' >) => {
    // This is a simplified version. In a real app, you'd create a new Firebase user
    // and then create their user document in Firestore.
    // For now, we'll just add to the collection.
    const ref = collection(firestore, 'users');
    const fullUser = {
      ...newUser,
      id: `user-${Date.now()}`,
      email: `${newUser.name.split(' ').join('.').toLowerCase()}@tracklyo.com`,
    } as User

    addDocumentNonBlocking(ref, fullUser);
    setModal(null);
  }

  const whatsAppTarget = viewAs === 'PATRON' ? selectedResponsable : currentUserData;
  
  if (isUserLoading || !user || !currentUserData || !responsables) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Chargement...</p>
        </div>
    );
  }

  const renderContent = () => {
    switch(activeView) {
      case 'accueil':
        return (
          <DashboardView
            user={activeUser!}
            transactions={transactions || []}
            recaps={recaps || []}
            events={events || []}
            onQuickAdd={(type) => setModal(type)}
            viewAs={viewAs}
          />
        );
      case 'finances':
        return (
          <FinancesView 
            transactions={transactions || []} 
            onAddTransaction={() => setModal('addTransaction')}
            viewAs={viewAs}
          />
        );
      case 'activite':
        return (
          <ActivityView
            recaps={recaps || []}
            comments={comments || []}
            users={[...responsables, currentUserData]}
            onAddRecap={() => setModal('addRecap')}
            viewAs={viewAs}
            currentUser={currentUserData}
            authorId={authorId!}
          />
        );
      case 'agenda':
        return (
          <CalendarView 
            events={events || []} 
            onAddEvent={() => setModal('addEvent')} 
          />
        );
      default:
        return <DashboardView user={activeUser!} transactions={transactions || []} recaps={recaps || []} events={events || []} onQuickAdd={(type) => setModal(type)} viewAs={viewAs} />;
    }
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen bg-gray-100 dark:bg-neutral-900">
        <AppSidebar
          currentUser={currentUserData}
          viewAs={viewAs}
          setViewAs={setViewAs}
          responsables={responsables}
          selectedResponsable={selectedResponsable!}
          setSelectedResponsable={setSelectedResponsable}
          onAddCollaborator={handleAddCollaborator}
          activeView={activeView}
          setActiveView={setActiveView}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <AppHeader user={activeUser!} />
            <div className="mt-6">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {whatsAppTarget && <WhatsAppFab phoneNumber={whatsAppTarget.phoneNumber} />}
      
      <PaywallModal isOpen={modal === 'paywall'} onClose={() => setModal(null)} />
      <AddUserModal isOpen={modal === 'addUser'} onClose={() => setModal(null)} onAddUser={handleAddUser} />
      <AddTransactionModal 
        isOpen={modal === 'addTransaction'} 
        onClose={() => setModal(null)} 
        onAddTransaction={handleAddTransaction} 
        authorId={authorId!}
        viewAs={viewAs}
        transactions={transactions || []}
      />
      <AddRecapModal 
        isOpen={modal === 'addRecap'} 
        onClose={() => setModal(null)} 
        onAddRecap={handleAddRecap}
        authorId={authorId!}
      />
      <AddEventModal
        isOpen={modal === 'addEvent'}
        onClose={() => setModal(null)}
        onAddEvent={handleAddEvent}
        authorId={authorId!}
      />
    </SidebarProvider>
  );
}

