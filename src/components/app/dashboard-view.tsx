
"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Calendar, ArrowUpRight, Wand, Mic, ArrowRight, Clock } from 'lucide-react'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils'
import type { Transaction, Recap, CalendarEvent, User } from '@/lib/definitions'
import { Badge } from '../ui/badge'

type DashboardViewProps = {
  user: User
  transactions: Transaction[]
  recaps: Recap[]
  events: CalendarEvent[]
  onQuickAdd: (modal: 'addTransaction' | 'addEvent') => void
  setActiveView: (view: string) => void;
}

const DashboardView = ({ user, transactions, recaps, events, onQuickAdd, setActiveView }: DashboardViewProps) => {
  const balance = transactions.reduce((acc, tx) => acc + (tx.type === 'BUDGET_ADD' ? tx.amount : -tx.amount), 0)
  const totalBudget = transactions.filter(t => t.type === 'BUDGET_ADD').reduce((acc, tx) => acc + tx.amount, 0)
  const latestRecap = recaps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
  const upcomingEvent = events.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column */}
      <div className="lg:col-span-1 space-y-6">
        <Card className="dark bg-card text-card-foreground rounded-4xl shadow-lg h-full flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-yellow-400/20 rounded-lg">
                  <Wand size={20} className="text-yellow-400" />
                </div>
                <Badge variant="outline" className="border-green-500/50 bg-green-500/10 text-green-300">+12% cette semaine</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-center">
            <p className="text-sm text-muted-foreground">Trésorerie disponible (Est. EUR)</p>
            <p className="text-6xl font-bold tracking-tighter">{formatCurrencyCompact(balance, 'EUR')}</p>
          </CardContent>
          <CardFooter className="pt-6 border-t border-white/10 flex justify-between items-center">
            <div>
              <p className="text-xs text-muted-foreground uppercase">Budget Total</p>
              <p className="text-lg font-semibold">{formatCurrencyCompact(totalBudget, 'EUR')}</p>
            </div>
            <Button size="icon" variant="secondary" className="rounded-full bg-white/10 hover:bg-white/20">
              <ArrowUpRight />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Right Column */}
      <div className="lg:col-span-2 space-y-6">
        <Card className="bg-primary text-primary-foreground rounded-4xl shadow-lg">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg"><Wand size={20} /></div>
              <div>
                <Badge className="bg-white/20 text-white border-none mb-1">NOUVEAU</Badge>
                <h3 className="text-xl font-bold">Assistant Vocal</h3>
                <p className="text-sm opacity-80">"J'ai fini le chantier..." Dites-le, l'IA s'occupe de tout noter.</p>
              </div>
            </div>
            <Button size="icon" variant="ghost" className="bg-white/20 hover:bg-white/30 rounded-full h-14 w-14">
              <Mic size={24} />
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="rounded-4xl shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onQuickAdd('addTransaction')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                <Plus className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold">Budget</p>
                <p className="text-sm text-muted-foreground">Créditer un compte</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-4xl shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onQuickAdd('addEvent')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                <Plus className="text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-semibold">Événement</p>
                <p className="text-sm text-muted-foreground">Planifier une date</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="rounded-4xl shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveView('activite')}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><FileText size={18} className="text-muted-foreground"/> Dernier rapport</CardTitle>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full"><ArrowRight size={16} /></Button>
            </CardHeader>
            <CardContent>
              {latestRecap ? (
                <div>
                  <p className="font-semibold text-sm">{latestRecap.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{latestRecap.description}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Aucun rapport</p>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-4xl shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveView('agenda')}>
             <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Clock size={18} className="text-muted-foreground" /> Prochainement</CardTitle>
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full"><ArrowRight size={16} /></Button>
            </CardHeader>
            <CardContent>
              {upcomingEvent ? (
                <div>
                  <p className="font-semibold text-sm">{upcomingEvent.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{upcomingEvent.description}</p>
                </div>
              ) : (
                 <p className="text-sm text-muted-foreground text-center py-4">Rien à l'agenda</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DashboardView
