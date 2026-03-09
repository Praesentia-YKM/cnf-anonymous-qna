"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinEvent } from "@/app/actions";

export function JoinForm() {
  const [state, formAction, pending] = useActionState(joinEvent, null);

  return (
    <form action={formAction} className="space-y-2">
      <div className="flex gap-2">
        <Input
          name="code"
          placeholder="참여 코드 입력 (예: ABC123)"
          maxLength={6}
          className="uppercase"
          required
        />
        <Button type="submit" disabled={pending}>
          {pending ? "..." : "참여"}
        </Button>
      </div>
      {state?.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}
    </form>
  );
}
