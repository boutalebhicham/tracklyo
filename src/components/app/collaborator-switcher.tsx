
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
} from "@/components/ui/dropdown-menu"

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

  return (
    <div className="px-2 space-y-2">
        <h3 className="text-xs font-semibold uppercase text-sidebar-foreground/60 tracking-wider px-2">
            Suivi de :
        </h3>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {activeUser ? (
                    <Button variant="ghost" className="w-full h-auto justify-between items-center p-2 rounded-xl text-left hover:bg-black/20">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={activeUser.avatar} alt={activeUser.name} />
                                <AvatarFallback>{activeUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium flex-1 truncate text-white">{activeUser.name}</span>
                        </div>
                        <ChevronsUpDown className="h-4 w-4 text-sidebar-foreground/60" />
                    </Button>
                ) : (
                    <Button onClick={onAddCollaborator} variant="ghost" className="w-full h-12 justify-start p-2 rounded-xl text-left hover:bg-black/20 text-sidebar-foreground/80">
                        <Plus size={16} className="mr-2"/> Ajouter un collaborateur
                    </Button>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 rounded-xl bg-sidebar-border border-sidebar-border text-sidebar-foreground p-2" side="top" align="start">
                {allUsers.map((user) => (
                    <DropdownMenuItem 
                        key={user.id}
                        onClick={() => onCollaboratorChange(user.id)}
                        className={cn(
                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:!bg-primary/20",
                            activeCollaboratorId === user.id ? "bg-primary/20" : ""
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
                <DropdownMenuSeparator className="bg-sidebar-foreground/20"/>
                <DropdownMenuItem onClick={onAddCollaborator} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:!bg-primary/20">
                    <Plus size={16} /> Ajouter
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
};

export default CollaboratorSwitcher;
