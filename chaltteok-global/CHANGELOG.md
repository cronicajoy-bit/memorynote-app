# CHANGELOG

All notable changes to 찰떡메모 are documented here.

## [0.2.0] — 2026-05-22

### Added

- **오늘의 기억** — 매일 저녁 9시(KST), Gemini AI가 그날 남긴 메모들을 2-3문장의 따뜻한 이야기로 요약해 푸시 알림으로 전달합니다. 홈 화면 상단에 접을 수 있는 카드로 표시됩니다.
- **`daily_summaries` 테이블** — 일일 요약을 Supabase에 저장. `UNIQUE(user_id, date)` 제약으로 하루 1요약 보장.
- **멀티 디바이스 푸시** — `push_subscriptions`에 `user_id` 인덱스를 추가해 유저의 모든 디바이스에 알림 전달.
- **무료 플랜 30회/월 한도** — 한도 도달 시 빈 알림 대신 "이번 달 요약 완료" 업그레이드 안내 카드 표시.
- **TODOS.md** — 엔지니어링 리뷰에서 식별된 다음 스프린트 TODO 목록 (Gemini 키 보안 분리, 배치 처리 업그레이드).

### Changed

- MemoApp.tsx: `DailySummaryCard` 컴포넌트를 홈 타임라인 탭 상단에 통합.

---

## [0.1.0] — (이전 릴리스)

초기 버전: 음성 메모, AI 교정, 실버세대 UX, 브루탈리스트→종이 테마 디자인, 구독/결제, 푸시 알림 시스템.
