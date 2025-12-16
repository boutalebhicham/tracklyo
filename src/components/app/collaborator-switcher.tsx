
"use client"

import React from 'react';
import type { User } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { useIsMobile } from '@/hooks/use-mobile';

type CollaboratorSwitcherProps = {
  patron: User;
  collaborators: User[];
  onAddCollaborator: () => void;
  activeCollaboratorId: string | null;
  onCollaboratorChange: (id: string) => void;
};

const CollaboratorSwitcher: React.FC<CollaboratorSwitcherProps> = ({
  patron,
  collaborators,
  onAddCollaborator,
  activeCollaboratorId,
  onCollaboratorChange,
}) => {
  const allUsers = [patron, ...collaborators];
  const activeUser = allUsers.find(u => u.id === activeCollaboratorId);
  const isMobile = useIsMobile();

  const desktopTrigger = (
     <Button variant="ghost" className="w-full h-auto justify-between items-center p-2 rounded-xl text-left hover:bg-black/20">
        <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
                <AvatarImage src={activeUser!.avatar} alt={activeUser!.name} />
                <AvatarFallback>{activeUser!.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium flex-1 truncate text-white">{activeUser!.name}</span>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-sidebar-foreground/60" />
    </Button>
  )

  const mobileTrigger = (
      <Button variant="ghost" className="h-auto p-1.5 rounded-full flex items-center gap-2 bg-slate-100 dark:bg-slate-800">
        <Avatar className="h-8 w-8">
            <AvatarImage src={activeUser!.avatar} alt={activeUser!.name} />
            <AvatarFallback>{activeUser!.name.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="text-left">
            <p className="text-xs text-muted-foreground">SUIVI DE</p>
            <p className="font-bold text-sm leading-tight">{activeUser!.name.split(' ')[0]}</p>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground ml-1" />
      </Button>
  )

  return (
    <div className={cn(!isMobile && "px-2 space-y-2")}>
        {!isMobile && (
          <h3 className="text-xs font-semibold uppercase text-sidebar-foreground/60 tracking-wider px-2">
              Suivi de :
          </h3>
        )}
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {activeUser ? (
                    isMobile ? mobileTrigger : desktopTrigger
                ) : (
                    <Button onClick={onAddCollaborator} variant={isMobile ? "outline" : "ghost"} className="w-full h-12 justify-start p-2 rounded-xl text-left hover:bg-black/20 text-sidebar-foreground/80">
                        <Plus size={16} className="mr-2"/> Ajouter
                    </Button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className={cn(isMobile ? "w-screen max-w-xs rounded-xl" : "w-64 rounded-xl bg-sidebar-border border-sidebar-border text-sidebar-foreground p-2")}
              side={isMobile ? "bottom" : "top"} 
              align="start"
            >
                <DropdownMenuLabel className={cn(isMobile ? "" : "text-sidebar-foreground/60")}>Changer de contexte</DropdownMenuLabel>
                <DropdownMenuSeparator className={cn(isMobile ? "" : "bg-sidebar-foreground/20")}/>
                {allUsers.map((user) => (
                    <DropdownMenuItem 
                        key={user.id}
                        onClick={() => onCollaboratorChange(user.id)}
                        className={cn(
                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer",
                            isMobile ? "focus:bg-slate-100 dark:focus:bg-slate-800" : "hover:!bg-primary/20",
                            activeCollaboratorId === user.id ? (isMobile ? "bg-slate-100 dark:bg-slate-800" : "bg-primary/20") : ""
                        )}
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium flex-1 truncate">{user.name}</span>
                        {activeCollaboratorId === user.id && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0"></div>
                        )}
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className={cn(isMobile ? "" : "bg-sidebar-foreground/20")}/>
                <DropdownMenuItem onClick={onAddCollaborator} className={cn("flex items-center gap-3 p-2 rounded-lg cursor-pointer", isMobile ? "focus:bg-slate-100 dark:focus:bg-slate-800" : "hover:!bg-primary/20")}>
                    <Plus size={16} /> Ajouter un collaborateur
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
};

export default CollaboratorSwitcher;
