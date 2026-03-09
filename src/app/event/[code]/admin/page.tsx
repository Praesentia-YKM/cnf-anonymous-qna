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
    <main className="min-h-screen bg-gray-50">
      <NicknameGate eventCode={event.code}>
        <div className="max-w-2xl mx-auto p-4 space-y-4">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold">{event.title}</h1>
            <p className="text-sm text-gray-500">관리자 모드 | 코드: {event.code}</p>
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
