import { getServerSupabase } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import { QuestionList } from "@/components/question-list";
import { AdminControls } from "@/components/admin-controls";
import { NicknameGate } from "@/components/nickname-gate";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { code } = await params;
  const { token } = await searchParams;

  if (!token) redirect(`/event/${code}`);

  const supabase = getServerSupabase();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("admin_token", token)
    .single();

  if (!event) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("event_id", event.id)
    .order("like_count", { ascending: false });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <NicknameGate eventCode={event.code}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          <div className="text-center space-y-2 relative">
            <div className="absolute right-0 top-0">
              <ThemeToggle />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{event.title}</h1>
            <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-1.5 shadow-sm border border-gray-100 dark:border-gray-700">
              <span className="text-xs font-medium text-orange-500">관리자</span>
              <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
              <span className="text-xs text-gray-400">참여 코드</span>
              <span className="font-mono font-bold text-violet-600 dark:text-violet-400 tracking-wider">{event.code}</span>
            </div>
          </div>
          <AdminControls eventId={event.id} isActive={event.is_active} />
          <QuestionList
            eventId={event.id}
            eventCode={event.code}
            initialQuestions={questions ?? []}
            isActive={event.is_active}
            isAdmin={true}
          />
        </div>
      </NicknameGate>
    </main>
  );
}
