

"use client"

import React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import type { User } from '@/lib/definitions'
import { LayoutGrid, Activity, Calendar, Folder, Landmark, LogOut } from 'lucide-react'
import Logo from './logo'
import CollaboratorSwitcher from './collaborator-switcher'

type AppSidebarProps = {
  loggedInUser: User
  collaborators: User[]
  activeView: string
  setActiveView: (view: string) => void
  onLogout: () => void;
  onAddCollaborator: () => void;
  viewedUserId: string | null;
  setViewedUserId: (id: string) => void;
}

export const menuItems = [
  { id: 'accueil', label: 'Accueil', icon: LayoutGrid },
  { id: 'activite', label: 'Activité', icon: Activity },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'fichiers', label: 'Fichiers', icon: Folder },
  { id: 'finances', label: 'Finances', icon: Landmark },
];

const AppSidebar = ({
  loggedInUser,
  collaborators,
  activeView,
  setActiveView,
  onLogout,
  onAddCollaborator,
  viewedUserId,
  setViewedUserId
}: AppSidebarProps) => {

  const handleViewChange = (viewId: string) => {
    setActiveView(viewId);
  };
  
  const isPatron = loggedInUser.role === 'PATRON';

  return (
    <Sidebar className="w-72 rounded-r-4xl hidden md:flex">
      <SidebarHeader className="p-6">
         <Logo className="h-10 w-auto text-white" />
      </SidebarHeader>
      
      <SidebarContent className="flex flex-col justify-between p-4">
        <div className="flex-grow">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => handleViewChange(item.id)}
                  isActive={activeView === item.id}
                  className="w-full justify-start text-base font-normal h-12"
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>

        <div className="space-y-4">
          {isPatron ? (
            <CollaboratorSwitcher 
              patron={loggedInUser}
              collaborators={collaborators}
              onAddCollaborator={onAddCollaborator}
              activeCollaboratorId={viewedUserId}
              onCollaboratorChange={setViewedUserId}
            />
          ) : null }
          <SidebarFooter className="p-2 space-y-2">
            <Button onClick={onLogout} variant="ghost" className="w-full justify-start h-12 text-base font-normal rounded-xl hover:bg-black/20">
                  <LogOut size={20} className="mr-3" />
                  Déconnexion
              </Button>
          </SidebarFooter>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar
    