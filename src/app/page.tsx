
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { useCollection, useDoc } from '@/firebase';
import type { User, Transaction, Recap, Event, Comment, Document as DocumentFile, AddUserForm, Todo } from '@/lib/definitions';
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
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import AppMobileHeader from '@/components/app/app-mobile-header';
import AppBottomNav from '@/components/app/app-bottom-nav';

export default function Home() {
  const { user: authUser, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [activeView, setActiveView] = useState('accueil');
  const [modal, setModal] = useState<string | null>(null);
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);

  const loggedInUserDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
  const { data: loggedInUserData } = useDoc<User>(loggedInUserDocRef);

  useEffect(() => {
    if (!isUserLoading && !authUser) {
      router.push('/login');
    }
    // Set the viewed user to the logged-in user initially, as soon as auth is resolved.
    if (authUser && !viewedUserId) {
        setViewedUserId(authUser.uid);
    }
  }, [authUser, isUserLoading, router]);


  const viewedUserDocRef = useMemoFirebase(() => viewedUserId ? doc(firestore, 'users', viewedUserId) : null, [viewedUserId, firestore]);
  const { data: viewedUserData } = useDoc<User>(viewedUserDocRef);

  const collaboratorsQuery = useMemoFirebase(() => {
    if (!authUser || !loggedInUserData || loggedInUserData.role !== 'PATRON') return null;
    return query(collection(firestore, 'users'), where('managerId', '==', authUser.uid));
  }, [firestore, authUser, loggedInUserData]);
  const { data: collaborators } = useCollection<User>(collaboratorsQuery);

  const handleLogout = () => {
    signOut(auth);
    router.push('/login');
  };

  const handleAddCollaborator = () => {
    if (collaborators && collaborators.length >= 1) { 
      setModal('paywall');
    } else {
      setModal('addUser');
    }
  };

  const authorId = authUser ? viewedUserId : null;

  const transactionsQuery = useMemoFirebase(() => authorId ? query(collection(firestore, 'users', authorId, 'transactions')) : null, [firestore, authorId]);
  const { data: transactions } = useCollection<Transaction>(transactionsQuery);
  
  const recapsQuery = useMemoFirebase(() => authorId ? query(collection(firestore, 'users', authorId, 'recaps')) : null, [firestore, authorId]);
  const { data: recaps } = useCollection<Recap>(recapsQuery);

  const eventsQuery = useMemoFirebase(() => authorId ? query(collection(firestore, 'users', authorId, 'events')) : null, [firestore, authorId]);
  const { data: events } = useCollection<Event>(eventsQuery);

  const documentsQuery = useMemoFirebase(() => authorId ? query(collection(firestore, 'users', authorId, 'documents')) : null, [firestore, authorId]);
  const { data: documents } = useCollection<DocumentFile>(documentsQuery);
  
  const commentsQuery = useMemoFirebase(() => {
    if (!authorId || !recaps || recaps.length === 0) return null;
    // This might be inefficient if there are many recaps. Consider fetching comments for visible recaps.
    const lastRecapId = recaps.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.id;
    if (!lastRecapId) return null;
    return query(collection(firestore, `users/${authorId}/recaps/${lastRecapId}/comments`));
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
  
  const handleAddEvent = (newEvent: Omit<Event, 'id' | 'authorId'>) => {
    if (!authorId) return;
    const ref = collection(firestore, 'users', authorId, 'events');
    addDocumentNonBlocking(ref, { 
        ...newEvent,
        authorId
     });
    setModal(null);
  };

  const handleAddUser = async (newUser: AddUserForm) => {
    if (!authUser) return;
    setModal(null);

    try {
      const idToken = await authUser.getIdToken();
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "La création de l'utilisateur a échoué.");
      }
      
      await response.json();

      toast({ title: "Collaborateur ajouté !", description: `${newUser.name} peut maintenant se connecter.` });

    } catch (error: any) {
      console.error("Error creating collaborator:", error);
      toast({ variant: "destructive", title: "Erreur", description: error.message || "Impossible de créer le collaborateur." });
    }
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
    return userList;
  }, [loggedInUserData, collaborators]);


  if (isUserLoading || !authUser) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <p>Chargement de votre espace de travail...</p>
        </div>
    );
  }

  const renderContent = () => {
    // We now render the content as soon as auth is ready.
    // The individual views will handle their own loading states based on the data they receive.
    const userToDisplay = viewedUserData || loggedInUserData;

    switch(activeView) {
      case 'accueil':
        return (
          <DashboardView
            user={userToDisplay}
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
            viewAs={loggedInUserData?.role}
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
        return <DashboardView user={userToDisplay} transactions={transactions || []} recaps={recaps || []} events={events || []} onQuickAdd={(type) => setModal(type)} setActiveView={setActiveView} />;
    }
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen bg-gray-100 dark:bg-neutral-900">
        {loggedInUserData && (
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
        )}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
           {isMobile && loggedInUserData && (
            <AppMobileHeader 
              loggedInUser={loggedInUserData}
              collaborators={collaborators || []}
              viewedUserId={viewedUserId}
              setViewedUserId={setViewedUserId}
              onAddCollaborator={handleAddCollaborator}
              onLogout={handleLogout}
            />
          )}
          <div className="p-4 sm:p-6 lg:p-8">
            {!isMobile && <AppHeader user={viewedUserData || loggedInUserData} />}
            <div className="mt-6">
              {renderContent()}
            </div>
          </div>
        </main>
        {isMobile && <AppBottomNav activeView={activeView} setActiveView={setActiveView} />}
      </div>

      {viewedUserData && <WhatsAppFab phoneNumber={viewedUserData.phoneNumber} />}
      
      <PaywallModal isOpen={modal === 'paywall'} onClose={() => setModal(null)} />
      {loggedInUserData && <AddUserModal isOpen={modal === 'addUser'} onClose={() => setModal(null)} onAddUser={handleAddUser} />}
      {authorId && loggedInUserData && (
        <>
          <AddTransactionModal 
            isOpen={modal === 'addTransaction'} 
            onClose={() => setModal(null)} 
            onAddTransaction={handleAddTransaction} 
            authorId={authorId}
            viewAs={loggedInUserData.role}
            transactions={transactions || []}
          />
          <AddRecapModal 
            isOpen={modal === 'addRecap'} 
            onClose={() => setModal(null)} 
            onAddRecap={handleAddRecap}
            authorId={authorId}
          />
          <AddEventModal
            isOpen={modal === 'addEvent'}
            onClose={() => setModal(null)}
            onAddEvent={handleAddEvent}
            authorId={authorId}
          />
          <AddDocumentModal
            isOpen={modal === 'addDocument'}
            onClose={() => setModal(null)}
            onAddDocument={handleAddDocument}
            authorId={authorId}
          />
        </>
      )}
    </SidebarProvider>
  );
}
