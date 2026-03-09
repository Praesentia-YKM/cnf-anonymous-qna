"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { hasNickname, setNickname } from "@/lib/utils/nickname";

interface NicknameGateProps {
  eventCode: string;
  children: React.ReactNode;
}

export function NicknameGate({ eventCode, children }: NicknameGateProps) {
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (hasNickname(eventCode)) {
      setReady(true);
    }
  }, [eventCode]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = input.trim() || "익명";
    setNickname(eventCode, name);
    setReady(true);
  }

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-lg text-center">닉네임 설정</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="닉네임 (비워두면 '익명')"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={30}
                  autoFocus
                />
                <p className="text-xs text-gray-400">이 이벤트에서 사용할 닉네임입니다</p>
              </div>
              <Button type="submit" className="w-full">
                참여하기
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return <>{children}</>;
}
