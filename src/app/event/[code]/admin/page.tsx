import { getServerSupabase } from "@/lib/supabase";
import { notFound, redirect } from "next/navigation";
import { QuestionList } from "@/components/question-list";
import { AdminControls } from "@/components/admin-controls";
import { NicknameGate } from "@/components/nickname-gate";

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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <NicknameGate eventCode={event.code}>
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-800">{event.title}</h1>
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm border border-gray-100">
              <span className="text-xs font-medium text-orange-500">관리자</span>
              <span className="text-xs text-gray-300">|</span>
              <span className="text-xs text-gray-400">참여 코드</span>
              <span className="font-mono font-bold text-violet-600 tracking-wider">{event.code}</span>
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
