"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, CircleDollarSign } from 'lucide-react'
import { calculateBalance, formatCurrency } from '@/lib/utils'
import type { Transaction, Recap, CalendarEvent, UserRole } from '@/lib/definitions'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

type DashboardViewProps = {
  transactions: Transaction[]
  recaps: Recap[]
  events: CalendarEvent[]
  onQuickAdd: (modal: 'addRecap' | 'addTransaction') => void
  viewAs: UserRole
}

const DashboardView = ({ transactions, recaps, events, onQuickAdd, viewAs }: DashboardViewProps) => {
  const { balance } = calculateBalance(transactions)
  const latestRecap = recaps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  const upcomingEvent = events.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-neutral-900 dark:bg-black text-white rounded-5xl shadow-2xl overflow-hidden">
           <CardContent className="p-8 relative min-h-[250px] flex flex-col justify-between">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 opacity-20"></div>
              <div className="relative z-10">
                <p className="text-lg text-neutral-300">Solde Actuel</p>
                <p className="text-5xl font-bold tracking-tighter">{formatCurrency(balance, 'EUR')}</p>
              </div>
              <div className="relative z-10 flex items-end justify-between">
                <div>
                  <p className="text-sm text-neutral-400">Tracklyo Business</p>
                  <p className="font-mono text-lg tracking-widest">**** **** **** 1234</p>
                </div>
                <div className="text-right">
                   <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                </div>
              </div>
           </CardContent>
        </Card>
        <div>
          <h3 className="font-semibold mb-4 text-xl">Actions Rapides</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              size="lg"
              variant="outline"
              className="rounded-3xl h-20 text-left justify-start items-center gap-4 bg-background/70 backdrop-blur-sm"
              onClick={() => onQuickAdd('addRecap')}
              disabled={viewAs === 'PATRON'}
            >
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                <FileText className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold">Nouveau Rapport</p>
                <p className="text-sm text-muted-foreground">Ajouter un récapitulatif</p>
              </div>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-3xl h-20 text-left justify-start items-center gap-4 bg-background/70 backdrop-blur-sm"
              onClick={() => onQuickAdd('addTransaction')}
            >
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                <CircleDollarSign className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold">{viewAs === 'PATRON' ? 'Nouveau Budget' : 'Nouvelle Dépense'}</p>
                <p className="text-sm text-muted-foreground">Enregistrer une transaction</p>
              </div>
            </Button>
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <Card className="rounded-4xl bg-background/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Dernier Rapport</CardTitle>
          </CardHeader>
          <CardContent>
            {latestRecap ? (
              <div>
                <p className="font-semibold">{latestRecap.title}</p>
                <p className="text-sm text-muted-foreground mt-1 truncate">{latestRecap.description}</p>
                <p className="text-xs text-muted-foreground mt-2">{format(parseISO(latestRecap.date), "PPP", { locale: fr })}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun rapport récent.</p>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-4xl bg-background/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Prochain Événement</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvent ? (
              <div>
                <p className="font-semibold">{upcomingEvent.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{upcomingEvent.description}</p>
                <p className="text-xs text-muted-foreground mt-2">{format(parseISO(upcomingEvent.date), "PPP p", { locale: fr })}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun événement à venir.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DashboardView
