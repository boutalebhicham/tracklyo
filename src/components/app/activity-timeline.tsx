"use client"

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight, DollarSign, FileText, CheckCircle, Bell } from 'lucide-react'
import type { Transaction, Recap, Mission, User } from '@/lib/definitions'
import { formatCurrency } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Skeleton } from '../ui/skeleton'

type ActivityTimelineProps = {
  collaborators: User[]
  allTransactions: { userId: string; transactions: Transaction[] }[]
  allRecaps: { userId: string; recaps: Recap[] }[]
  allMissions: { userId: string; missions: Mission[] }[]
  isLoading: boolean
  setActiveView: (view: string) => void
}

type TimelineItem = {
  id: string
  type: 'transaction' | 'recap' | 'mission'
  user: User
  date: string
  data: Transaction | Recap | Mission
}

const ActivityTimeline = ({
  collaborators,
  allTransactions,
  allRecaps,
  allMissions,
  isLoading,
  setActiveView,
}: ActivityTimelineProps) => {
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = []

    // Add transactions (only expenses)
    allTransactions.forEach(({ userId, transactions }) => {
      const user = collaborators.find(c => c.id === userId)
      if (!user) return

      transactions
        .filter(tx => tx.type === 'EXPENSE')
        .forEach(tx => {
          items.push({
            id: `tx-${tx.id}`,
            type: 'transaction',
            user,
            date: tx.date,
            data: tx,
          })
        })
    })

    // Add recaps
    allRecaps.forEach(({ userId, recaps }) => {
      const user = collaborators.find(c => c.id === userId)
      if (!user) return

      recaps.forEach(recap => {
        items.push({
          id: `recap-${recap.id}`,
          type: 'recap',
          user,
          date: recap.date,
          data: recap,
        })
      })
    })

    // Add completed missions
    allMissions.forEach(({ userId, missions }) => {
      const user = collaborators.find(c => c.id === userId)
      if (!user) return

      missions
        .filter(m => m.status === 'DONE')
        .forEach(mission => {
          items.push({
            id: `mission-${mission.id}`,
            type: 'mission',
            user,
            date: mission.updatedAt,
            data: mission,
          })
        })
    })

    // Sort by date descending
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
  }, [collaborators, allTransactions, allRecaps, allMissions])

  if (isLoading) {
    return (
      <Card className="rounded-4xl bg-background/70 backdrop-blur-sm">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (timelineItems.length === 0) {
    return (
      <Card className="rounded-4xl bg-background/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell size={20} />
            Timeline d'Activité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Bell size={48} className="mx-auto mb-4 opacity-20" />
            <p>Aucune activité récente</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <DollarSign size={16} className="text-red-500" />
      case 'recap':
        return <FileText size={16} className="text-blue-500" />
      case 'mission':
        return <CheckCircle size={16} className="text-green-500" />
      default:
        return null
    }
  }

  const getLabel = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'Dépense'
      case 'recap':
        return 'Rapport'
      case 'mission':
        return 'Mission terminée'
      default:
        return ''
    }
  }

  return (
    <Card className="rounded-4xl bg-background/70 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell size={20} />
          Timeline d'Activité
        </CardTitle>
        <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setActiveView('activite')}>
          <span className="text-sm">Tout voir</span>
          <ArrowRight size={16} className="ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {timelineItems.map((item, index) => (
            <div key={item.id} className="relative">
              {/* Timeline connector */}
              {index < timelineItems.length - 1 && (
                <div className="absolute left-[19px] top-10 w-0.5 h-full bg-border" />
              )}

              <div className="flex items-start gap-3">
                {/* Avatar */}
                <Avatar className="w-10 h-10 ring-2 ring-background">
                  <AvatarImage src={item.user.avatar} alt={item.user.name} />
                  <AvatarFallback>{item.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1 min-w-0 bg-muted/50 rounded-xl p-3 hover:bg-muted transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{item.user.name}</p>
                      <Badge variant="outline" className="gap-1">
                        {getIcon(item.type)}
                        <span className="text-xs">{getLabel(item.type)}</span>
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(parseISO(item.date), 'd MMM, HH:mm', { locale: fr })}
                    </p>
                  </div>

                  {item.type === 'transaction' && (
                    <div className="mt-1">
                      <p className="text-sm text-muted-foreground">
                        {(item.data as Transaction).reason}
                      </p>
                      <p className="text-sm font-semibold text-red-500 mt-1">
                        -{formatCurrency((item.data as Transaction).amount, (item.data as Transaction).currency)}
                      </p>
                    </div>
                  )}

                  {item.type === 'recap' && (
                    <div className="mt-1">
                      <p className="text-sm font-medium">{(item.data as Recap).title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {(item.data as Recap).description}
                      </p>
                    </div>
                  )}

                  {item.type === 'mission' && (
                    <div className="mt-1">
                      <p className="text-sm font-medium">{(item.data as Mission).title}</p>
                      {(item.data as Mission).description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {(item.data as Mission).description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default ActivityTimeline
