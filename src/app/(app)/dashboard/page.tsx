import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "./DashboardShell";

export default async function DashboardPage() {
  const session = await getSession();

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

      {/* DashboardShell is a client component — computes today in the browser timezone */}
      <DashboardShell goals={goals} />
    </div>
  );
}

function getGreeting() {
  // Server-side: use UTC hour. Close enough for greeting; not used for date logic.
  const h = new Date().getUTCHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
