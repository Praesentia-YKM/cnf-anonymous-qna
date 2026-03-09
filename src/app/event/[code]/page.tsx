import { getServerSupabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { QuestionList } from "@/components/question-list";
import { NicknameGate } from "@/components/nickname-gate";

export default async function EventPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = getServerSupabase();

  const { data: event } = await supabase
    .from("events")
    .select("id, code, title, is_active")
    .eq("code", code.toUpperCase())
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
            <p className="text-sm text-gray-500">코드: {event.code}</p>
          </div>
          <QuestionList
            eventId={event.id}
            eventCode={event.code}
            initialQuestions={questions ?? []}
            isActive={event.is_active}
          />
        </div>
      </NicknameGate>
    </main>
  );
}
