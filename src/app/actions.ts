"use server";

import { getServerSupabase } from "@/lib/supabase";
import { generateEventCode } from "@/lib/utils/code-generator";
import { redirect } from "next/navigation";

export async function createEvent(formData: FormData) {
  const title = formData.get("title") as string;
  if (!title?.trim()) return;

  const supabase = getServerSupabase();

  // 코드 충돌 시 최대 3회 재시도
  let data;
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateEventCode();
    const result = await supabase
      .from("events")
      .insert({ title: title.trim(), code })
      .select("code, admin_token")
      .single();

    if (!result.error) {
      data = result.data;
      break;
    }
  }

  if (!data) throw new Error("이벤트 생성 실패");

  redirect(`/event/${data.code}/admin?token=${data.admin_token}`);
}

export async function joinEvent(formData: FormData) {
  const code = (formData.get("code") as string)?.toUpperCase().trim();
  if (!code) return;

  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("events")
    .select("code")
    .eq("code", code)
    .single();

  if (!data) {
    throw new Error("존재하지 않는 코드입니다.");
  }

  redirect(`/event/${data.code}`);
}
