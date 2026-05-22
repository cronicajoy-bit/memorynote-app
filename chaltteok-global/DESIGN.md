---
name: 찰떡메모 실버 에디션
version: 1.0.0
target: 실버세대 (60세 이상)
wcag: AA

colors:
  # 배경
  bg-page:        "#F7F5F0"   # 따뜻한 크림 화이트 - 눈 피로 최소화
  bg-card:        "#FFFFFF"
  bg-header:      "#FFFFFF"
  bg-input:       "#FFFFFF"

  # 주요 텍스트 - 고대비 (7:1 이상)
  text-primary:   "#1C1C1E"
  text-secondary: "#636366"
  text-hint:      "#8E8E93"

  # 액션 컬러 - 따뜻하고 신뢰감 있는 색
  accent:         "#E8622A"   # 따뜻한 주황 - 주요 CTA
  accent-soft:    "#FFF0E8"   # 액션 버튼 배경 (연한 버전)
  accent-dark:    "#C44E1F"   # hover/pressed 상태

  # 보조 컬러
  safe:           "#2E7D32"   # 완료/저장 - 안심을 주는 녹색
  safe-soft:      "#E8F5E9"
  danger:         "#C62828"   # 삭제/경고
  danger-soft:    "#FFEBEE"

  # 테두리/구분선 - 부드럽고 가볍게
  border:         "#E0DDD8"
  border-focus:   "#E8622A"
  divider:        "#F0EDE8"

  # 별표/즐겨찾기
  star:           "#F5A623"

typography:
  # 본문 - 실버세대 최소 기준 20px
  body:
    fontFamily:   "'Noto Sans KR', sans-serif"
    fontSize:     "1.25rem"    # 20px
    lineHeight:   "1.9"
    fontWeight:   "400"

  # 메모 본문 - 더 크게
  memo:
    fontFamily:   "'Noto Sans KR', sans-serif"
    fontSize:     "1.375rem"   # 22px
    lineHeight:   "2.0"
    fontWeight:   "400"

  # 헤딩
  h1:
    fontSize:     "1.75rem"    # 28px
    fontWeight:   "700"
    lineHeight:   "1.4"
  h2:
    fontSize:     "1.5rem"     # 24px
    fontWeight:   "700"
    lineHeight:   "1.4"
  h3:
    fontSize:     "1.25rem"    # 20px
    fontWeight:   "600"

  # 보조 텍스트 (날짜, 태그 등) - 최소 16px
  caption:
    fontSize:     "1rem"       # 16px
    fontWeight:   "500"

  # 버튼 텍스트
  button:
    fontSize:     "1.125rem"   # 18px
    fontWeight:   "600"

spacing:
  # 터치 타겟 - 실버세대 최소 56px (애플 HIG, Google 권장)
  touch-min:    "56px"
  touch-comfy:  "64px"

  xs:   "4px"
  sm:   "8px"
  md:   "16px"
  lg:   "24px"
  xl:   "32px"
  xxl:  "48px"

  # 카드/요소 내부 패딩
  card-padding:   "20px 24px"
  button-padding: "16px 24px"
  input-padding:  "16px 18px"

  # 요소 간 간격
  gap-card:     "14px"
  gap-section:  "24px"

rounded:
  none:   "0"
  sm:     "8px"
  md:     "14px"    # 부드럽고 친근한 느낌
  lg:     "20px"
  pill:   "100px"   # 태그, 뱃지

shadow:
  card:   "0 2px 12px rgba(0, 0, 0, 0.08)"
  modal:  "0 8px 40px rgba(0, 0, 0, 0.14)"
  button: "0 2px 8px rgba(232, 98, 42, 0.25)"

animation:
  duration: "0.2s"
  easing:   "ease-out"
  # 실버세대: 과도한 애니메이션 지양. 위치 이동 최소화.
---

## 찰떡메모 실버 에디션 — 디자인 원칙

실버세대(60세 이상)를 위한 메모 앱. 핵심 가치는 **단순함**, **명확함**, **신뢰감**이다.
브루탈리즘의 날카로운 테두리와 강렬한 그림자 대신, 부드럽고 따뜻한 느낌으로 전면 교체한다.

---

## 색상 (Colors)

