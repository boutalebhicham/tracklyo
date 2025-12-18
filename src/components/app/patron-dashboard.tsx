"use client"

import React, { useMemo, lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Wallet, ArrowDown, ArrowUp, Users, Clock } from 'lucide-react'
import { formatCurrencyCompact, calculateBalance, convertCurrency } from '@/lib/utils'
import type { Transaction, Recap, Mission, User, Currency } from '@/lib/definitions'
import { Skeleton } from '../ui/skeleton'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy, limit } from 'firebase/firestore'
import ActivityTimeline from './activity-timeline'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

const CashFlowChart = lazy(() => import('./cash-flow-chart'))

type PatronDashboardProps = {
  viewedUserId: string | null
  collaborators: User[]
  onQuickAdd: (modal: 'addTransaction' | 'addUser') => void
  setActiveView: (view: string) => void
}

const PatronDashboard = ({ viewedUserId, collaborators, onQuickAdd, setActiveView }: PatronDashboardProps) => {
  const firestore = useFirestore()

  const transactionsQuery = useMemoFirebase(
    () => viewedUserId ? query(collection(firestore, 'users', viewedUserId, 'transactions')) : null,
    [firestore, viewedUserId]
  )
  const { data: transactions, isLoading: areTransactionsLoading } = useCollection<Transaction>(transactionsQuery)

  // Fetch all collaborators' data for timeline
  const allCollaboratorsData = useMemo(() => {
    return collaborators.map(collab => ({
      user: collab,
      transactionsQuery: query(collection(firestore, 'users', collab.id, 'transactions'), orderBy('date', 'desc'), limit(10)),
      recapsQuery: query(collection(firestore, 'users', collab.id, 'recaps'), orderBy('date', 'desc'), limit(10)),
      missionsQuery: query(collection(firestore, 'users', collab.id, 'missions'), orderBy('updatedAt', 'desc'), limit(10)),
    }))
  }, [collaborators, firestore])

  const { balance, totalBudget, totalExpenses } = useMemo(() => {
    if (!transactions) return { balance: 0, totalBudget: 0, totalExpenses: 0 }
    return calculateBalance(transactions)
  }, [transactions])

  const chartData = useMemo(() => {
    if (!transactions) return []
    const monthlyData: { [key: string]: { budget: number; expenses: number } } = {}

    transactions.forEach(tx => {
      const month = format(parseISO(tx.date), 'MMM', { locale: fr })
      if (!monthlyData[month]) {
        monthlyData[month] = { budget: 0, expenses: 0 }
      }
      const amountInEur = convertCurrency(tx.amount, tx.currency, 'EUR')
      if (tx.type === 'BUDGET_ADD') {
        monthlyData[month].budget += amountInEur
      } else {
        monthlyData[month].expenses += amountInEur
      }
    })

    return Object.keys(monthlyData)
      .map(month => ({
        month,
        budget: monthlyData[month].budget,
        expenses: monthlyData[month].expenses,
      }))
      .reverse()
  }, [transactions])

  // Collect all transactions, recaps, and missions from collaborators
  const allTransactions = useMemo(() => {
    return allCollaboratorsData.map(collab => {
      const { data } = useCollection<Transaction>(collab.transactionsQuery)
      return { userId: collab.user.id, transactions: data || [] }
    })
  }, [allCollaboratorsData])

  const allRecaps = useMemo(() => {
    return allCollaboratorsData.map(collab => {
      const { data } = useCollection<Recap>(collab.recapsQuery)
      return { userId: collab.user.id, recaps: data || [] }
    })
  }, [allCollaboratorsData])

  const allMissions = useMemo(() => {
    return allCollaboratorsData.map(collab => {
      const { data } = useCollection<Mission>(collab.missionsQuery)
      return { userId: collab.user.id, missions: data || [] }
    })
  }, [allCollaboratorsData])

  if (areTransactionsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[280px] rounded-4xl" />
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-[120px] rounded-4xl" />
            <Skeleton className="h-[350px] rounded-4xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="dark bg-gray-900 text-white rounded-4xl shadow-2xl shadow-primary/10 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="p-3 bg-white/10 rounded-xl">
              <Wallet size={20} />
            </div>
            <div className="text-right">
              <p className="text-xs text-white/50">AFFICHAGE EN</p>
              <p className="font-bold">EUR</p>
            </div>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
            <p className="text-sm text-white/60">Trésorerie Globale</p>
            <p className="text-5xl font-bold tracking-tighter my-2">
              {formatCurrencyCompact(balance, 'EUR')}
            </p>
          </CardContent>
          <CardFooter className="flex justify-between items-center text-sm border-t border-white/10 p-4">
            <div className="flex items-center gap-2 text-green-400">
              <ArrowDown size={16} />
              <span>{formatCurrencyCompact(totalBudget, 'EUR')}</span>
            </div>
            <div className="flex items-center gap-2 text-red-400">
              <ArrowUp size={16} />
              <span>{formatCurrencyCompact(totalExpenses, 'EUR')}</span>
            </div>
          </CardFooter>
        </Card>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card
              className="rounded-4xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onQuickAdd('addTransaction')}
            >
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

            <Card
              className="rounded-4xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onQuickAdd('addUser')}
            >
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                  <Users className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold">Collaborateur</p>
                  <p className="text-sm text-muted-foreground">Ajouter un compte</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cash Flow Chart */}
          <Card className="rounded-4xl bg-background/70 backdrop-blur-sm">
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Clock size={18} />
                Flux de trésorerie (EUR)
              </CardTitle>
              <Button
                variant="ghost"
                className="rounded-full text-sm font-normal"
                onClick={() => setActiveView('finances')}
              >
                Vue Détaillée
              </Button>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<Skeleton className="h-[250px] w-full rounded-xl" />}>
                <CashFlowChart data={chartData} currency="EUR" />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Timeline */}
      <ActivityTimeline
        collaborators={collaborators}
        allTransactions={allTransactions}
        allRecaps={allRecaps}
        allMissions={allMissions}
        isLoading={false}
        setActiveView={setActiveView}
      />
    </div>
  )
}

export default PatronDashboard
