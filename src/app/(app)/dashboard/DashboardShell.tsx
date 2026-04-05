"use client";

import { localToday, offsetDate } from "@/lib/date";
import { DailySummaryCard } from "@/components/dashboard/DailySummaryCard";
import { WeeklyTable } from "@/components/dashboard/WeeklyTable";
import { QuickAddCard } from "@/components/dashboard/QuickAddCard";

interface Goals {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
}

export function DashboardShell({ goals }: { goals: Goals }) {
  const today = localToday();
  const sevenDaysAgo = offsetDate(today, -6);

  return (
    <>
      <DailySummaryCard date={today} goals={goals} />
      <QuickAddCard date={today} />
      <WeeklyTable from={sevenDaysAgo} to={today} goals={goals} />
    </>
  );
}
