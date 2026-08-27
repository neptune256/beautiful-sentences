// 피드백 버튼(fixed bottom-5 right-5)과 같은 우측 하단 열에, 그 바로 위에 쌓이도록 배치한다.
export function QuestWidgetSlot({ children }: { children: React.ReactNode }) {
  return <div className="fixed right-5 bottom-24 z-30">{children}</div>;
}
