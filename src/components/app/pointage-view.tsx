
"use client";

import React, { useState, useMemo } from 'react';
import type { ClockIn } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { format, parseISO, isToday, isThisWeek, isThisMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Image as ImageIcon, Users, CheckCircle } from 'lucide-react';

type PointageViewProps = {
  clockIns: ClockIn[];
};

const PointageView = ({ clockIns }: PointageViewProps) => {
  const [filter, setFilter] = useState<'day' | 'week' | 'month'>('day');

  const filteredClockIns = useMemo(() => {
    const now = new Date();
    return clockIns
      .filter(ci => {
        const date = parseISO(ci.timestamp);
        if (filter === 'day') return isToday(date);
        if (filter === 'week') return isThisWeek(date, { weekStartsOn: 1 });
        if (filter === 'month') return isThisMonth(date);
        return true;
      })
      .sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
  }, [clockIns, filter]);
  
  const stats = useMemo(() => {
    const presentDays = new Set(clockIns.map(ci => format(parseISO(ci.timestamp), 'yyyy-MM-dd'))).size;
    return {
        presentDays: presentDays,
    }
  }, [clockIns]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            Pointages
          </h2>
          <p className="text-muted-foreground">Historique des pointages du collaborateur.</p>
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
         <Card className="rounded-4xl">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Présence (jours)</CardTitle>
             <Users className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">{stats.presentDays}</div>
             <p className="text-xs text-muted-foreground">
               sur les 30 derniers jours
             </p>
           </CardContent>
         </Card>
          <Card className="rounded-4xl">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Heures travaillées (semaine)</CardTitle>
             <CheckCircle className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">--h --min</div>
              <p className="text-xs text-muted-foreground">
               Donnée indisponible
             </p>
           </CardContent>
         </Card>
          <Card className="rounded-4xl">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
             <CardTitle className="text-sm font-medium">Moyenne journalière</CardTitle>
             <Calendar className="h-4 w-4 text-muted-foreground" />
           </CardHeader>
           <CardContent>
             <div className="text-2xl font-bold">--h --min</div>
             <p className="text-xs text-muted-foreground">
               Donnée indisponible
             </p>
           </CardContent>
         </Card>
       </div>

      <Card className="rounded-4xl">
         <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Historique</CardTitle>
                    <CardDescription>Liste de tous les pointages enregistrés.</CardDescription>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-muted p-1">
                    <Button size="sm" variant={filter === 'day' ? 'default' : 'ghost'} onClick={() => setFilter('day')} className="rounded-full">Jour</Button>
                    <Button size="sm" variant={filter === 'week' ? 'default' : 'ghost'} onClick={() => setFilter('week')} className="rounded-full">Semaine</Button>
                    <Button size="sm" variant={filter === 'month' ? 'default' : 'ghost'} onClick={() => setFilter('month')} className="rounded-full">Mois</Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
          {filteredClockIns.length === 0 ? (
             <div className="text-center py-16 px-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-4xl">
              <h3 className="text-lg font-semibold">Aucun pointage.</h3>
              <p className="mt-1 text-muted-foreground">Aucun pointage n'a été enregistré pour cette période.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Heure</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Preuve</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClockIns.map(ci => (
                  <TableRow key={ci.id}>
                    <TableCell>{format(parseISO(ci.timestamp), 'PPP', { locale: fr })}</TableCell>
                    <TableCell className="font-medium">{format(parseISO(ci.timestamp), 'HH:mm:ss', { locale: fr })}</TableCell>
                    <TableCell>
                      <Badge variant={ci.type === 'start' ? 'secondary' : 'destructive'}>
                        {ci.type === 'start' ? 'Début' : 'Fin'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="icon" className="rounded-full">
                           <ImageIcon className="h-4 w-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PointageView;
