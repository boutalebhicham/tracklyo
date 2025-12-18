"use client"

import React from 'react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

type ChartDataPoint = {
  month: string
  budget: number
  expenses: number
}

type CashFlowChartProps = {
  data: ChartDataPoint[]
  currency: string
}

const chartConfig = {
  budget: { label: "Budget", color: "hsl(var(--chart-1))" },
  expenses: { label: "Dépenses", color: "hsl(var(--chart-2))" },
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ data, currency }) => {
  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <BarChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="budget" fill="var(--color-budget)" radius={[8, 8, 0, 0]} />
        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}

export default CashFlowChart
