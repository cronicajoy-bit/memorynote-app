# 찰떡메모 — TODO 목록

> 이 파일은 gstack /plan-eng-review에서 생성됨 (2026-05-22)
> 중요도별 정렬: 🔴 보안 → 🟡 성능

---

## 🔴 TODO #1 — Gemini API 키 보안 분리 (다음 스프린트)

**배경:**  
`MemoApp.tsx`에서 `process.env.NEXT_PUBLIC_GEMINI_API_KEY`를 클라이언트 번들에 노출 중.  
브라우저 DevTools > Network 탭에서 API 키 확인 가능 → 키 유출 위험.

**해결 방법:**  
1. `NEXT_PUBLIC_GEMINI_API_KEY` → `GEMINI_API_KEY` (서버 전용)로 환경변수 이름 변경  
2. `src/app/api/gemini/route.ts` API route 생성 — 서버에서 Gemini 호출, 결과만 클라이언트로 반환  
3. `MemoApp.tsx`의 `callGeminiAPI()` 함수를 `/api/gemini` 호출로 교체  
4. `.env.local`, Vercel 환경변수, Supabase Secret에서 키 이름 업데이트

**영향 범위:** `MemoApp.tsx` (callGeminiAPI 함수), `.env.local`, Vercel dashboard  
**이번 스프린트 제외 이유:** "오늘의 기억" Edge Function은 서버 전용 `GEMINI_API_KEY`를 올바르게 사용함. 기존 클라이언트 코드 변경은 별도 스프린트.

---

## 🟡 TODO #2 — DAU 100+ 시 배치 처리 업그레이드

**배경:**  
초기 Edge Function은 `for...of` 순차 처리. DAU가 늘면 150초 Edge Function 제한에 걸릴 수 있음.  
150초 ÷ 유저당 ~1.5초(Gemini+push) = 약 100명이 안전 한계.

**해결 방법:**  
```typescript
// 현재: 순차 처리
for (const user of users) { await processUser(user); }

// DAU 100+ 도달 시: Promise.allSettled 배치 처리로 교체
const BATCH_SIZE = 10;
for (let i = 0; i < users.length; i += BATCH_SIZE) {
  const batch = users.slice(i, i + BATCH_SIZE);
  await Promise.allSettled(batch.map(processUser));
}
```

**트리거:** DAU 100명 초과 시 (Supabase Analytics로 확인)  
**대안:** DAU 1,000+ 시 Supabase Queue 또는 pg_cron 병렬화 검토

---

*다음 리뷰: /plan-eng-review 또는 /review 실행*
