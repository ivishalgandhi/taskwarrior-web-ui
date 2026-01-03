import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TasksClient from "./tasks-client";

export default async function TasksPage() {
  const session = await auth();
  
  // CRITICAL: Server-side auth check - backup layer in addition to middleware
  if (!session) {
    redirect("/login");
  }

  // If authenticated, render the client component
  return <TasksClient />;
}
