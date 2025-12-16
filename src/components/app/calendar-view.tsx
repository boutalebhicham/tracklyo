
"use client"

import React, { useState } from 'react'
import type { Event as CalendarEvent } from '@/lib/definitions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { format, parseISO, startOfWeek, addDays, isSameDay, getDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query } from 'firebase/firestore'
import { Skeleton } from '../ui/skeleton'

type CalendarViewProps = {
  viewedUserId: string | null
  onAddEvent: () => void
}

const CalendarView = ({ viewedUserId, onAddEvent }: CalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const firestore = useFirestore();
  const eventsQuery = useMemoFirebase(() => viewedUserId ? query(collection(firestore, 'users', viewedUserId, 'events')) : null, [firestore, viewedUserId]);
  const { data: events, isLoading } = useCollection<CalendarEvent>(eventsQuery);

  const weekStartsOn = 1; // Monday
  const weekStart = startOfWeek(currentDate, { weekStartsOn })
  
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))
  const [selectedDay, setSelectedDay] = useState(currentDate)

  const dayEvents = events ? events.filter(event => isSameDay(parseISO(event.date), selectedDay)) : [];

  if (isLoading) {
    return (
       <div className="space-y-6">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-28 rounded-4xl" />
          <Skeleton className="h-48 rounded-4xl" />
      </div>
    )
  }

  if (!events) {
    return <p>Impossible de charger l'agenda.</p>
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{format(currentDate, "MMMM yyyy", { locale: fr })}</h2>
          <p className="text-muted-foreground">Aperçu de la semaine</p>
        </div>
        <Button onClick={onAddEvent} className="rounded-xl gap-2">
          <Plus size={16} /> Nouvel Événement
        </Button>
      </div>

      <Card className="rounded-4xl bg-background/70 backdrop-blur-sm">
        <CardContent className="p-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex space-x-2 md:grid md:grid-cols-7 md:space-x-0 md:gap-2">
              {weekDays.map(day => (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    "p-3 rounded-2xl text-center transition-colors flex-shrink-0 w-24 md:w-auto",
                    isSameDay(day, selectedDay)
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "hover:bg-primary/10",
                    isSameDay(day, new Date()) && !isSameDay(day, selectedDay)
                      ? "border border-primary"
                      : ""
                  )}
                >
                  <p className="text-sm capitalize">{format(day, 'eee', { locale: fr })}</p>
                  <p className="font-bold text-2xl mt-1">{format(day, 'd')}</p>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>
      
      <div>
        <h3 className="text-xl font-bold mb-4">{format(selectedDay, 'PPPP', { locale: fr })}</h3>
        <div className="space-y-4">
          {dayEvents.length > 0 ? dayEvents.map(event => (
            <div key={event.id} className="flex items-start gap-4 p-4 rounded-3xl bg-background/70 backdrop-blur-sm border">
                <div className="w-1.5 h-16 bg-accent rounded-full"></div>
                <div className="flex-1">
                    <p className="font-semibold">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                </div>
                <div className="text-right">
                    <p className="font-medium">{format(parseISO(event.date), 'HH:mm')}</p>
                </div>
            </div>
          )) : (
            <p className="text-muted-foreground text-center py-8">Aucun événement pour ce jour.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default CalendarView
