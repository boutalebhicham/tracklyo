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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import type { User } from '@/lib/definitions'
import { LayoutGrid, Wand, Activity, Calendar, Folder, Landmark, LogOut, User as UserIcon } from 'lucide-react'
import { Badge } from '../ui/badge'
import Logo from './logo'

type AppSidebarProps = {
  currentUser: User
  activeView: string
  setActiveView: (view: string) => void
  onLogout: () => void;
}

const menuItems = [
  { id: 'accueil', label: 'Accueil', icon: LayoutGrid },
  { id: 'activite', label: 'Activité', icon: Activity },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'fichiers', label: 'Fichiers', icon: Folder },
  { id: 'budget', label: 'Budget', icon: Landmark },
];

const AppSidebar = ({
  currentUser,
  activeView,
  setActiveView,
  onLogout
}: AppSidebarProps) => {

  const handleViewChange = (viewId: string) => {
    if (viewId === 'budget') {
      setActiveView('finances');
    } else {
      setActiveView(viewId);
    }
  };

  return (
    <Sidebar className="w-72 rounded-r-4xl">
      <SidebarHeader className="p-6">
         <Logo className="h-10 w-auto text-white" />
      </SidebarHeader>
      
      <SidebarContent className="flex flex-col justify-between p-4">
        <div className="space-y-4">
          <div className="px-2">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/20">
              <Avatar className="h-10 w-10 relative">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar-background"></div>
              </Avatar>
              <div>
                <p className="font-semibold text-sm text-white">{currentUser.name}</p>
                <p className="text-xs uppercase text-sidebar-foreground/60 tracking-wider">{currentUser.role === 'PATRON' ? 'Manager' : currentUser.role}</p>
              </div>
            </div>
          </div>
          
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => handleViewChange(item.id)}
                  isActive={activeView === item.id || (activeView === 'finances' && item.id === 'budget')}
                  className="w-full justify-start text-base font-normal h-12"
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                   {item.id === 'ia' && <Badge className="ml-auto bg-primary/20 text-primary border-primary/30">Nouveau</Badge>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>

        <SidebarFooter className="mt-auto p-2 space-y-2">
           <Button onClick={onLogout} variant="ghost" className="w-full justify-start h-12 text-base font-normal rounded-xl hover:bg-black/20">
                <LogOut size={20} className="mr-3" />
                Déconnexion
            </Button>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar
