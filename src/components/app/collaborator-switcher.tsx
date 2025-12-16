
"use client"

import React from 'react';
import type { User } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

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

  return (
    <div className="px-2 space-y-3">
        <div className="flex justify-between items-center px-1">
            <h3 className="text-xs font-semibold uppercase text-sidebar-foreground/60 tracking-wider">
                Suivi de :
            </h3>
            <Button
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs"
                onClick={onAddCollaborator}
            >
                <Plus size={14} className="mr-1" /> Ajouter
            </Button>
        </div>

        <ScrollArea className="h-48">
            <div className="space-y-2 pr-4">
                {allUsers.map((user) => (
                <button
                    key={user.id}
                    onClick={() => onCollaboratorChange(user.id)}
                    className={cn(
                    'w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors',
                    activeCollaboratorId === user.id
                        ? 'bg-primary/20 text-white'
                        : 'text-sidebar-foreground/80 hover:bg-black/20'
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
                </button>
                ))}
            </div>
        </ScrollArea>
    </div>
  );
};

export default CollaboratorSwitcher;
