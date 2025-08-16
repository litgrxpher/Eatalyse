
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getWeightHistory } from "@/lib/firestore";
import type { WeightEntry } from "@/types";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "../ui/skeleton";
import { format, parseISO } from "date-fns";

export function WeightTracker() {
  const { user } = useAuth();
  const [data, setData] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setLoading(true);
        const history = await getWeightHistory(user.uid);
        setData(history);
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return <Skeleton className="h-[350px] w-full" />;
  }

  if (data.length === 0) {
      return (
          <div className="text-center text-muted-foreground p-8">
              <p>No weight history found.</p>
              <p>Add your current weight in the Profile Information section to start tracking.</p>
          </div>
      )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => format(parseISO(value), "MMM d")}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value} kg`}
          domain={['dataMin - 2', 'dataMax + 2']}
        />
        <Tooltip
            contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
            }}
            labelFormatter={(label) => format(parseISO(label), "MMMM d, yyyy")}
        />
        <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }}/>
      </LineChart>
    </ResponsiveContainer>
  );
}
