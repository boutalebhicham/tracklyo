
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, doc, addDoc } from 'firebase/firestore';
import { useCollection, useDoc } from '@/firebase';
import type { User, Transaction, Recap, CalendarEvent, Comment, DocumentFile } from '@/lib/definitions';
import AppSidebar from '@/components/app/app-sidebar';
import AppHeader from '@/components/app/app-header';
import DashboardView from '@/components/app/dashboard-view';
import FinancesView from '@/components/app/finances-view';
import ActivityView from '@/components/app/activity-view';
import CalendarView from '@/components/app/calendar-view';
import FilesView from '@/components/app/files-view';
import WhatsAppFab from '@/components/app/whatsapp-fab';
import { PaywallModal, AddUserModal, AddTransactionModal, AddRecapModal, AddEventModal, AddDocumentModal } from '@/components/app/modals';
import { SidebarProvider } from '@/components/ui/sidebar';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export default function Home() {
  const { user: authUser, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const [activeView, setActiveView] = useState('accueil');
  const [modal, setModal] = useState<string | null>(null);

  // This is the user whose data is being viewed. It can be the logged-in user or a collaborator.
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading && !authUser) {
      router.push('/login');
    }
    // When authUser is loaded, set the initial viewed user to be the logged-in user.
    if (authUser && !viewedUserId) {
        setViewedUserId(authUser.uid);
    }
  }, [authUser, isUserLoading, router, viewedUserId]);

  const loggedInUserDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
  const { data: loggedInUserData } = useDoc<User>(loggedInUserDocRef);

  const viewedUserDocRef = useMemoFirebase(() => viewedUserId ? doc(firestore, 'users', viewedUserId) : null, [viewedUserId, firestore]);
  const { data: viewedUserData } = useDoc<User>(viewedUserDocRef);

  // Fetch collaborators only if the logged-in user is a PATRON
  const collaboratorsQuery = useMemoFirebase(() => {
    if (!authUser || loggedInUserData?.role !== 'PATRON') return null;
    return query(collection(firestore, 'users'), where('managerId', '==', authUser.uid));
  }, [firestore, authUser, loggedInUserData?.role]);
  const { data: collaborators } = useCollection<User>(collaboratorsQuery);

  const handleLogout = () => {
    if (auth) {
      signOut(auth);
    }
  };

  const handleAddCollaborator = () => {
    if (collaborators && collaborators.length >= 1) { 
      setModal('paywall');
    } else {
      setModal('addUser');
    }
  };

  const authorId = viewedUserId;

  const transactionsQuery = useMemoFirebase(() => authorId ? query(collection(firestore, 'users', authorId, 'transactions')) : null, [firestore, authorId]);
  const { data: transactions } = useCollection<Transaction>(transactionsQuery);
  
  const recapsQuery = useMemoFirebase(() => authorId ? query(collection(firestore, 'users', authorId, 'recaps')) : null, [firestore, authorId]);
  const { data: recaps } = useCollection<Recap>(recapsQuery);

  const eventsQuery = useMemoFirebase(() => authorId ? query(collection(firestore, 'users', authorId, 'events')) : null, [firestore, authorId]);
  const { data: events } = useCollection<CalendarEvent>(eventsQuery);

  const documentsQuery = useMemoFirebase(() => authorId ? query(collection(firestore, 'users', authorId, 'documents')) : null, [firestore, authorId]);
  const { data: documents } = useCollection<DocumentFile>(documentsQuery);
  
  const commentsQuery = useMemoFirebase(() => {
    if (!authorId || !recaps?.length) return null;
    // Note: This creates multiple listeners if there are many recaps.
    // This is not ideal for performance but works for this scope.
    // A better implementation would involve a more complex query or data denormalization.
    const recapIds = recaps.map(r => r.id);
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
  
  const handleAddUser = async (newUser: Omit<User, 'id' | 'email' | 'role' | 'managerId' | 'avatar'>) => {
    if (!authUser) return;
  
    // In a real app, you would use a Cloud Function to create the user to keep credentials secure.
    // For this prototype, we'll create a placeholder user document.
    const newUserId = `user_${Date.now()}`;
    const userDocRef = doc(firestore, "users", newUserId);
  
    const fullUser: User = {
      id: newUserId,
      email: `${newUser.name.replace(/\s+/g, '.').toLowerCase()}@tracklyo.auto`,
      role: 'RESPONSABLE',
      managerId: authUser.uid,
      avatar: `https://picsum.photos/seed/${newUserId}/100/100`,
      name: newUser.name,
      phoneNumber: newUser.phoneNumber,
    };
  
    setDocumentNonBlocking(userDocRef, fullUser, {});
    setModal(null);
  }

  const handleAddDocument = (newDocument: Omit<DocumentFile, 'id' | 'authorId' | 'date'>) => {
    if (!authorId) return;
    const ref = collection(firestore, 'users', authorId, 'documents');
    addDocumentNonBlocking(ref, { 
        ...newDocument,
        authorId,
        date: new Date().toISOString()
     });
    setModal(null);
  };
  
  const allUsersForActivity = useMemo(() => {
    const userList: User[] = [];
    if(loggedInUserData) userList.push(loggedInUserData);
    if(collaborators) userList.push(...collaborators);
    if(viewedUserData && !userList.find(u => u.id === viewedUserData.id)) {
        userList.push(viewedUserData);
    }
    return userList;
  }, [loggedInUserData, collaborators, viewedUserData]);


  if (isUserLoading || !authUser || !loggedInUserData) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Chargement de votre espace de travail...</p>
        </div>
    );
  }

  const renderContent = () => {
    if (!viewedUserData) {
        return (
             <div className="flex items-center justify-center pt-20">
                <p>Sélectionnez un collaborateur pour voir ses données.</p>
            </div>
        )
    }

    switch(activeView) {
      case 'accueil':
        return (
          <DashboardView
            user={viewedUserData!}
            transactions={transactions || []}
            recaps={recaps || []}
            events={events || []}
            onQuickAdd={(type) => setModal(type)}
            setActiveView={setActiveView}
          />
        );
      case 'finances':
        return (
          <FinancesView 
            transactions={transactions || []} 
            onAddTransaction={() => setModal('addTransaction')}
            viewAs={loggedInUserData.role} // The logged-in user's role determines if they can add budget
          />
        );
      case 'activite':
        return (
          <ActivityView
            recaps={recaps || []}
            comments={comments || []}
            users={allUsersForActivity}
            onAddRecap={() => setModal('addRecap')}
            currentUser={loggedInUserData}
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
      case 'fichiers':
        return (
          <FilesView 
            documents={documents || []} 
            onAddDocument={() => setModal('addDocument')}
          />
        );
      default:
        return <DashboardView user={viewedUserData!} transactions={transactions || []} recaps={recaps || []} events={events || []} onQuickAdd={(type) => setModal(type)} setActiveView={setActiveView} />;
    }
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen bg-gray-100 dark:bg-neutral-900">
        <AppSidebar
          loggedInUser={loggedInUserData}
          collaborators={collaborators || []}
          activeView={activeView}
          setActiveView={setActiveView}
          onLogout={handleLogout}
          onAddCollaborator={handleAddCollaborator}
          viewedUserId={viewedUserId}
          setViewedUserId={setViewedUserId}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            <AppHeader user={viewedUserData} />
            <div className="mt-6">
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {viewedUserData && <WhatsAppFab phoneNumber={viewedUserData.phoneNumber} />}
      
      <PaywallModal isOpen={modal === 'paywall'} onClose={() => setModal(null)} />
      <AddUserModal isOpen={modal === 'addUser'} onClose={() => setModal(null)} onAddUser={handleAddUser} />
      <AddTransactionModal 
        isOpen={modal === 'addTransaction'} 
        onClose={() => setModal(null)} 
        onAddTransaction={handleAddTransaction} 
        authorId={authorId!}
        viewAs={loggedInUserData.role}
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
      <AddDocumentModal
        isOpen={modal === 'addDocument'}
        onClose={() => setModal(null)}
        onAddDocument={handleAddDocument}
        authorId={authorId!}
      />
    </SidebarProvider>
  );
}
