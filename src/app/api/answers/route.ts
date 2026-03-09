import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { question_id, content, nickname, event_id } = body;

  if (!question_id || !content?.trim()) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const supabase = getServerSupabase();

  const { data, error } = await supabase
    .from("answers")
    .insert({
      question_id,
      content: content.trim(),
      nickname: nickname || null,
      visitor_id: body.visitor_id || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // 활동 로그 기록
  await supabase.from("activity_logs").insert({
    action_type: "answer",
    event_id: event_id || null,
    question_id,
    answer_id: data.id,
    visitor_id: body.visitor_id || null,
    ip_address: ip,
    nickname: nickname || null,
    content_preview: content.trim().slice(0, 100),
  });

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, content, visitor_id } = body;

  if (!id || !content?.trim() || !visitor_id) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  const supabase = getServerSupabase();

  const { data: existing } = await supabase
    .from("answers")
    .select("visitor_id")
    .eq("id", id)
    .single();

  if (!existing || existing.visitor_id !== visitor_id) {
    return NextResponse.json({ error: "수정 권한이 없습니다" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("answers")
    .update({ content: content.trim() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
