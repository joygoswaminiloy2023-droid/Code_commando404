"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function AnalyticsChart({ tasks }: { tasks: any[] }) {
  const byMember: Record<string, { name: string; onTime: number; late: number; pending: number }> = {};

  tasks.forEach((t) => {
    const assignees = t.assignees?.length ? t.assignees : [{ name: "Unknown" }];
    assignees.forEach((assignee: any) => {
      const name = assignee?.name || "Unknown";
      if (!byMember[name]) byMember[name] = { name, onTime: 0, late: 0, pending: 0 };
      if (t.status === "completed") {
        const onTime = t.completedAt && new Date(t.completedAt) <= new Date(t.deadline);
        if (onTime) byMember[name].onTime += 1;
        else byMember[name].late += 1;
      } else {
        byMember[name].pending += 1;
      }
    });
  });

  const data = Object.values(byMember);

  if (data.length === 0) {
    return <div className="text-mute text-sm py-12 text-center">No tasks assigned yet — analytics will fill in once work starts moving.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="#232D3A" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#7C8B9C", fontSize: 12 }} axisLine={{ stroke: "#232D3A" }} tickLine={false} />
        <YAxis tick={{ fill: "#7C8B9C", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: "#161E29", border: "1px solid #232D3A", borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: "#EAF0F6" }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#7C8B9C" }} />
        <Bar dataKey="onTime" name="On time" stackId="a" fill="#5EF1C0" radius={[0, 0, 0, 0]} />
        <Bar dataKey="late" name="Late" stackId="a" fill="#F26B6B" radius={[0, 0, 0, 0]} />
        <Bar dataKey="pending" name="Pending" stackId="a" fill="#F5B95B" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
