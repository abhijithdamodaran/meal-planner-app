"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { localToday } from "@/lib/date";

export default function LogIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/log/${localToday()}`);
  }, [router]);
  return null;
}
