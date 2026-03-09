"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createEvent } from "@/app/actions";

export function CreateEventForm() {
  const [state, formAction, pending] = useActionState(createEvent, null);

  return (
    <form action={formAction} className="space-y-3">
      <Input
        name="title"
        placeholder="이벤트 제목 (예: 2026 봄 세미나 Q&A)"
        maxLength={200}
        required
        className="h-11"
      />
      {state?.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}
      <Button
        type="submit"
        disabled={pending}
        className="w-full h-11 bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white shadow-md"
      >
        {pending ? "생성 중..." : "이벤트 생성"}
      </Button>
    </form>
  );
}
