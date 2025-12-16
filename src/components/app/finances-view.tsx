

"use client"

import React, { useState, useMemo } from 'react'
import type { Transaction, Currency } from '@/lib/definitions'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableRow, TableHead, TableHeader } from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { calculateBalance, convertCurrency, formatCurrency, formatCurrencyCompact } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus, ArrowDown, ArrowUp, Wallet, Clock, MoreHorizontal } from 'lucide-react'
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase'
import { collection, query, orderBy } from 'firebase/firestore'
import { Skeleton } from '../ui/skeleton'

type FinancesViewProps = {
  viewedUserId: string | null
  onAddTransaction: () => void
  viewAs: string | undefined
}

const FinancesView = ({ viewedUserId, onAddTransaction, viewAs }: FinancesViewProps) => {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('EUR')
  
  const firestore = useFirestore();
  const transactionsQuery = useMemoFirebase(() => viewedUserId ? query(collection(firestore, 'users', viewedUserId, 'transactions'), orderBy('date', 'desc')) : null, [firestore, viewedUserId]);
  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  const { balance, totalBudget, totalExpenses } = useMemo(() => {
    if (!transactions) return { balance: 0, totalBudget: 0, totalExpenses: 0 };
    return calculateBalance(transactions);
  }, [transactions]);

  const displayBalance = useMemo(() => convertCurrency(balance, 'EUR', currentCurrency), [balance, currentCurrency])
  const displayTotalBudget = useMemo(() => convertCurrency(totalBudget, 'EUR', currentCurrency), [totalBudget, currentCurrency])
  const displayTotalExpenses = useMemo(() => convertCurrency(totalExpenses, 'EUR', currentCurrency), [totalExpenses, currentCurrency])

  const chartData = useMemo(() => {
    if (!transactions) return [];
    const monthlyData: { [key: string]: { budget: number, expenses: number } } = {}
    
    transactions.forEach(tx => {
      const month = format(parseISO(tx.date), 'MMM', { locale: fr })
      if (!monthlyData[month]) {
        monthlyData[month] = { budget: 0, expenses: 0 }
      }
      const amountInSelectedCurrency = convertCurrency(tx.amount, tx.currency, currentCurrency)
      if (tx.type === 'BUDGET_ADD') {
        monthlyData[month].budget += amountInSelectedCurrency
      } else {
        monthlyData[month].expenses += amountInSelectedCurrency
      }
    })

    return Object.keys(monthlyData).map(month => ({
      month,
      budget: monthlyData[month].budget,
      expenses: monthlyData[month].expenses
    })).reverse()
  }, [transactions, currentCurrency])

  const chartConfig = {
    budget: { label: "Budget", color: "hsl(var(--chart-1))" },
    expenses: { label: "Dépenses", color: "hsl(var(--chart-2))" },
  }

  const handleCurrencyChange = (currency: Currency) => {
    setCurrentCurrency(currency);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[250px] rounded-4xl" />
          <Skeleton className="h-[350px] lg:col-span-2 rounded-4xl" />
        </div>
        <Skeleton className="h-[200px] rounded-4xl" />
      </div>
    );
  }

  if (!transactions) {
    return <p>Impossible de charger les transactions.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Finances</h2>
          <p className="text-muted-foreground">Vue consolidée de votre trésorerie.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="bg-white dark:bg-neutral-800 p-1 rounded-full flex items-center justify-center">
                {(['EUR', 'USD', 'XOF'] as Currency[]).map(c => (
                <Button 
                    key={c}
                    variant={currentCurrency === c ? 'default' : 'ghost'} 
                    onClick={() => handleCurrencyChange(c)}
                    className="rounded-full px-4 h-8 text-xs sm:text-sm"
                >
                    {c}
                </Button>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <Button onClick={onAddTransaction} className="flex-1 rounded-xl gap-2 h-10 bg-primary/20 text-primary hover:bg-primary/30">
                    <Plus size={16} />
                    <span>Budget</span>
                </Button>
                <Button onClick={onAddTransaction} variant="destructive" className="flex-1 rounded-xl gap-2 h-10">
                    <Plus size={16} />
                    <span>Dépense</span>
                </Button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="dark bg-gray-900 text-white rounded-4xl shadow-2xl shadow-primary/10 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
             <div className="p-3 bg-white/10 rounded-xl">
                <Wallet size={20} />
             </div>
             <div className="text-right">
                <p className="text-xs text-white/50">AFFICHAGE EN</p>
                <p className="font-bold">{currentCurrency}</p>
             </div>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
            <p className="text-sm text-white/60">Solde Total Estimé</p>
            <p className="text-5xl font-bold tracking-tighter my-2">{formatCurrencyCompact(displayBalance, currentCurrency)}</p>
          </CardContent>
          <CardFooter className="flex justify-between items-center text-sm border-t border-white/10 p-4">
            <div className="flex items-center gap-2 text-green-400">
              <ArrowDown size={16} />
              <span>{formatCurrencyCompact(displayTotalBudget, currentCurrency)}</span>
            </div>
            <div className="flex items-center gap-2 text-red-400">
              <ArrowUp size={16} />
              <span>{formatCurrencyCompact(displayTotalExpenses, currentCurrency)}</span>
            </div>
          </CardFooter>
        </Card>
        
        <Card className="lg:col-span-2 rounded-4xl bg-background/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle className="flex items-center gap-2"><Clock size={18}/> Flux de trésorerie ({currentCurrency})</CardTitle>
            <Button variant="ghost" className="rounded-full text-sm font-normal">Vue Globale</Button>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="budget" fill="var(--color-budget)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
      
       <Card className="rounded-4xl bg-background/70 backdrop-blur-sm">
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Historique Global</CardTitle>
            <Button variant="ghost" className="rounded-full text-sm font-normal">Toutes devises</Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raison</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.reason}</TableCell>
                    <TableCell className="text-muted-foreground">{format(parseISO(tx.date), 'd MMM yyyy, HH:mm', { locale: fr })}</TableCell>
                    <TableCell className={`text-right font-semibold ${tx.type === 'BUDGET_ADD' ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.type === 'BUDGET_ADD' ? '+' : '-'} {formatCurrency(tx.amount, tx.currency)}
                    </TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="rounded-full h-8 w-8"><MoreHorizontal size={16}/></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  )
}

export default FinancesView
