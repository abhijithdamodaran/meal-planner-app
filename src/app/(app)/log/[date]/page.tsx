import { DailyLogView } from "./DailyLogView";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

interface Props {
  params: { date: string };
}

export default async function LogDatePage({ params }: Props) {
  const { date } = params;

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect("/log");

  const session = await getSession();
  const prefs = session
    ? await prisma.userPreferences.findUnique({ where: { userId: session.userId } })
    : null;

  const goals = {
    calories: prefs?.calorieGoal ?? null,
    proteinG: prefs?.proteinGoalG ?? null,
    carbsG: prefs?.carbsGoalG ?? null,
    fatG: prefs?.fatGoalG ?? null,
  };

  return <DailyLogView date={date} goals={goals} />;
}
