"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { useQueryClient } from "@tanstack/react-query";

type Mode = "create" | "join";

export default function RegisterPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<Mode>("create");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const body =
      mode === "create"
        ? { name, email, password, householdName }
        : { name, email, password, inviteCode };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ["session"] });
    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Meal Planner</h1>
          <p className="mt-1 text-sm text-gray-500">Create your account</p>
        </div>

        {/* Mode toggle */}
        <div className="mb-4 flex rounded-lg border border-gray-200 bg-white p-1">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === "create"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            New household
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              mode === "join"
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Join household
          </button>
        </div>

        <Card>
          <CardBody className="py-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Your name"
                type="text"
                placeholder="Abhi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />

              {mode === "create" ? (
                <Input
                  label="Household name"
                  type="text"
                  placeholder="e.g. Our Home"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  required
                  hint="You can share an invite code with your partner after registering."
                />
              ) : (
                <Input
                  label="Invite code"
                  type="text"
                  placeholder="Paste the invite code here"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                  hint="Ask the first person who registered to find it in Settings → Household."
                />
              )}

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}

              <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
                {mode === "create" ? "Create account" : "Join & create account"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-green-600 hover:text-green-700">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
