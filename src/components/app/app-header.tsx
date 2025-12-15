"use client"

import React from 'react'
import type { User } from '@/lib/definitions'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

type AppHeaderProps = {
  user: User;
  isMobile: boolean;
}

const AppHeader = ({ user, isMobile }: AppHeaderProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  }

  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {getGreeting()}, {user.name.split(' ')[0]}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Voici le résumé de l'activité.</p>
      </div>
      {isMobile && (
        <SidebarTrigger>
          <Button variant="ghost" size="icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Button>
        </SidebarTrigger>
      )}
    </header>
  )
}

export default AppHeader
