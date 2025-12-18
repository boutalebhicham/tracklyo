"use client"

import React from 'react'
import { User } from '@/lib/definitions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, User as UserIcon, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

type ViewSwitcherProps = {
  loggedInUser: User
  collaborators: User[]
  viewedUser: User | null
  onViewChange: (userId: string) => void
}

const ViewSwitcher = ({ loggedInUser, collaborators, viewedUser, onViewChange }: ViewSwitcherProps) => {
  const isViewingSelf = viewedUser?.id === loggedInUser.id
  const allUsers = [loggedInUser, ...collaborators]

  return (
    <div className={cn(
      "sticky top-0 z-20 border-b backdrop-blur-lg transition-colors",
      isViewingSelf
        ? "bg-background/80 border-border"
        : "bg-blue-50/80 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
    )}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
              isViewingSelf
                ? "bg-primary/10 text-primary"
                : "bg-blue-500/20 text-blue-700 dark:text-blue-300"
            )}>
              {isViewingSelf ? (
                <>
                  <UserIcon size={14} />
                  <span>Mon Compte</span>
                </>
              ) : (
                <>
                  <Users size={14} />
                  <span>Vue Collaborateur</span>
                </>
              )}
            </div>

            {!isViewingSelf && viewedUser && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Vous consultez:</span>
                <Badge variant="outline" className="font-normal">
                  {viewedUser.name}
                </Badge>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={isViewingSelf ? "outline" : "default"}
                className={cn(
                  "gap-2",
                  !isViewingSelf && "bg-blue-600 hover:bg-blue-700 text-white"
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={viewedUser?.avatar} alt={viewedUser?.name} />
                  <AvatarFallback>{viewedUser?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">{viewedUser?.name}</span>
                <ChevronDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Changer de vue</DropdownMenuLabel>
              <DropdownMenuSeparator />

              {/* Mon compte */}
              <DropdownMenuItem
                onClick={() => onViewChange(loggedInUser.id)}
                className={cn(
                  "flex items-center gap-3 p-3 cursor-pointer",
                  isViewingSelf && "bg-primary/10"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={loggedInUser.avatar} alt={loggedInUser.name} />
                  <AvatarFallback>{loggedInUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{loggedInUser.name}</p>
                  <p className="text-xs text-muted-foreground">Mon compte personnel</p>
                </div>
                {isViewingSelf && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </DropdownMenuItem>

              {collaborators.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs">Collaborateurs</DropdownMenuLabel>

                  {collaborators.map((collab) => {
                    const isActive = viewedUser?.id === collab.id
                    return (
                      <DropdownMenuItem
                        key={collab.id}
                        onClick={() => onViewChange(collab.id)}
                        className={cn(
                          "flex items-center gap-3 p-3 cursor-pointer",
                          isActive && "bg-blue-100 dark:bg-blue-900/50"
                        )}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={collab.avatar} alt={collab.name} />
                          <AvatarFallback>{collab.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{collab.name}</p>
                          <p className="text-xs text-muted-foreground">Collaborateur</p>
                        </div>
                        {isActive && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </DropdownMenuItem>
                    )
                  })}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export default ViewSwitcher
