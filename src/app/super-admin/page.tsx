import { getServerSupabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { SuperAdminDashboard } from "@/components/super-admin/dashboard";

export default async function SuperAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const adminKey = process.env.SUPER_ADMIN_KEY;

  if (!key || !adminKey || key !== adminKey) {
    notFound();
  }

  const supabase = getServerSupabase();

  // 전체 소통방 + 질문/답변 수
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  const { count: questionCount } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });

  const { count: answerCount } = await supabase
    .from("answers")
    .select("*", { count: "exact", head: true });

  // 오늘 생성된 질문/답변 수
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const { count: todayQuestions } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayISO);

  const { count: todayAnswers } = await supabase
    .from("answers")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayISO);

  // 소통방별 질문/답변 수
  const eventIds = (events || []).map((e) => e.id);
  const { data: questions } = await supabase
    .from("questions")
    .select("id, event_id")
    .in("event_id", eventIds.length > 0 ? eventIds : ["none"]);

  const { data: answers } = await supabase
    .from("answers")
    .select("id, question_id");

  // 질문별 답변 수 계산
  const questionsByEvent: Record<string, number> = {};
  const answersByEvent: Record<string, number> = {};
  const questionToEvent: Record<string, string> = {};

  (questions || []).forEach((q) => {
    questionsByEvent[q.event_id] = (questionsByEvent[q.event_id] || 0) + 1;
    questionToEvent[q.id] = q.event_id;
  });

  (answers || []).forEach((a) => {
    const eventId = questionToEvent[a.question_id];
    if (eventId) {
      answersByEvent[eventId] = (answersByEvent[eventId] || 0) + 1;
    }
  });

  // 활동 로그 (최근 50개)
  const { data: logs } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">CNF-AskAnon 관리자</h1>
          <p className="text-sm text-gray-400 mt-1">슈퍼 관리자 대시보드</p>
        </div>
        <SuperAdminDashboard
          events={events || []}
          stats={{
            totalEvents: events?.length || 0,
            activeEvents: events?.filter((e) => e.is_active).length || 0,
            totalQuestions: questionCount || 0,
            totalAnswers: answerCount || 0,
            todayQuestions: todayQuestions || 0,
            todayAnswers: todayAnswers || 0,
          }}
          questionsByEvent={questionsByEvent}
          answersByEvent={answersByEvent}
          logs={logs || []}
          adminKey={key}
        />
      </div>
    </main>
  );
}
