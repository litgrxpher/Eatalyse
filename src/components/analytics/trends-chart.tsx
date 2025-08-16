
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getWeeklyTrends } from "@/lib/firestore";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "../ui/skeleton";
import { format, parseISO } from "date-fns";

type TrendData = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background border rounded-lg shadow-sm text-sm">
        <p className="font-bold">{format(parseISO(label), "EEEE, MMM d")}</p>
        {payload.map((pld: any) => (
          <p key={pld.dataKey} style={{ color: pld.fill }}>
            {`${pld.name}: ${Math.round(pld.value)} ${pld.dataKey === 'calories' ? 'kcal' : 'g'}`}
          </p>
        ))}
      </div>
    );
  }

  return null;
};


export function TrendsChart() {
  const { user } = useAuth();
  const [data, setData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setLoading(true);
        const trends = await getWeeklyTrends(user.uid);
        setData(trends);
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
      return (
          <Card>
              <CardHeader>
                  <CardTitle>Weekly Nutrition Summary</CardTitle>
                  <CardDescription>Your nutritional intake over the last 7 days.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Skeleton className="h-[350px] w-full" />
              </CardContent>
          </Card>
      )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Nutrition Summary</CardTitle>
        <CardDescription>Your nutritional intake over the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => format(parseISO(value), "EEE")}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              label={{ value: 'Grams', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))', style: {textAnchor: 'middle'} }}
              width={40}
            />
             <YAxis
              yAxisId="right"
              orientation="right"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              label={{ value: 'Calories (kcal)', angle: -90, position: 'insideRight', fill: 'hsl(var(--muted-foreground))', style: {textAnchor: 'middle'} }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsl(var(--muted))'}} />
            <Legend wrapperStyle={{fontSize: '0.875rem', paddingTop: '20px'}} />
            <Bar yAxisId="right" dataKey="calories" name="Calories" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="protein" name="Protein" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="carbs" name="Carbs" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
            <Bar yAxisId="left" dataKey="fat" name="Fat" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
