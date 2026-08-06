export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-black/50 dark:text-white/50">오늘의 상황 문장</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          오늘의 상황 문장이 아직 준비되지 않았습니다
        </h1>
      </div>
      <p className="text-black/70 dark:text-white/70">
        상황 문장 소싱 및 로그인/제출 기능은 다음 단계에서 구현됩니다.
      </p>
    </div>
  );
}
