import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export default async function HouseholdPage() {
  const session = await getSession();
  const household = session
    ? await prisma.household.findUnique({
        where: { id: session.householdId },
        include: { users: { select: { id: true, name: true, email: true } } },
      })
    : null;

  if (!household) return null;

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Household</h1>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">{household.name}</h2>
        </CardHeader>
        <CardBody className="flex flex-col gap-6">
          {/* Members */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Members</p>
            <ul className="flex flex-col gap-2">
              {household.users.map((u) => (
                <li key={u.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
                    {u.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Invite code */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Invite code</p>
            <p className="mb-2 text-xs text-gray-500">
              Share this code with your partner so they can join this household during registration.
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-green-300 bg-green-50 px-4 py-3">
              <code className="flex-1 text-sm font-mono font-semibold text-green-800 break-all">
                {household.inviteCode}
              </code>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
