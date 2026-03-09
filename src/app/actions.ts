"use server";

import { createClient } from "@supabase/supabase-js";
import { generateEventCode } from "@/lib/utils/code-generator";
import { redirect } from "next/navigation";

function getServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function createEvent(formData: FormData) {
  const title = formData.get("title") as string;
  if (!title?.trim()) return;

  const supabase = getServerSupabase();
  const code = generateEventCode();

  const { data, error } = await supabase
    .from("events")
    .insert({ title: title.trim(), code })
    .select("code, admin_token")
    .single();

  if (error) throw new Error("이벤트 생성 실패");

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
    return { error: "존재하지 않는 코드입니다." };
  }

  redirect(`/event/${data.code}`);
}
