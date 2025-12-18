
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, doc } from 'firebase/firestore';
import { useCollection, useDoc } from '@/firebase';
import type { User, AddUserForm, Transaction, Recap, Event, Document as DocumentFile } from '@/lib/definitions';
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
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import AppMobileHeader from '@/components/app/app-mobile-header';
import AppBottomNav from '@/components/app/app-bottom-nav';
import { Skeleton } from '@/components/ui/skeleton';

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

  // This effect handles redirection based on auth state
  useEffect(() => {
    // When auth state is resolved
    if (!isUserLoading) {
      // If there is no user, redirect to login
      if (!authUser) {
        router.push('/login');
      } else {
        // If there is a user but no viewedUserId is set, set it to the logged-in user's ID
        if (!viewedUserId) {
          setViewedUserId(authUser.uid);
        }
      }
    }
  }, [authUser, isUserLoading, router, viewedUserId]);


  const loggedInUserDocRef = useMemoFirebase(() => {
    if (!authUser?.uid) return null;
    return doc(firestore, 'users', authUser.uid);
  }, [firestore, authUser]);
  const { data: loggedInUserData, isLoading: isPatronLoading } = useDoc<User>(loggedInUserDocRef);

  const viewedUserDocRef = useMemoFirebase(() => {
    if (!viewedUserId) return null;
    return doc(firestore, 'users', viewedUserId);
  }, [firestore, viewedUserId]);
  const { data: viewedUserData, isLoading: isViewedUserLoading } = useDoc<User>(viewedUserDocRef);

  const collaboratorsQuery = useMemoFirebase(() => {
    if (!authUser?.uid || loggedInUserData?.role !== 'PATRON') return null;
    return query(collection(firestore, 'users'), where('managerId', '==', authUser.uid));
  }, [firestore, authUser, loggedInUserData]);
  const { data: collaborators, isLoading: areCollaboratorsLoading } = useCollection<User>(collaboratorsQuery);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // The useEffect hook will handle redirection to /login
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if signOut fails
      router.push('/login');
    }
  };

  const handleAddCollaborator = () => {
    if (collaborators && collaborators.length >= 1) { 
      setModal('paywall');
    } else {
      setModal('addUser');
    }
  };
  
  const handleAddTransaction = (newTransaction: Omit<Transaction, 'id' | 'authorId' | 'date'>) => {
    if (!viewedUserId) return;
    const ref = collection(firestore, 'users', viewedUserId, 'transactions');
    addDocumentNonBlocking(ref, {
      ...newTransaction,
      authorId: viewedUserId,
      date: new Date().toISOString(),
    });
    setModal(null);
  };
  
  const handleAddRecap = (newRecap: Omit<Recap, 'id' | 'authorId' | 'date'>) => {
    if (!viewedUserId) return;
    const ref = collection(firestore, 'users', viewedUserId, 'recaps');
    addDocumentNonBlocking(ref, { 
        ...newRecap,
        authorId: viewedUserId,
        date: new Date().toISOString()
     });
    setModal(null);
  };
  
  const handleAddEvent = (newEvent: Omit<Event, 'id' | 'authorId'>) => {
    if (!viewedUserId) return;
    const ref = collection(firestore, 'users', viewedUserId, 'events');
    addDocumentNonBlocking(ref, { 
        ...newEvent,
        authorId: viewedUserId
     });
    setModal(null);
  };

  const handleAddUser = async (newUser: AddUserForm) => {
    if (!authUser) return;

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
      setModal(null);

    } catch (error: any) {
      console.error("[handleAddUser] Error creating collaborator:", error);
      toast({ variant: "destructive", title: "Erreur", description: error.message || "Impossible de créer le collaborateur." });
      setModal(null);
    }
  }

  const handleAddDocument = (newDocument: Omit<DocumentFile, 'id' | 'authorId' | 'date'>) => {
    if (!viewedUserId) return;
    const ref = collection(firestore, 'users', viewedUserId, 'documents');
    addDocumentNonBlocking(ref, { 
        ...newDocument,
        authorId: viewedUserId,
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

  // While the auth state is loading, show a full-screen loader.
  // The redirection logic is handled in the useEffect hook.
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <p>Chargement de votre espace de travail...</p>
      </div>
    );
  }

  // If user is not authenticated, the useEffect hook will redirect, so we can return null.
  if (!authUser) {
    return null;
  }

  const renderContent = () => {
    switch(activeView) {
      case 'accueil':
        return <DashboardView viewedUserId={viewedUserId} onQuickAdd={(type) => setModal(type)} setActiveView={setActiveView} />;
      case 'finances':
        return <FinancesView viewedUserId={viewedUserId} onAddTransaction={() => setModal('addTransaction')} viewAs={loggedInUserData?.role} />;
      case 'activite':
        return <ActivityView viewedUserId={viewedUserId} users={allUsersForActivity} onAddRecap={() => setModal('addRecap')} currentUser={loggedInUserData} />;
      case 'agenda':
        return <CalendarView viewedUserId={viewedUserId} onAddEvent={() => setModal('addEvent')} />;
      case 'fichiers':
        return <FilesView viewedUserId={viewedUserId} onAddDocument={() => setModal('addDocument')} />;
      default:
        return <DashboardView viewedUserId={viewedUserId} onQuickAdd={(type) => setModal(type)} setActiveView={setActiveView} />;
    }
  }

  return (
    <SidebarProvider>
      <div className="flex w-full min-h-screen bg-gray-100 dark:bg-neutral-900">
        {isPatronLoading || !loggedInUserData ? (
           <div className="hidden md:flex w-72"><Skeleton className="h-full w-full rounded-r-4xl" /></div>
        ) : (
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
           {isMobile && (
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
            <AppHeader user={isViewedUserLoading ? undefined : viewedUserData} />
            <div className="mt-6">
              {renderContent()}
            </div>
          </div>
        </main>
        {isMobile && <AppBottomNav activeView={activeView} setActiveView={setActiveView} />}
      </div>

      {viewedUserData && <WhatsAppFab phoneNumber={viewedUserData.phoneNumber} />}
      
      <PaywallModal isOpen={modal === 'paywall'} onClose={() => setModal(null)} />
      <AddUserModal isOpen={modal === 'addUser'} onClose={() => setModal(null)} onAddUser={handleAddUser} />
      {viewedUserId && loggedInUserData && (
        <>
          <AddTransactionModal 
            isOpen={modal === 'addTransaction'} 
            onClose={() => setModal(null)} 
            onAddTransaction={handleAddTransaction} 
            authorId={viewedUserId}
            viewAs={loggedInUserData.role}
          />
          <AddRecapModal 
            isOpen={modal === 'addRecap'} 
            onClose={() => setModal(null)} 
            onAddRecap={handleAddRecap}
            authorId={viewedUserId}
          />
          <AddEventModal
            isOpen={modal === 'addEvent'}
            onClose={() => setModal(null)}
            onAddEvent={handleAddEvent}
            authorId={viewedUserId}
          />
          <AddDocumentModal
            isOpen={modal === 'addDocument'}
            onClose={() => setModal(null)}
            onAddDocument={handleAddDocument}
            authorId={viewedUserId}
          />
        </>
      )}
    </SidebarProvider>
  );
}

    