### 배경
- **bg-page (#F7F5F0):** 순백색이 아닌 따뜻한 크림. 장시간 사용해도 눈 피로가 없다.
- **bg-card (#FFFFFF):** 카드는 흰색으로 배경과 자연스럽게 구분. 테두리 없이 그림자만으로 경계를 만든다.

### 텍스트
- **text-primary (#1C1C1E):** iOS/Apple 표준 다크 텍스트. 배경 대비 7:1 이상 확보.
- **text-secondary (#636366):** 날짜, 부가정보용. 4.5:1 이상 대비 유지.
- 본문에 회색 텍스트 남용 금지. 읽기 어려우면 실버세대는 그냥 포기한다.

### 액션 컬러
- **accent (#E8622A):** 따뜻한 주황. 차갑고 딱딱한 느낌 없이 행동을 유도한다.
  CTA 버튼(음성 메모, 저장)에만 사용. 남용 금지.
- 파란색 계열은 "링크"로 오인할 수 있어 버튼에 사용하지 않는다.

---

## 타이포그래피 (Typography)

### 핵심 규칙
- **최소 글자 크기는 16px (1rem).** 이것보다 작은 텍스트는 앱 어디에도 없어야 한다.
- **메모 본문은 22px (1.375rem).** 메모앱의 핵심 콘텐츠이므로 더 크게.
- **줄 간격은 1.9~2.0.** 한 줄짜리처럼 빽빽하게 보이지 않도록.
- 폰트 굵기는 Regular(400)와 Bold(700)만. 중간 굵기 난립 금지.

---

## 간격 & 터치 타겟 (Spacing & Touch Targets)

### 터치 타겟 절대 원칙
- **모든 탭 가능한 요소의 최소 높이/너비: 56px.**
- 편안한 사용성을 위한 권장값: 64px.
- 실버세대는 손 떨림이 있을 수 있다. 작은 버튼은 실패 경험을 만든다.
- 아이콘 버튼에는 반드시 텍스트 라벨을 함께 표시한다.

### 간격
- 카드와 카드 사이: 14px. 너무 촘촘하지 않게.
- 카드 내부 패딩: 20px 24px. 숨 쉬는 여백.
- 섹션 간 구분: 24px.

---

## 모서리 둥글기 (Border Radius)

- 브루탈리즘의 4px 딱딱한 각진 모서리 → **14px 부드러운 모서리**로 전환.
- 큰 모달이나 카드: 20px.
- 태그/뱃지: pill(100px) 스타일로 눌러볼 수 있음을 직관적으로 전달.

---

## 그림자 (Shadow)

- 브루탈리즘의 "2px 2px 0 #1A1A1A" 딱딱한 그림자 완전 제거.
- 자연스럽고 부드러운 drop shadow로 교체:
  - 카드: `0 2px 12px rgba(0,0,0,0.08)` — 살짝 떠있는 느낌.
  - 모달: `0 8px 40px rgba(0,0,0,0.14)` — 전면에 올라온 느낌.
- 테두리(border) 대신 그림자로 구분. 테두리는 focus 상태에서만 등장.

---

## 컴포넌트 가이드

### 버튼
- 높이 최소 56px, padding 16px 24px.
- 주요 CTA: accent 배경 + 흰색 텍스트 + 부드러운 그림자.
- 보조 버튼: 흰색 배경 + border(#E0DDD8) + text-primary 텍스트.
- 비활성화: opacity 0.4, cursor not-allowed. 비활성 이유를 텍스트로 설명.

### 입력 필드 (텍스트에어리어)
- padding: 16px 18px. 최소 높이 120px.
- border: 1.5px solid #E0DDD8 (평소), 2px solid accent (focus).
- border-radius: 14px.
- 글자 크기: 22px (메모 본문과 동일).
- placeholder는 text-hint 색상, 지나치게 길지 않게.

### 카드 (메모 카드)
- 흰색 배경 + shadow-card.
- border 없음. 그림자만으로 구분.
- border-radius: 14px.
- padding: 20px 24px.
- 카드 내 메모 텍스트 22px, 날짜/시간 16px.

### 탭 바
- 높이 56px 이상.
- 활성 탭: accent 색상 밑줄(3px) + text-primary 굵게.
- 비활성 탭: text-secondary.
- 탭 텍스트 18px.

### 하단 액션 바
- 높이 64px 이상의 버튼.
- 주요 버튼(음성 메모): accent 배경, 전체 너비의 60%.
- 보조 버튼(글쓰기 등): 흰색 배경, 나머지 너비.
- safe area inset bottom 반드시 적용.

### 날짜 구분선
- 브루탈리즘 스타일 황금 뱃지 → 심플한 날짜 텍스트 + 양옆 가는 선.
- 텍스트: 16px, text-secondary, 굵게.

---

## 접근성 원칙 (Accessibility)

1. **명암비**: 본문 텍스트 7:1 이상, 보조 텍스트 4.5:1 이상 (WCAG AA).
2. **터치 타겟**: 최소 56×56px. 타겟 간 최소 8px 여백.
3. **움직임**: 위치 이동 애니메이션 최소화. fade만 허용. prefers-reduced-motion 지원.
4. **포커스**: 키보드/보조기기 포커스 링 반드시 visible. accent 색상 outline.
5. **에러 표시**: 색상만으로 에러 표시 금지. 아이콘 + 텍스트 병행.
6. **빈 상태**: 텍스트로 친절하게 설명. "아직 메모가 없어요. 버튼을 눌러 첫 메모를 남겨보세요."

---

## 금지 사항 (Don'ts)

- ❌ 2px solid #1A1A1A 브루탈리즘 테두리
- ❌ "2px 2px 0 #1A1A1A" 딱딱한 offset shadow
- ❌ 16px 미만 텍스트
- ❌ 44px 미만 터치 타겟
- ❌ 아이콘 단독 버튼 (텍스트 라벨 없이)
- ❌ 현란한 위치 이동 애니메이션
- ❌ 너무 많은 정보를 한 화면에
- ❌ 중요하지 않은 곳에 accent 색상 남용
