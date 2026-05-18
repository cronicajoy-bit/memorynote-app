# 찰떡메모 글로벌 상용화 버전 (Phase 2) 🍡🌍

이 프로젝트는 기존 HTML/JS MVP(최소 기능 제품) 버전을 **Next.js 기반의 글로벌 상용화 서비스**로 확장하기 위한 프로젝트입니다.

## 🚀 Phase 2 핵심 목표
1. **프레임워크 이식:** Next.js(App Router) 기반으로 기존 UI(Headway 브루탈리즘 스타일) 완벽 이식
2. **다국어 자동화 (i18n):** 한국어/영어/일본어 자동 감지 및 UI 변경, Gemini 프롬프트 국가별 분기
3. **스마트 소셜 공유:** 국가별 메신저 정렬(카카오톡 vs WhatsApp) 및 예쁜 미리보기(OG 썸네일) 기능
4. **회원가입 및 클라우드 동기화:** Supabase / Firebase 도입으로 전 세계 어디서나 내 메모 동기화
5. **글로벌 결제 연동:** 무료(Freemium) 음성 체험 기능 + Stripe/로컬 페이 연동

## 🛠️ 개발 스택
- 프레임워크: Next.js (App Router)
- 스타일링: Vanilla CSS / CSS Modules (브루탈리즘 디자인 적용)
- 백엔드/DB: Supabase (예정)
- 결제 모듈: Stripe / PortOne (예정)
- AI 엔진: Google Gemini API

## 실행 방법
```bash
npm run dev
```
