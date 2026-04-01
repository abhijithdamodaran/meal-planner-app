import { getSession } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome back, {session?.name} 👋
      </h1>
      <p className="mt-1 text-gray-500">
        Your dashboard is coming in Phase 4. Auth is working!
      </p>
    </div>
  );
}
