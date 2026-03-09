import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createEvent, joinEvent } from "./actions";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">AskAnon</h1>
          <p className="text-gray-500">익명으로 질문하고, 실시간으로 소통하세요</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">이벤트 참여하기</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={joinEvent} className="flex gap-2">
              <Input
                name="code"
                placeholder="참여 코드 입력 (예: ABC123)"
                maxLength={6}
                className="uppercase"
                required
              />
              <Button type="submit">참여</Button>
            </form>
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-50 px-2 text-gray-500">또는</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">새 이벤트 만들기</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createEvent} className="space-y-3">
              <Input
                name="title"
                placeholder="이벤트 제목 (예: 2026 봄 세미나 Q&A)"
                maxLength={200}
                required
              />
              <Button type="submit" className="w-full">
                이벤트 생성
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
