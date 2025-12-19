
"use client"

import React from 'react'
import type { User } from '@/lib/definitions'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Skeleton } from '../ui/skeleton'

type AppHeaderProps = {
  user: User | null | undefined;
  actions?: React.ReactNode;
}

const AppHeader = ({ user, actions }: AppHeaderProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  }

  // Handle the case where user data is still loading
  if (user === undefined) {
      return (
          <header className="flex items-center justify-between">
              <div>
                  <Skeleton className="h-10 w-64 mb-2" />
                  <Skeleton className="h-5 w-80" />
              </div>
          </header>
      )
  }

  // Extract first name, but handle edge cases like "Nouveau Gestionnaire"
  const userName = user ? user.name.split(' ')[0] : null;
  const isDefaultName = user?.name === 'Nouveau Gestionnaire';

  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          {getGreeting()}
          {userName && !isDefaultName ? <>, <span className="text-primary">{userName}</span>.</> : '.'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
            {user && !isDefaultName ? `Voici un aperçu de l'activité de ${userName}.` : "Voici ce qui se passe aujourd'hui."}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <div className="hidden sm:flex items-center gap-2 bg-card p-2 rounded-full">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
          <p className="text-sm font-medium text-foreground">{format(new Date(), 'eeee d MMMM', { locale: fr })}</p>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
