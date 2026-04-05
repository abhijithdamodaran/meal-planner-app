import { redirect } from "next/navigation";

// /log always shows today — redirect to dated route so date is in the URL
export default function LogIndexPage() {
  const today = new Date().toISOString().split("T")[0];
  redirect(`/log/${today}`);
}
