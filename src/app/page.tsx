import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JoinForm } from "@/components/join-form";
import { CreateEventForm } from "@/components/create-event-form";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-white text-2xl font-bold shadow-lg">
            ?
          </div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-violet-600 to-blue-600 dark:from-violet-400 dark:to-blue-400 bg-clip-text text-transparent">
            CNF-AskAnon
          </h1>
          <p className="text-gray-500 dark:text-gray-400">업무 관련하여 익명으로 질문하고 업무 지식을 공유해봐요</p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-xl">🔗</span> 소통방 참여하기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <JoinForm />
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gradient-to-r from-violet-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-3 text-gray-400 font-medium">
              또는
            </span>
          </div>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="text-xl">✨</span> 새 소통방 만들기
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CreateEventForm />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400">
          모든 질문과 답변은 익명으로 처리됩니다
        </p>
      </div>
    </main>
  );
}
