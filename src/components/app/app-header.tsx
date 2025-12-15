"use client"

import React from 'react'
import type { User } from '@/lib/definitions'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type AppHeaderProps = {
  user: User;
}

const AppHeader = ({ user }: AppHeaderProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  }

  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          {getGreeting()}, <span className="text-primary">{user.name.split(' ')[0]}</span>.
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Voici ce qui se passe aujourd'hui.</p>
      </div>
      <div className="hidden sm:flex items-center gap-2 bg-card p-2 rounded-full">
        <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
        <p className="text-sm font-medium text-foreground">{format(new Date(), 'eeee d MMMM', { locale: fr })}</p>
      </div>
    </header>
  )
}

export default AppHeader
