

"use client"

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Calendar, ArrowUpRight, Wand, Mic, ArrowRight, Clock, LogIn, LogOut } from 'lucide-react'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils'
import type { Transaction, Recap, Event, User } from '@/lib/definitions'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase'
import { collection, doc, query, orderBy, limit } from 'firebase/firestore'

type DashboardViewProps = {
  viewedUserId: string | null
  onQuickAdd: (modal: 'addTransaction' | 'addEvent') => void
  setActiveView: (view: string) => void;
}


const DashboardView = ({ viewedUserId, onQuickAdd, setActiveView }: DashboardViewProps) => {
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => viewedUserId ? doc(firestore, 'users', viewedUserId) : null, [firestore, viewedUserId]);
  const { data: user, isLoading: isUserLoading } = useDoc<User>(userDocRef);

  const transactionsQuery = useMemoFirebase(() => viewedUserId ? query(collection(firestore, 'users', viewedUserId, 'transactions')) : null, [firestore, viewedUserId]);
  const { data: transactions, isLoading: areTransactionsLoading } = useCollection<Transaction>(transactionsQuery);
  
  const recapsQuery = useMemoFirebase(() => viewedUserId ? query(collection(firestore, 'users', viewedUserId, 'recaps'), orderBy('date', 'desc'), limit(1)) : null, [firestore, viewedUserId]);
  const { data: recaps, isLoading: areRecapsLoading } = useCollection<Recap>(recapsQuery);

  const eventsQuery = useMemoFirebase(() => viewedUserId ? query(collection(firestore, 'users', viewedUserId, 'events'), orderBy('date', 'asc'), limit(1)) : null, [firestore, viewedUserId]);
  const { data: events, isLoading: areEventsLoading } = useCollection<Event>(eventsQuery);

  const isLoading = isUserLoading || areTransactionsLoading || areRecapsLoading || areEventsLoading;
  
  const balance = transactions ? transactions.reduce((acc, tx) => acc + (tx.type === 'BUDGET_ADD' ? tx.amount : -tx.amount), 0) : 0;
  const totalBudget = transactions ? transactions.filter(t => t.type === 'BUDGET_ADD').reduce((acc, tx) => acc + tx.amount, 0) : 0;
  const latestRecap = recaps && recaps.length > 0 ? recaps[0] : null;
  const upcomingEvent = events && events.length > 0 ? events[0] : null;


  if (isLoading && !user) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Skeleton className="h-[280px] rounded-4xl" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Skeleton className="h-[88px] rounded-4xl" />
            <Skeleton className="h-[88px] rounded-4xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Skeleton className="h-[120px] rounded-4xl" />
            <Skeleton className="h-[120px] rounded-4xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p>Impossible de charger les données de l'utilisateur.</p>
      </div>
    )
  }

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
    