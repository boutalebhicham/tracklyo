"use client"

import React from 'react'
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import type { User } from '@/lib/definitions'
import { LogOut, Plus, Users, CheckCircle2 } from 'lucide-react'

type AppSidebarProps = {
  currentUser: User
  viewAs: 'PATRON' | 'RESPONSABLE'
  setViewAs: (role: 'PATRON' | 'RESPONSABLE') => void
  responsables: User[]
  selectedResponsable: User
  setSelectedResponsable: (user: User) => void
  onAddCollaborator: () => void
}

const AppSidebar = ({
  currentUser,
  viewAs,
  setViewAs,
  responsables,
  selectedResponsable,
  setSelectedResponsable,
  onAddCollaborator,
}: AppSidebarProps) => {

  const handleRoleSwitch = (checked: boolean) => {
    setViewAs(checked ? 'RESPONSABLE' : 'PATRON')
  }

  return (
    <Sidebar className="border-r-0" variant="sidebar">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tracklyo</h2>
          <div className="ml-auto hidden md:block">
            <SidebarTrigger>
              <Button variant="ghost" size="icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6H20M4 12H12M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </Button>
            </SidebarTrigger>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="flex flex-col justify-between px-4">
        <div>
          {currentUser.role === 'PATRON' && (
            <div className="p-4 bg-gray-100 dark:bg-neutral-800 rounded-3xl mb-6">
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="role-switch" className="font-semibold text-base">Vue Patron</Label>
                <Switch
                  id="role-switch"
                  checked={viewAs === 'RESPONSABLE'}
                  onCheckedChange={handleRoleSwitch}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Basculez pour voir votre propre tableau de bord.</p>
            </div>
          )}

          {viewAs === 'PATRON' && (
            <>
              <p className="px-2 text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">MANAGERS</p>
              <SidebarMenu>
                {responsables.map((user) => (
                  <SidebarMenuItem key={user.id}>
                    <button
                      onClick={() => setSelectedResponsable(user)}
                      className={`flex items-center gap-3 w-full p-3 rounded-2xl text-left transition-colors ${selectedResponsable.id === user.id ? 'bg-primary/10 text-primary dark:bg-primary/20' : 'hover:bg-gray-100 dark:hover:bg-neutral-800'}`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 dark:text-white">{user.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Responsable</p>
                      </div>
                      {selectedResponsable.id === user.id && <CheckCircle2 className="text-primary" size={20} />}
                    </button>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              <Button onClick={onAddCollaborator} variant="outline" className="w-full mt-4 rounded-xl gap-2 backdrop-blur-sm bg-background/70">
                <Plus size={16} /> Ajouter un collaborateur
              </Button>
            </>
          )}
        </div>

        <SidebarFooter className="mt-auto p-0">
          <div className="p-3 bg-gray-100 dark:bg-neutral-800/50 rounded-3xl flex items-center gap-3">
             <Avatar className="h-12 w-12">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-bold text-gray-800 dark:text-white">{currentUser.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{currentUser.role === 'PATRON' ? 'Directeur' : 'Responsable'}</p>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full">
                <LogOut size={20}/>
              </Button>
          </div>
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  )
}

export default AppSidebar
