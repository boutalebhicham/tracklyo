"use client"

import React from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { User, UserRole } from '@/lib/definitions'
import { Plus, Users, CheckCircle2, LayoutGrid, Wand, Activity, Calendar, Folder, Landmark, LogOut } from 'lucide-react'
import { Badge } from '../ui/badge'

type AppSidebarProps = {
  currentUser: User
  viewAs: UserRole
  setViewAs: (role: UserRole) => void
  responsables: User[]
  selectedResponsable: User
  setSelectedResponsable: (user: User) => void
  onAddCollaborator: () => void
  activeView: string
  setActiveView: (view: string) => void
  onLogout: () => void;
}

const menuItems = [
  { id: 'accueil', label: 'Accueil', icon: LayoutGrid },
  { id: 'ia', label: 'Assistant IA', icon: Wand },
  { id: 'activite', label: 'Activité', icon: Activity },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'fichiers', label: 'Fichiers', icon: Folder },
  { id: 'budget', label: 'Budget', icon: Landmark },
];

const AppSidebar = ({
  currentUser,
  viewAs,
  setViewAs,
  responsables,
  selectedResponsable,
  setSelectedResponsable,
  onAddCollaborator,
  activeView,
  setActiveView,
  onLogout
}: AppSidebarProps) => {

  const handleRoleSwitch = () => {
    setViewAs(currentUser.role === 'PATRON' ? 'RESPONSABLE' : 'PATRON')
  }

  const handleViewChange = (viewId: string) => {
    if (viewId === 'budget') {
      setActiveView('finances');
    } else {
      setActiveView(viewId);
    }
  };

  return (
    <Sidebar className="w-72">
      <SidebarHeader className="p-6 border-b border-sidebar-border">
         <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
            <AvatarFallback>{currentUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-base text-white">{currentUser.name}</p>
            <Badge variant="outline" className="text-xs capitalize border-sidebar-border text-sidebar-foreground/80 mt-1">
              {currentUser.role.toLowerCase()}
            </Badge>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col justify-between p-4">
        <div>
          {currentUser.role === 'PATRON' && (
            <div className="px-2 pb-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase">SUIVI DE :</p>
                <Button onClick={onAddCollaborator} variant="ghost" size="sm" className="h-auto px-2 py-1 text-xs">
                  <Plus size={14} className="mr-1" /> Ajouter
                </Button>
              </div>
              <div className="mt-2 space-y-1">
                {responsables.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedResponsable(user)}
                    className={`flex items-center gap-3 w-full p-2 rounded-lg text-left transition-colors ${selectedResponsable?.id === user.id ? 'bg-black/20' : 'hover:bg-black/10'}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-sm text-white">{user.name}</p>
                    {selectedResponsable?.id === user.id && <div className="w-2 h-2 rounded-full bg-primary ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <SidebarMenu className="mt-4">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => handleViewChange(item.id)}
                  isActive={activeView === item.id || (activeView === 'finances' && item.id === 'budget')}
                  className="w-full justify-start text-base font-medium h-12"
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                   {activeView === item.id && <div className="w-2 h-2 rounded-full bg-white ml-auto" />}
                   {item.id === 'ia' && <Badge className="ml-auto bg-primary/20 text-primary border-primary/30">Nouveau</Badge>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>

        <SidebarFooter className="mt-auto p-2">
          {currentUser.role === 'PATRON' && (
            <Button onClick={handleRoleSwitch} variant="ghost" className="w-full justify-center h-12 text-base">
                <Users size={20} className="mr-2" />
                {viewAs === 'PATRON' ? 'Voir comme Responsable' : 'Voir comme Patron'}
            </Button>
          )}
           <Button onClick={onLogout} variant="ghost" className="w-full justify-center h-12 text-base">
                <LogOut size={20} className="mr-2" />
                Déconnexion
            </Button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar
