"use client"

import React from 'react'
import type { User } from '@/lib/definitions'
import { Skeleton } from '../ui/skeleton'
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase'
import { collection, doc, query, where } from 'firebase/firestore'
import ResponsableDashboard from './responsable-dashboard'
import PatronDashboard from './patron-dashboard'

type DashboardViewProps = {
  viewedUserId: string | null
  onQuickAdd: (modal: any) => void
  setActiveView: (view: string) => void
}

const DashboardView = ({ viewedUserId, onQuickAdd, setActiveView }: DashboardViewProps) => {
  const firestore = useFirestore()

  const userDocRef = useMemoFirebase(
    () => (viewedUserId ? doc(firestore, 'users', viewedUserId) : null),
    [firestore, viewedUserId]
  )
  const { data: user, isLoading: isUserLoading } = useDoc<User>(userDocRef)

  // Fetch collaborators if user is PATRON
  const collaboratorsQuery = useMemoFirebase(
    () =>
      viewedUserId && user?.role === 'PATRON'
        ? query(collection(firestore, 'users'), where('managerId', '==', viewedUserId))
        : null,
    [firestore, viewedUserId, user]
  )
  const { data: collaborators, isLoading: areCollaboratorsLoading } = useCollection<User>(collaboratorsQuery)

  if (isUserLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-[300px] rounded-4xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Skeleton className="h-[120px] rounded-4xl" />
          <Skeleton className="h-[120px] rounded-4xl" />
        </div>
        <Skeleton className="h-[300px] rounded-4xl" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p>Impossible de charger les données de l'utilisateur.</p>
      </div>
    )
  }

  // Route to appropriate dashboard based on role
  if (user.role === 'RESPONSABLE') {
    return (
      <ResponsableDashboard
        viewedUserId={viewedUserId}
        onQuickAdd={onQuickAdd}
        setActiveView={setActiveView}
      />
    )
  }

  // PATRON dashboard
  if (areCollaboratorsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[280px] rounded-4xl" />
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[120px] rounded-4xl" />
            <Skeleton className="h-[350px] rounded-4xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <PatronDashboard
      viewedUserId={viewedUserId}
      collaborators={collaborators || []}
      onQuickAdd={onQuickAdd}
      setActiveView={setActiveView}
    />
  )
}

export default DashboardView
