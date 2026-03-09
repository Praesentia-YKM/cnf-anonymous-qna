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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-blue-50 p-4">
        <Card className="w-full max-w-sm shadow-xl border-0 bg-white/90 backdrop-blur">
          <CardHeader className="text-center pb-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-violet-100 to-blue-100 text-3xl mx-auto mb-2">
              👤
            </div>
            <CardTitle className="text-xl">환영합니다!</CardTitle>
            <p className="text-sm text-gray-500 mt-1">이벤트에서 사용할 닉네임을 설정하세요</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="닉네임 (비워두면 '익명')"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={30}
                autoFocus
                className="h-12 text-center text-lg"
              />
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-violet-500 to-blue-500 hover:from-violet-600 hover:to-blue-600 text-white shadow-md"
              >
                참여하기
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
