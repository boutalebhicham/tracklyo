

"use client"

import React from 'react'
import { menuItems } from './app-sidebar'
import { cn } from '@/lib/utils'
import { ListTodo } from 'lucide-react'

type AppBottomNavProps = {
  activeView: string
  setActiveView: (view: string) => void
}

const mobileMenuItems = menuItems.filter(item => ['accueil', 'activite', 'todo', 'agenda', 'finances'].includes(item.id));
if (!mobileMenuItems.find(i => i.id === 'todo')) {
    mobileMenuItems.splice(2, 0, { id: 'todo', label: 'To-Do', icon: ListTodo });
}


const AppBottomNav = ({ activeView, setActiveView }: AppBottomNavProps) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-lg border-t z-10">
      <div className="flex justify-around items-center h-full">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-xs w-16 transition-colors",
              activeView === item.id ? 'text-primary' : 'text-muted-foreground hover:text-primary'
            )}
          >
            <item.icon size={22} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default AppBottomNav
