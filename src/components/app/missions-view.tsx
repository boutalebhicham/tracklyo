"use client"

import React, { useState, useMemo } from 'react'
import type { Mission, MissionStatus, MissionType } from '@/lib/definitions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Circle, Clock, CheckCircle2, Trash2 } from 'lucide-react'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { Skeleton } from '../ui/skeleton'
import { cn } from '@/lib/utils'

type MissionsViewProps = {
  viewedUserId: string | null
  onAddMission: () => void
  userRole?: 'PATRON' | 'RESPONSABLE'
}

const MissionsView = ({ viewedUserId, onAddMission, userRole }: MissionsViewProps) => {
  const [activeTab, setActiveTab] = useState<MissionType>('PERSONAL')
  const firestore = useFirestore()

  // RESPONSABLE can only see PERSONAL missions
  const isResponsable = userRole === 'RESPONSABLE'

  // Debug log
  React.useEffect(() => {
    console.log('[MissionsView] userRole:', userRole, '| isResponsable:', isResponsable)
  }, [userRole, isResponsable])

  const missionsQuery = useMemoFirebase(
    () => viewedUserId
      ? query(
          collection(firestore, 'users', viewedUserId, 'missions'),
          orderBy('createdAt', 'desc')
        )
      : null,
    [firestore, viewedUserId]
  )

  const { data: allMissions, isLoading } = useCollection<Mission>(missionsQuery)

  const missions = useMemo(() => {
    if (!allMissions) return []
    // RESPONSABLE can only see PERSONAL missions
    if (isResponsable) {
      return allMissions.filter(m => m.type === 'PERSONAL')
    }
    return allMissions.filter(m => m.type === activeTab)
  }, [allMissions, activeTab, isResponsable])

  const groupedMissions = useMemo(() => {
    if (!missions) return { TODO: [], IN_PROGRESS: [], DONE: [] }

    return missions.reduce((acc, mission) => {
      acc[mission.status].push(mission)
      return acc
    }, { TODO: [] as Mission[], IN_PROGRESS: [] as Mission[], DONE: [] as Mission[] })
  }, [missions])

  const handleStatusChange = async (missionId: string, newStatus: MissionStatus) => {
    if (!viewedUserId) return
    const missionRef = doc(firestore, 'users', viewedUserId, 'missions', missionId)
    await updateDoc(missionRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    })
  }

  const handleDelete = async (missionId: string) => {
    if (!viewedUserId) return
    const missionRef = doc(firestore, 'users', viewedUserId, 'missions', missionId)
    await deleteDoc(missionRef)
  }

  const getStatusIcon = (status: MissionStatus) => {
    switch (status) {
      case 'TODO':
        return <Circle size={18} className="text-muted-foreground" />
      case 'IN_PROGRESS':
        return <Clock size={18} className="text-blue-500" />
      case 'DONE':
        return <CheckCircle2 size={18} className="text-green-500" />
    }
  }

  const getStatusColor = (status: MissionStatus) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'DONE':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
    }
  }

  const getStatusLabel = (status: MissionStatus) => {
    switch (status) {
      case 'TODO':
        return 'À faire'
      case 'IN_PROGRESS':
        return 'En cours'
      case 'DONE':
        return 'Terminé'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] rounded-4xl" />
          <Skeleton className="h-[400px] rounded-4xl" />
          <Skeleton className="h-[400px] rounded-4xl" />
        </div>
      </div>
    )
  }

  const MissionColumn = ({ status, missions }: { status: MissionStatus, missions: Mission[] }) => (
    <Card className="rounded-4xl bg-background/70 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <CardTitle className="text-lg">{getStatusLabel(status)}</CardTitle>
        </div>
        <Badge variant="secondary" className="rounded-full">
          {missions.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {missions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Aucune mission</p>
        ) : (
          missions.map((mission) => (
            <div
              key={mission.id}
              className="group p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={mission.status === 'DONE'}
                  onCheckedChange={(checked) => {
                    handleStatusChange(
                      mission.id,
                      checked ? 'DONE' : mission.status === 'DONE' ? 'TODO' : mission.status
                    )
                  }}
                  className="mt-0.5"
                />
                <div className="flex-1 space-y-1">
                  <h4 className={cn(
                    "font-medium text-sm",
                    mission.status === 'DONE' && "line-through text-muted-foreground"
                  )}>
                    {mission.title}
                  </h4>
                  {mission.description && (
                    <p className="text-xs text-muted-foreground">{mission.description}</p>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Badge className={cn("text-xs", getStatusColor(mission.status))}>
                      {getStatusLabel(mission.status)}
                    </Badge>
                    {mission.status !== 'DONE' && mission.status !== 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleStatusChange(mission.id, 'IN_PROGRESS')}
                      >
                        Démarrer
                      </Button>
                    )}
                    {mission.status === 'IN_PROGRESS' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleStatusChange(mission.id, 'DONE')}
                      >
                        Terminer
                      </Button>
                    )}
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDelete(mission.id)}
                >
                  <Trash2 size={16} className="text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Missions</h2>
          <p className="text-muted-foreground">Gérez vos tâches et objectifs.</p>
        </div>
        <Button onClick={onAddMission} className="rounded-xl gap-2">
          <Plus size={16} />
          <span>Nouvelle mission</span>
        </Button>
      </div>

      {/* RESPONSABLE can only see PERSONAL missions, no tabs needed */}
      {!isResponsable && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MissionType)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 rounded-xl">
            <TabsTrigger value="PERSONAL" className="rounded-lg">
              Personnel
            </TabsTrigger>
            <TabsTrigger value="SHARED" className="rounded-lg">
              Collaborateur
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MissionColumn status="TODO" missions={groupedMissions.TODO} />
              <MissionColumn status="IN_PROGRESS" missions={groupedMissions.IN_PROGRESS} />
              <MissionColumn status="DONE" missions={groupedMissions.DONE} />
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* RESPONSABLE sees missions directly without tabs */}
      {isResponsable && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <MissionColumn status="TODO" missions={groupedMissions.TODO} />
          <MissionColumn status="IN_PROGRESS" missions={groupedMissions.IN_PROGRESS} />
          <MissionColumn status="DONE" missions={groupedMissions.DONE} />
        </div>
      )}
    </div>
  )
}

export default MissionsView
