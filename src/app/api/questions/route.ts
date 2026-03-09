import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { event_id, content, nickname } = body;

  if (!event_id || !content?.trim()) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from("questions")
    .insert({
      event_id,
      content: content.trim(),
      nickname: nickname || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 활동 로그 기록 (실패해도 질문 작성은 성공)
  await supabase.from("activity_logs").insert({
    action_type: "question",
    event_id,
    question_id: data.id,
    visitor_id: body.visitor_id || null,
    ip_address: ip,
    nickname: nickname || null,
    content_preview: content.trim().slice(0, 100),
  });

  return NextResponse.json(data);
}
