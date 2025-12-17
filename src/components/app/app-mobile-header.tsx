
"use client"

import React from 'react'
import type { User } from '@/lib/definitions'
import CollaboratorSwitcher from './collaborator-switcher'
import { Button } from '../ui/button'
import { LogOut } from 'lucide-react'
import { Skeleton } from '../ui/skeleton'

type AppMobileHeaderProps = {
  loggedInUser: User | null
  collaborators: User[]
  viewedUserId: string | null
  setViewedUserId: (id: string) => void
  onAddCollaborator: () => void
  onLogout: () => void
}

const AppMobileHeader = (props: AppMobileHeaderProps) => {
  if (!props.loggedInUser) {
    return (
      <header className="md:hidden sticky top-0 bg-background/80 backdrop-blur-lg z-10 p-2 border-b">
        <div className="flex items-center justify-between">
          <Skeleton className="h-12 w-48 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </header>
    );
  }

  return (
    <header className="md:hidden sticky top-0 bg-background/80 backdrop-blur-lg z-10 p-2 border-b">
      <div className="flex items-center justify-between">
        <CollaboratorSwitcher 
          patron={props.loggedInUser}
          collaborators={props.collaborators}
          activeCollaboratorId={props.viewedUserId}
          onCollaboratorChange={props.setViewedUserId}
          onAddCollaborator={props.onAddCollaborator}
        />
        <Button onClick={props.onLogout} variant="ghost" size="icon" className="rounded-full">
            <LogOut size={20} />
        </Button>
      </div>
    </header>
  )
}

export default AppMobileHeader
