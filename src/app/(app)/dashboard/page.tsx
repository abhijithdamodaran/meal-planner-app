import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DailySummaryCard } from "@/components/dashboard/DailySummaryCard";
import { WeeklyTable } from "@/components/dashboard/WeeklyTable";
import { QuickAddCard } from "@/components/dashboard/QuickAddCard";

export default async function DashboardPage() {
  const session = await getSession();
  const today = new Date().toISOString().split("T")[0];

  // 7 days ago
  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const prefs = session
    ? await prisma.userPreferences.findUnique({ where: { userId: session!.userId } })
    : null;

  const goals = {
    calories: prefs?.calorieGoal ?? null,
    proteinG: prefs?.proteinGoalG ?? null,
    carbsG: prefs?.carbsGoalG ?? null,
    fatG: prefs?.fatGoalG ?? null,
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {getGreeting()}, {session?.name}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">Here&apos;s how you&apos;re tracking today.</p>
      </div>

      <DailySummaryCard date={today} goals={goals} />
      <QuickAddCard date={today} />
      <WeeklyTable from={sevenDaysAgo} to={today} goals={goals} />
    </div>
  );
}

function getGreeting() {
  const h = new Date().getUTCHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
