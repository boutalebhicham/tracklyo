"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Bell, DollarSign, FileText, CheckCircle, ArrowRight } from 'lucide-react'
import type { User } from '@/lib/definitions'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

type ActivityFeedProps = {
  collaborators: User[]
  setActiveView: (view: string) => void
  setViewedUserId: (userId: string) => void
}

const ActivityFeed = ({ collaborators, setActiveView, setViewedUserId }: ActivityFeedProps) => {
  // Simplified version showing collaborators overview
  // A full activity feed would require server-side aggregation or a different data architecture

  const handleCollaboratorClick = (collab: User) => {
    setViewedUserId(collab.id)
    setActiveView('finances')
  }

  if (collaborators.length === 0) {
    return (
      <Card className="rounded-4xl bg-background/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} />
            Collaborateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Bell size={48} className="mx-auto mb-4 opacity-20" />
            <p>Aucun collaborateur</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-4xl bg-background/70 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell size={20} />
          Collaborateurs
        </CardTitle>
        <Badge variant="secondary" className="rounded-full">
          {collaborators.length}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {collaborators.map((collab) => (
            <div
              key={collab.id}
              className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors"
              onClick={() => handleCollaboratorClick(collab)}
            >
              <Avatar className="w-10 h-10 ring-2 ring-background">
                <AvatarImage src={collab.avatar} alt={collab.name} />
                <AvatarFallback>{collab.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{collab.name}</p>
                <p className="text-xs text-muted-foreground">{collab.email}</p>
              </div>
              <ArrowRight size={16} className="text-muted-foreground" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default ActivityFeed
