export default function RankingPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-black/50 dark:text-white/50">랭킹</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          누적 포인트 순위표
        </h1>
      </div>
      <p className="text-black/70 dark:text-white/70">
        아직 집계된 포인트가 없습니다.
      </p>
    </div>
  );
}
