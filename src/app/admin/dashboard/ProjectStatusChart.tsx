"use client"

import { Pie, PieChart, Cell, Tooltip, Legend } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
} from "@/components/ui/chart"

interface ChartData {
    name: string;
    value: number;
    fill: string;
}

interface ProjectStatusChartProps {
  data: ChartData[];
}

export function ProjectStatusChart({ data }: ProjectStatusChartProps) {
  const chartConfig = data.reduce((acc, item) => {
    acc[item.name.toLowerCase()] = { label: item.name, color: item.fill };
    return acc;
  }, {} as any);

  return (
     <Card>
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
        <CardDescription>A summary of projects by their payment status.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
          <PieChart>
            <Tooltip 
              cursor={false} 
              contentStyle={{ 
                background: "hsl(var(--background))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)"
               }}
            />
            <Legend />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
              paddingAngle={5}
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
