"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase";

interface Event {
  id: string;
  code: string;
  title: string;
  is_active: boolean;
  created_at: string;
}

interface ActivityLog {
  id: string;
  action_type: string;
  event_id: string | null;
  visitor_id: string | null;
  ip_address: string | null;
  nickname: string | null;
  content_preview: string | null;
  created_at: string;
}

interface Stats {
  totalEvents: number;
  activeEvents: number;
  totalQuestions: number;
  totalAnswers: number;
  todayQuestions: number;
  todayAnswers: number;
}

interface DashboardProps {
  events: Event[];
  stats: Stats;
  questionsByEvent: Record<string, number>;
  answersByEvent: Record<string, number>;
  logs: ActivityLog[];
  adminKey: string;
}

type Tab = "events" | "logs";

export function SuperAdminDashboard({
  events: initialEvents,
  stats,
  questionsByEvent,
  answersByEvent,
  logs,
  adminKey,
}: DashboardProps) {
  const [events, setEvents] = useState(initialEvents);
  const [tab, setTab] = useState<Tab>("events");
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  async function handleToggleActive(eventId: string, currentActive: boolean) {
    await getSupabase()
      .from("events")
      .update({ is_active: !currentActive })
      .eq("id", eventId);
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, is_active: !currentActive } : e))
    );
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm("이 소통방과 모든 질문/답변이 삭제됩니다. 진행하시겠습니까?")) return;
    await getSupabase().from("events").delete().eq("id", eventId);
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  const actionLabel: Record<string, string> = {
    question: "질문 작성",
    answer: "답변 작성",
    event_create: "소통방 생성",
  };

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="전체 소통방" value={stats.totalEvents} sub={`활성 ${stats.activeEvents}`} />
        <StatCard label="전체 질문" value={stats.totalQuestions} sub={`오늘 +${stats.todayQuestions}`} />
        <StatCard label="전체 답변" value={stats.totalAnswers} sub={`오늘 +${stats.todayAnswers}`} />
        <StatCard label="활동률" value={stats.totalQuestions > 0 ? Math.round((stats.totalAnswers / stats.totalQuestions) * 100) : 0} sub="답변/질문 %" />
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        <button
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            tab === "events" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
          }`}
          onClick={() => setTab("events")}
        >
          소통방 관리
        </button>
        <button
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            tab === "logs" ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"
          }`}
          onClick={() => setTab("logs")}
        >
          활동 로그
        </button>
      </div>

      {/* 소통방 목록 */}
      {tab === "events" && (
        <Card className="border-0 shadow-md bg-white/90 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">소통방 목록 ({events.length}개)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left p-3 font-medium text-gray-600">제목</th>
                    <th className="text-left p-3 font-medium text-gray-600">코드</th>
                    <th className="text-center p-3 font-medium text-gray-600">질문</th>
                    <th className="text-center p-3 font-medium text-gray-600">답변</th>
                    <th className="text-center p-3 font-medium text-gray-600">상태</th>
                    <th className="text-center p-3 font-medium text-gray-600">생성일</th>
                    <th className="text-center p-3 font-medium text-gray-600">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b hover:bg-gray-50/50 transition-colors">
                      <td className="p-3">
                        <button
                          className="text-left hover:text-violet-600 transition-colors font-medium"
                          onClick={() => setSelectedEvent(selectedEvent === event.id ? null : event.id)}
                        >
                          {event.title}
                        </button>
                      </td>
                      <td className="p-3 font-mono text-violet-600 font-bold">{event.code}</td>
                      <td className="p-3 text-center">{questionsByEvent[event.id] || 0}</td>
                      <td className="p-3 text-center">{answersByEvent[event.id] || 0}</td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          event.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {event.is_active ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td className="p-3 text-center text-gray-400 text-xs">
                        {new Date(event.created_at).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="p-3 text-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => handleToggleActive(event.id, event.is_active)}
                        >
                          {event.is_active ? "비활성" : "활성"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          삭제
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedEvent && (
              <EventDetail eventId={selectedEvent} adminKey={adminKey} />
            )}
          </CardContent>
        </Card>
      )}

      {/* 활동 로그 */}
      {tab === "logs" && (
        <Card className="border-0 shadow-md bg-white/90 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">활동 로그 (최근 50건)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left p-3 font-medium text-gray-600">사용자</th>
                    <th className="text-left p-3 font-medium text-gray-600">액션</th>
                    <th className="text-left p-3 font-medium text-gray-600">내용</th>
                    <th className="text-left p-3 font-medium text-gray-600">시간</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const shortId = log.visitor_id ? log.visitor_id.slice(0, 8) : null;
                    return (
                    <tr key={log.id} className="border-b hover:bg-gray-50/50">
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium">{log.nickname || "익명"}</span>
                          {shortId && (
                            <span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded" title={log.visitor_id || ""}>
                              #{shortId}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          log.action_type === "question"
                            ? "bg-blue-100 text-blue-700"
                            : log.action_type === "answer"
                            ? "bg-violet-100 text-violet-700"
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {actionLabel[log.action_type] || log.action_type}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-gray-600 max-w-[200px] truncate">
                        {log.content_preview || "-"}
                      </td>
                      <td className="p-3 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("ko-KR")}
                      </td>
                    </tr>
                    );
                  })}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-gray-400">
                        아직 활동 로그가 없습니다
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <Card className="border-0 shadow-sm bg-white/90 backdrop-blur">
      <CardContent className="p-4 text-center">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-violet-500 mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

function EventDetail({ eventId, adminKey }: { eventId: string; adminKey: string }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any[]>>({});
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const { data: qs } = await getSupabase()
      .from("questions")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (qs) {
      setQuestions(qs);
      const qIds = qs.map((q) => q.id);
      if (qIds.length > 0) {
        const { data: ans } = await getSupabase()
          .from("answers")
          .select("*")
          .in("question_id", qIds)
          .order("created_at", { ascending: true });

        const grouped: Record<string, any[]> = {};
        (ans || []).forEach((a) => {
          if (!grouped[a.question_id]) grouped[a.question_id] = [];
          grouped[a.question_id].push(a);
        });
        setAnswers(grouped);
      }
    }
    setLoaded(true);
  }

  if (!loaded) {
    load();
    return <div className="p-4 text-center text-sm text-gray-400 animate-pulse">로딩 중...</div>;
  }

  async function handleDeleteQuestion(qId: string) {
    if (!confirm("이 질문과 모든 답변이 삭제됩니다.")) return;
    await getSupabase().from("questions").delete().eq("id", qId);
    setQuestions((prev) => prev.filter((q) => q.id !== qId));
  }

  async function handleDeleteAnswer(aId: string, qId: string) {
    await getSupabase().from("answers").delete().eq("id", aId);
    setAnswers((prev) => ({
      ...prev,
      [qId]: (prev[qId] || []).filter((a) => a.id !== aId),
    }));
  }

  return (
    <div className="border-t bg-gray-50/50 p-4 space-y-3">
      <h3 className="text-sm font-bold text-gray-700">질문/답변 상세 ({questions.length}개 질문)</h3>
      {questions.map((q) => (
        <div key={q.id} className="bg-white rounded-lg p-3 shadow-sm space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-gray-600">{q.nickname || "익명"}</span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-gray-400">
                  {new Date(q.created_at).toLocaleString("ko-KR")}
                </span>
                <span className="text-xs text-gray-300">·</span>
                <span className="text-xs text-violet-500">좋아요 {q.like_count}</span>
              </div>
              <p className="text-sm text-gray-800">{q.content}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-red-400 hover:text-red-600 h-6"
              onClick={() => handleDeleteQuestion(q.id)}
            >
              삭제
            </Button>
          </div>
          {(answers[q.id] || []).length > 0 && (
            <div className="pl-4 border-l-2 border-violet-100 space-y-1.5">
              {(answers[q.id] || []).map((a) => (
                <div key={a.id} className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-gray-500">{a.nickname || "익명"}</span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(a.created_at).toLocaleString("ko-KR")}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700">{a.content}</p>
                  </div>
                  <button
                    className="text-[10px] text-red-400 hover:text-red-600"
                    onClick={() => handleDeleteAnswer(a.id, q.id)}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {questions.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">질문이 없습니다</p>
      )}
    </div>
  );
}
