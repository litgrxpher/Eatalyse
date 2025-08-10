"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getWeeklyTrends } from "@/lib/firestore";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
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
                  <CardTitle>Weekly Calorie Intake</CardTitle>
                  <CardDescription>Calories consumed over the last 7 days.</CardDescription>
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
        <CardTitle>Weekly Calorie Intake</CardTitle>
        <CardDescription>Calories consumed over the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => format(parseISO(value), "EEE")}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
                contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                }}
            />
            <Bar dataKey="calories" fill="hsl(var(--protein))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
