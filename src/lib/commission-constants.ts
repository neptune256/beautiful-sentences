export type CommissionType = "critique" | "writing";

export const COMMISSION_RULES: Record<
  CommissionType,
  { cost: number; reward: number; label: string; verb: string; bodyLabel: string; bodyPlaceholder: string }
> = {
  critique: {
    cost: 100,
    reward: 50,
    label: "합평 의뢰",
    verb: "합평",
    bodyLabel: "합평받고 싶은 글",
    bodyPlaceholder: "평가받고 싶은 글을 그대로 붙여넣어 주세요.",
  },
  writing: {
    cost: 200,
    reward: 150,
    label: "집필 의뢰",
    verb: "집필",
    bodyLabel: "요청 조건 / 쓰고 싶은 장면",
    bodyPlaceholder: "예: 오랜 친구와 새벽 기차역에서 재회하는 장면을 담담한 문체로 써 주세요.",
  },
};

export const COMMISSION_EXPIRE_DAYS = 7;
