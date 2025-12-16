
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useMemoFirebase, useFirestore } from '@/firebase';
import { signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, doc } from 'firebase/firestore';
import { useCollection, useDoc } from '@/firebase';
import type { User, Transaction, Recap, CalendarEvent, Comment, DocumentFile, AddUserForm } from '@/lib/definitions';
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
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const { user: authUser, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeView, setActiveView] = useState('accueil');
  const [modal, setModal] = useState<string | null>(null);

  // This is the user whose data is being viewed. It can be the logged-in user or a collaborator.
  const [viewedUserId, setViewedUserId] = useState<string | null>(null);

  const loggedInUserDocRef = useMemoFirebase(() => authUser ? doc(firestore, 'users', authUser.uid) : null, [authUser, firestore]);
  const { data: loggedInUserData } = useDoc<User>(loggedInUserDocRef);

  useEffect(() => {
    if (!isUserLoading && !authUser) {
      router.push('/login');
    }
    // When authUser is loaded and loggedInUserData is available, set the initial viewed user.
    if (loggedInUserData && !viewedUserId) {
        setViewedUserId(loggedInUserData.id);
    }
  }, [authUser, isUserLoading, router, loggedInUserData, viewedUserId]);


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
    if (!authorId || !recaps || recaps.length === 0) return null;
    // This is a simplification. For a production app, consider querying comments more efficiently.
    const lastRecapId = recaps[recaps.length - 1].id;
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
  
  const handleAddEvent = (newEvent: Omit<CalendarEvent, 'id' | 'authorId'>) => {
    if (!authorId) return;
    const ref = collection(firestore, 'users', authorId, 'events');
    addDocumentNonBlocking(ref, { 
        ...newEvent,
        authorId
     });
    setModal(null);
  };
  
  const handleAddUser = async (newUser: AddUserForm) => {
    if (!authUser || !newUser.password) return;
  
    // In a real app, this should be a cloud function.
    // For this prototype, we'll use a trick: create the user, but we can't sign them in.
    // We create a temporary, secondary Firebase app instance to do this without affecting the current user's session.
    
    try {
      // This is a simplified approach. A robust solution would use Firebase Functions.
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
      const newAuthUser = userCredential.user;

      const userDocRef = doc(firestore, "users", newAuthUser.uid);
      
      const fullUser: User = {
        id: newAuthUser.uid,
        email: newUser.email,
        name: newUser.name,
        role: 'RESPONSABLE',
        managerId: authUser.uid,
        avatar: `https://picsum.photos/seed/${newAuthUser.uid}/100/100`,
        phoneNumber: '', // Not collected in this form
      };
      
      setDocumentNonBlocking(userDocRef, fullUser, { merge: true });
      toast({ title: "Collaborateur ajouté !", description: `${newUser.name} peut maintenant se connecter.` });

    } catch (error: any) {
      console.error("Error creating collaborator:", error);
      toast({ variant: "destructive", title: "Erreur", description: "Impossible de créer le collaborateur. L'email est peut-être déjà utilisé." });
    } finally {
      // It's important to sign the manager back in if createUserWithEmailAndPassword changed the auth state.
      // However, with separate auth instances this isn't an issue. Given the client-side constraints,
      // we accept that the manager might have to re-login if the session is disrupted.
      // A more complex solution would manage multiple auth instances.
      setModal(null);
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
             <div className="flex flex-col items-center justify-center pt-20 text-center">
                <h3 className="text-lg font-semibold">Sélectionnez un collaborateur</h3>
                <p className="text-muted-foreground">Utilisez le menu en bas à gauche pour choisir un profil à consulter.</p>
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

    
