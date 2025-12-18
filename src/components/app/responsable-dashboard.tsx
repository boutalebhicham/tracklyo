"use client"

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Wallet, CheckSquare, FileText } from 'lucide-react'
import { formatCurrencyCompact } from '@/lib/utils'
import type { Transaction, Mission } from '@/lib/definitions'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy, limit } from 'firebase/firestore'

type ResponsableDashboardProps = {
  viewedUserId: string | null
  onQuickAdd: (modal: 'addRecap' | 'addTransaction') => void
  setActiveView: (view: string) => void
}

const ResponsableDashboard = ({ viewedUserId, onQuickAdd, setActiveView }: ResponsableDashboardProps) => {
  const firestore = useFirestore()

  const transactionsQuery = useMemoFirebase(
    () => viewedUserId ? query(collection(firestore, 'users', viewedUserId, 'transactions')) : null,
    [firestore, viewedUserId]
  )
  const { data: transactions, isLoading: areTransactionsLoading } = useCollection<Transaction>(transactionsQuery)

  const todayMissionsQuery = useMemoFirebase(
    () => viewedUserId
      ? query(
          collection(firestore, 'users', viewedUserId, 'missions'),
          orderBy('createdAt', 'desc'),
          limit(10)
        )
      : null,
    [firestore, viewedUserId]
  )
  const { data: allMissions, isLoading: areMissionsLoading } = useCollection<Mission>(todayMissionsQuery)

  const isLoading = areTransactionsLoading || areMissionsLoading

  const balance = useMemo(() => {
    if (!transactions) return 0
    return transactions.reduce((acc, tx) => acc + (tx.type === 'BUDGET_ADD' ? tx.amount : -tx.amount), 0)
  }, [transactions])

  const todayMissions = useMemo(() => {
    if (!allMissions) return []
    return allMissions.filter(m => m.status !== 'DONE').slice(0, 5)
  }, [allMissions])

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-[300px] rounded-4xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Skeleton className="h-[120px] rounded-4xl" />
          <Skeleton className="h-[120px] rounded-4xl" />
        </div>
        <Skeleton className="h-[300px] rounded-4xl" />
      </div>
    )
  }

  const pendingMissions = todayMissions.filter(m => m.status === 'TODO')
  const inProgressMissions = todayMissions.filter(m => m.status === 'IN_PROGRESS')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Balance Card */}
      <Card className="dark bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-4xl shadow-2xl border-none">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <Wallet size={24} className="text-white" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Solde Disponible</CardTitle>
              <CardDescription className="text-white/60">Budget actuel à gérer</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <p className="text-7xl font-bold tracking-tighter">
              {formatCurrencyCompact(balance, 'EUR')}
            </p>
            <p className="text-white/60 mt-2">Estimation en EUR</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => onQuickAdd('addTransaction')}
              variant="secondary"
              className="h-14 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-white border-red-500/30"
            >
              <Plus size={20} className="mr-2" />
              <span className="font-semibold">Dépense</span>
            </Button>
            <Button
              onClick={() => onQuickAdd('addRecap')}
              className="h-14 rounded-2xl bg-white/20 hover:bg-white/30 text-white"
            >
              <FileText size={20} className="mr-2" />
              <span className="font-semibold">Rapport</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card
          className="rounded-4xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-primary"
          onClick={() => setActiveView('missions')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                <CheckSquare size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">Mes Missions</p>
                <p className="text-sm text-muted-foreground">
                  {pendingMissions.length} à faire • {inProgressMissions.length} en cours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="rounded-4xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-primary"
          onClick={() => setActiveView('finances')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-xl">
                <Wallet size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">Mes Dépenses</p>
                <p className="text-sm text-muted-foreground">Voir l'historique complet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Missions */}
      {todayMissions.length > 0 && (
        <Card className="rounded-4xl bg-background/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare size={20} />
              Missions du Jour
            </CardTitle>
            <CardDescription>Vos tâches en cours et à faire</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayMissions.map(mission => (
                <div
                  key={mission.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-shrink-0">
                    {mission.status === 'TODO' ? (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-blue-500 bg-blue-500/20 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{mission.title}</p>
                    {mission.description && (
                      <p className="text-xs text-muted-foreground truncate">{mission.description}</p>
                    )}
                  </div>
                  <Badge variant={mission.status === 'TODO' ? 'outline' : 'secondary'}>
                    {mission.status === 'TODO' ? 'À faire' : 'En cours'}
                  </Badge>
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full mt-4 rounded-xl"
              onClick={() => setActiveView('missions')}
            >
              Voir toutes les missions
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ResponsableDashboard
