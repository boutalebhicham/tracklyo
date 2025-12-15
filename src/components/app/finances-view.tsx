"use client"

import React, { useState, useMemo } from 'react'
import type { Transaction, Currency, UserRole } from '@/lib/definitions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { calculateBalance, convertCurrency, formatCurrency } from '@/lib/utils'
import { format, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

type FinancesViewProps = {
  transactions: Transaction[]
  onAddTransaction: () => void
  viewAs: UserRole
}

const FinancesView = ({ transactions, onAddTransaction, viewAs }: FinancesViewProps) => {
  const [currentCurrency, setCurrentCurrency] = useState<Currency>('EUR')
  const { balance, totalBudget, totalExpenses } = calculateBalance(transactions)

  const displayBalance = useMemo(() => convertCurrency(balance, 'EUR', currentCurrency), [balance, currentCurrency])
  const displayTotalBudget = useMemo(() => convertCurrency(totalBudget, 'EUR', currentCurrency), [totalBudget, currentCurrency])
  const displayTotalExpenses = useMemo(() => convertCurrency(totalExpenses, 'EUR', currentCurrency), [totalExpenses, currentCurrency])

  const chartData = useMemo(() => {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Finances</h2>
        <div className="flex items-center gap-4">
          <Select value={currentCurrency} onValueChange={(value: Currency) => setCurrentCurrency(value)}>
            <SelectTrigger className="w-[100px] rounded-xl backdrop-blur-sm bg-background/70">
              <SelectValue placeholder="Devise" />
            </SelectTrigger>
            <SelectContent className="rounded-xl backdrop-blur-sm bg-popover/80">
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="XOF">XOF</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onAddTransaction} className="rounded-xl gap-2">
            <Plus size={16}/>
            <span>{viewAs === 'PATRON' ? 'Budget' : 'Dépense'}</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-4xl bg-background/70 backdrop-blur-sm"><CardHeader><CardTitle>Solde Total</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{formatCurrency(displayBalance, currentCurrency)}</p></CardContent></Card>
        <Card className="rounded-4xl bg-background/70 backdrop-blur-sm"><CardHeader><CardTitle>Total Budget</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-500">{formatCurrency(displayTotalBudget, currentCurrency)}</p></CardContent></Card>
        <Card className="rounded-4xl bg-background/70 backdrop-blur-sm"><CardHeader><CardTitle>Total Dépenses</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-red-500">{formatCurrency(displayTotalExpenses, currentCurrency)}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 rounded-4xl bg-background/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Flux de trésorerie</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart accessibilityLayer data={chartData}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="budget" fill="var(--color-budget)" radius={8} />
                <Bar dataKey="expenses" fill="var(--color-expenses)" radius={8} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2 rounded-4xl bg-background/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Historique</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[300px] overflow-y-auto">
            <Table>
              <TableBody>
                {transactions.slice().reverse().map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {tx.type === 'BUDGET_ADD' ? <ArrowUpCircle className="text-green-500" /> : <ArrowDownCircle className="text-red-500" />}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{tx.reason}</p>
                      <p className="text-sm text-muted-foreground">{format(parseISO(tx.date), 'd MMM yyyy', { locale: fr })}</p>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(tx.amount, tx.currency)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default FinancesView