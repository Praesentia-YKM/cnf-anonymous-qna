"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabase } from "@/lib/supabase";
import { useState } from "react";

interface AdminControlsProps {
  eventId: string;
  isActive: boolean;
}

export function AdminControls({ eventId, isActive: initialActive }: AdminControlsProps) {
  const [isActive, setIsActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);
    const newState = !isActive;
    await getSupabase()
      .from("events")
      .update({ is_active: newState })
      .eq("id", eventId);
    setIsActive(newState);
    setLoading(false);
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <span className="text-sm font-medium">질문 접수: </span>
          <span className={`text-sm font-bold ${isActive ? "text-green-600" : "text-red-600"}`}>
            {isActive ? "진행 중" : "종료됨"}
          </span>
        </div>
        <Button
          variant={isActive ? "destructive" : "default"}
          size="sm"
          onClick={toggleActive}
          disabled={loading}
        >
          {isActive ? "질문 접수 종료" : "질문 접수 재개"}
        </Button>
      </CardContent>
    </Card>
  );
}
