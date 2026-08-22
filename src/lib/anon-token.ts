const STORAGE_KEY = "bs_board_anon_token";

// 비로그인 방문자를 구분하기 위한 토큰. 좋아요 중복 방지, 본인 글 이동/삭제 권한 확인에 쓰인다.
export function getAnonToken(): string {
  if (typeof window === "undefined") return "";

  let token = window.localStorage.getItem(STORAGE_KEY);
  if (!token) {
    token = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, token);
  }
  return token;
}
