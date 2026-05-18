/* ==============================
   찰떡메모 - 메인 애플리케이션 로직
   ============================== */

// ── 구글 Gemini API 설정 ───────────────────────────
// 대표님 본인의 Gemini API 키를 아래에 적어두시면 진짜 AI 교정이 완벽 작동합니다!
// 빈 값일 경우, 똑똑한 규칙 기반 자체 교정기로 부드럽게 백업 구동됩니다.
const GEMINI_API_KEY = "AIzaSyAEJAC1YoZ9aJb7kVDm8HG5fMrCfrhNNlw"; 

// ── 전역 상태 ───────────────────────────────────────
const STATE = {
  fontSize: 18,            // 기본 글자 크기 (px)
  darkMode: false,
  memos: [],               // 오늘 메모 배열
  archive: {},             // { 'YYYY-MM-DD': [...] }
  starredIds: new Set(),   // 별표 메모 id 집합
  currentShareMemo: null,  // 공유 중인 메모 객체
  editingMemoId: null,     // 현재 수정 중인 메모 ID (추가!)
  isRecording: false,
  recognition: null,
  voiceRaw: '',
  voiceRefined: '',
  searchQuery: '',         // 실시간 검색어 (대표님 승인 A안)
  categoryFilter: 'all',   // 카테고리 필터 (대표님 승인 C안)
};

const TODAY_KEY = getTodayKey();

// ── 날짜 유틸 ─────────────────────────────────────
function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateLabel(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m-1, d);
  const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayName = DAYS[date.getDay()];
  // 글로벌 포맷: 한국어 환경 기준 (i18n 확장 가능)
  return `${y}년 ${m}월 ${d}일 (${dayName})`;
}

function formatTodayFull() {
  const d = new Date();
  const DAYS = ['일','월','화','수','목','금','토'];
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${DAYS[d.getDay()]})`;
}

// 🌤️ Open-Meteo 무료 실시간 날씨 API 연동 (키 불필요, 위치 기반)
async function fetchWeather() {
  if (!weatherIcon) return;

  // WMO 날씨 코드 → 이모지 매핑표
  function wmoToEmoji(code) {
    if (code === 0)               return '☀️';   // 맑음
    if (code <= 2)                return '🌤️';  // 약간 흐림
    if (code === 3)               return '☁️';  // 흐림
    if (code >= 45 && code <= 48) return '🌫️'; // 안개
    if (code >= 51 && code <= 57) return '🌦️'; // 이슬비
    if (code >= 61 && code <= 67) return '🌧️'; // 비
    if (code >= 71 && code <= 77) return '🌨️'; // 눈
    if (code >= 80 && code <= 82) return '🌦️'; // 소나기
    if (code >= 85 && code <= 86) return '❄️';  // 폭설
    if (code >= 95)               return '⛈️';  // 뇌우
    return '🌡️';
  }

  try {
    // 1단계: 위치 정보 획득
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
    );
    const { latitude: lat, longitude: lon } = pos.coords;

    // 2단계: Open-Meteo API 호출 (무료, 키 없음)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code&timezone=auto`;
    const res  = await fetch(url);
    const data = await res.json();
    const code = data.current?.weather_code ?? 0;

    const emoji = wmoToEmoji(code);
    weatherIcon.textContent = emoji;
    weatherIcon.title = `현재 날씨 (위도 ${lat.toFixed(1)}, 경도 ${lon.toFixed(1)})`;

  } catch (e) {
    // 위치 거부 or 오류 시 → 서울 기본값으로 조용히 폴백
    console.warn('날씨 API 폴백:', e.message);
    try {
      const res  = await fetch('https://api.open-meteo.com/v1/forecast?latitude=37.57&longitude=126.98&current=weather_code&timezone=Asia/Seoul');
      const data = await res.json();
      const code = data.current?.weather_code ?? 0;
      weatherIcon.textContent = wmoToEmoji(code);
    } catch (_) {
      weatherIcon.textContent = '🌤️'; // 최후 폴백
    }
  }
}

function formatTime() {
  const d = new Date();
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2,'0');
  const ampm = h < 12 ? '오전' : '오후';
  const hour12 = h % 12 || 12;
  return `${ampm} ${hour12}:${m}`;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2,6);
}

// ── localStorage 연동 ──────────────────────────────
function saveAll() {
  localStorage.setItem('vn_memos_' + TODAY_KEY, JSON.stringify(STATE.memos));
  localStorage.setItem('vn_archive', JSON.stringify(STATE.archive));
  localStorage.setItem('vn_starred', JSON.stringify([...STATE.starredIds]));
  localStorage.setItem('vn_fontSize', STATE.fontSize);
  localStorage.setItem('vn_dark', STATE.darkMode ? '1' : '0');
}

function loadAll() {
  // 모의 데이터 주입 (최초 실행 시 대표님이 스크롤 효과를 즉시 체감하실 수 있도록 배려)
  if (!localStorage.getItem('vn_installed')) {
    const d = new Date();
    
    // 1. 오늘 예시 데이터
    const todayMemo = [
      { id: 'm-today-1', text: '기억노트 개발 기획 회의 완료! 날짜별 메모장이 세로로 끊김 없이 쭉~ 연결되는 무한 롤 UI가 적용되었다. 진짜 편리하네!', time: '오전 11:05', isVoice: false, dateKey: TODAY_KEY }
    ];
    
    // 2. 어제(Today - 1) 및 그저께(Today - 2) 예시 데이터
    const getPastDateKey = (daysAgo) => {
      const past = new Date(d.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      return `${past.getFullYear()}-${String(past.getMonth()+1).padStart(2,'0')}-${String(past.getDate()).padStart(2,'0')}`;
    };
    
    const yesterdayKey = getPastDateKey(1);
    const dayBeforeYesterdayKey = getPastDateKey(2);
    
    const mockArchive = {
      [yesterdayKey]: [
        { id: 'm-yesterday-1', text: '자녀 용돈 송금용 계좌번호:\n신한은행 110-123-456789 (홍길동)', time: '오후 04:30', isVoice: false, dateKey: yesterdayKey },
        { id: 'm-yesterday-2', text: '마트 장볼 거리 리스트:\n- 우유 2팩\n- 계란 1판\n- 두부 2모', time: '오전 10:15', isVoice: true, dateKey: yesterdayKey }
      ],
      [dayBeforeYesterdayKey]: [
        { id: 'm-past-1', text: '초등학교 동창회 모임 장소:\n서초동 옛날 숯불갈비 저녁 7시 예약 완료', time: '오후 07:15', isVoice: false, dateKey: dayBeforeYesterdayKey }
      ]
    };
    
    localStorage.setItem('vn_memos_' + TODAY_KEY, JSON.stringify(todayMemo));
    localStorage.setItem('vn_archive', JSON.stringify(mockArchive));
    localStorage.setItem('vn_starred', JSON.stringify(['m-yesterday-1'])); // 계좌번호에 별표 미리 쳐두기!
    localStorage.setItem('vn_installed', 'true');
  }

  const memos = localStorage.getItem('vn_memos_' + TODAY_KEY);
  STATE.memos = memos ? JSON.parse(memos) : [];

  const archive = localStorage.getItem('vn_archive');
  STATE.archive = archive ? JSON.parse(archive) : {};

  const starred = localStorage.getItem('vn_starred');
  STATE.starredIds = starred ? new Set(JSON.parse(starred)) : new Set();

  const fs = localStorage.getItem('vn_fontSize');
  STATE.fontSize = fs ? parseInt(fs) : 18;

  STATE.darkMode = localStorage.getItem('vn_dark') === '1';
}

// ── DOM 참조 ──────────────────────────────────────
const $ = (sel) => document.querySelector(sel);

const memoList       = $('#memo-list');
const dailyDate      = $('#daily-date-display');
const weatherIcon    = $('#weather-icon');
const saveText       = $('#save-text');
const saveDot        = $('#save-dot');

const tabBtns        = document.querySelectorAll('.tab-btn');
const tabViews       = document.querySelectorAll('.tab-view');

const modalInput     = $('#modal-input');
const memoTextarea   = $('#memo-textarea');
const modalVoice     = $('#modal-voice');
const modalShare     = $('#modal-share');
const overlay        = $('#overlay');

const voiceWave      = $('#voice-wave');
const voiceHint      = $('#voice-hint');
const voiceBox       = $('#voice-transcript-box');
const voiceRawEl     = $('#voice-raw');
const voiceRefinedEl = $('#voice-refined');
const btnSaveVoice   = $('#btn-save-voice');
const btnStartVoice  = $('#btn-start-voice');

const starList       = $('#star-list');
const starEmpty      = $('#star-empty');
const archiveList    = $('#archive-list');
const archiveEmpty   = $('#archive-empty');

const sharePreview   = $('#share-preview');

const inputSearch    = $('#input-search');
const btnClearSearch = $('#btn-clear-search');

// ── 🔍 자동 카테고리 태그 분류 (대표님 승인 C안) ─────────────────
function getMemoCategory(text) {
  const normalized = text.toLowerCase();
  
  // 1. 금융/돈
  const financeKeywords = ['계좌', '신한', '은행', '송금', '돈', '가격', '원', '페이', '입금', '출금', '수수료', '주식', '카드', '월세', '용돈'];
  if (financeKeywords.some(keyword => normalized.includes(keyword))) {
    return 'finance';
  }
  
  // 2. 약속/모임
  const meetingKeywords = ['친구', '동창', '모임', '약속', '시', '갈비', '만나', '예약', '방문', '동호회', '식사', '회의', '가족', '식구', '식당'];
  if (meetingKeywords.some(keyword => normalized.includes(keyword))) {
    return 'meeting';
  }
  
  // 3. 장보기/할일
  const shoppingKeywords = ['마트', '마켓', '장볼', '우유', '계란', '두부', '장보기', '쇼핑', '리스트', '사야', '할일', '할 일', '청소', '세차'];
  if (shoppingKeywords.some(keyword => normalized.includes(keyword))) {
    return 'shopping';
  }
  
  // 4. 일상/기록 (기타 및 일상)
  return 'diary';
}

// ── ✍️ 형광펜 검색어 하이라이트 유틸 (대표님 승인 A안) ───────────
function highlightAndEscape(text, query) {
  const escaped = escapeHtml(text);
  if (!query || query.trim() === '') return escaped;
  
  // 특수문자 이스케이프 및 정규식 생성
  const safeQuery = escapeHtml(query).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${safeQuery})`, 'gi');
  // mark 태그로 네온 형광펜 입히기
  return escaped.replace(regex, '<mark class="highlight">$1</mark>');
}

// ── 🛡️ 필터링 매칭 규칙 ──────────────────────────────────────────
function shouldShowMemo(memo) {
  // 1. 카테고리 필터링
  if (STATE.categoryFilter !== 'all') {
    const category = getMemoCategory(memo.text);
    if (category !== STATE.categoryFilter) return false;
  }
  
  // 2. 검색어 필터링
  if (STATE.searchQuery.trim() !== '') {
    const query = STATE.searchQuery.toLowerCase();
    if (!memo.text.toLowerCase().includes(query)) return false;
  }
  
  return true;
}

// ── 초기화 ────────────────────────────────────────
function init() {
  loadAll();
  applyFontSize();
  applyTheme();
  dailyDate.textContent = formatTodayFull();
  renderTimeline();
  renderStars();
  bindEvents();
  fetchWeather(); // 🌤️ 실시간 날씨 아이콘 비동기 로드
}

// ── 글자 크기 ──────────────────────────────────────
function applyFontSize() {
  document.documentElement.style.fontSize = STATE.fontSize + 'px';
}

$('#btn-font-increase').addEventListener('click', () => {
  if (STATE.fontSize >= 26) return;
  STATE.fontSize += 2;
  applyFontSize();
  saveAll();
  showToast('글자가 커졌어요 😊');
});

$('#btn-font-decrease').addEventListener('click', () => {
  if (STATE.fontSize <= 14) return;
  STATE.fontSize -= 2;
  applyFontSize();
  saveAll();
  showToast('글자가 작아졌어요');
});

// ── 테마 토글 ─────────────────────────────────────
function applyTheme() {
  document.body.classList.toggle('dark-mode', STATE.darkMode);
  $('#btn-toggle-theme').textContent = STATE.darkMode ? '☀️' : '🌙';
}

$('#btn-toggle-theme').addEventListener('click', () => {
  STATE.darkMode = !STATE.darkMode;
  applyTheme();
  saveAll();
});

// ── 탭 전환 ───────────────────────────────────────
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabViews.forEach(v => v.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('view-' + btn.dataset.tab).classList.add('active');
  });
});

// ── 메모 추가 ─────────────────────────────────────
function addMemo(text, isVoice = false) {
  if (!text.trim()) return;
  const memo = {
    id: generateId(),
    text: text.trim(),
    time: formatTime(),
    isVoice,
    dateKey: TODAY_KEY,
  };
  STATE.memos.push(memo);
  saveAll();
  renderTimeline();
  blinkSave();
}

// ── 무한 롤 타임라인 통합 렌더링 (대표님 제안 핵심 UX) ────────────────
function renderTimeline() {
  const isSearchingOrFiltering = STATE.searchQuery.trim() !== '' || STATE.categoryFilter !== 'all';

  // 1. 오늘 메모 렌더링 (최신이 상단에 배치되거나 아래로 쭉 쌓이게 설정 - 아날로그 롤 감성)
  memoList.innerHTML = '';
  const filteredTodayMemos = STATE.memos.filter(shouldShowMemo);

  if (filteredTodayMemos.length === 0) {
    memoList.innerHTML = `
      <div class="empty-hint" style="padding: 20px 0;">
        <p>${isSearchingOrFiltering ? '🔍 일치하는 기억이 없습니다.' : '✍️ 오늘 끄적이고 싶은 생각을 아래 버튼을 눌러 적어보세요.<br/>말로 해도 되고, 글씨로 적어도 됩니다.'}</p>
      </div>`;
  } else {
    filteredTodayMemos.forEach(memo => {
      memoList.appendChild(createMemoCard(memo));
    });
  }

  // 2. 지난 과거의 메모장들을 아래로 끊김 없이 무한 롤 형태로 렌더링
  const pastTimelineSection = $('#past-timeline-section');
  pastTimelineSection.innerHTML = '';

  const archiveKeys = Object.keys(STATE.archive).sort().reverse(); // 최근 날짜가 위로 나오게 역순 정렬
  let renderedPastCount = 0;

  if (archiveKeys.length > 0) {
    archiveKeys.forEach(dateKey => {
      const memos = STATE.archive[dateKey];
      if (!memos || memos.length === 0) return;

      const filteredMemos = memos.filter(shouldShowMemo);
      if (filteredMemos.length === 0) return; // 필터링되어 남은 메모가 없으면 해당 날짜 자체를 생략
      renderedPastCount++;

      // 과거 날짜 섹션 생성 (무한 롤로 이어짐)
      const section = document.createElement('div');
      section.className = 'timeline-date-section past-day';
      
      const stickyHeader = document.createElement('div');
      stickyHeader.className = 'sticky-date-header';
      stickyHeader.textContent = formatDateLabel(dateKey);
      section.appendChild(stickyHeader);

      const cardList = document.createElement('div');
      cardList.className = 'past-memo-list';
      cardList.style.display = 'flex';
      cardList.style.flexDirection = 'column';
      cardList.style.gap = '12px';

      filteredMemos.forEach(memo => {
        cardList.appendChild(createMemoCard({ ...memo, dateKey }));
      });

      section.appendChild(cardList);
      pastTimelineSection.appendChild(section);
    });
  }

  // 과거 타임라인에 렌더링된 카드가 없고 전체에서도 아무것도 안 나왔으며, 필터 중일 때
  if (renderedPastCount === 0 && filteredTodayMemos.length === 0 && isSearchingOrFiltering) {
    pastTimelineSection.innerHTML = `
      <div class="empty-hint" style="padding: 40px 0; border-top: 1.5px dashed var(--color-border); margin-top: 20px;">
        <p>🔍 과거 기록에서도 일치하는 검색 결과가 없습니다.</p>
      </div>`;
  } else if (renderedPastCount === 0 && !isSearchingOrFiltering) {
    pastTimelineSection.innerHTML = `
      <div class="empty-hint" style="padding: 40px 0; border-top: 1.5px dashed var(--color-border); margin-top: 20px;">
        <p>📅 아직 보관된 과거의 메모장이 없습니다.<br/>하루가 지나면 여기에 자동으로 타임라인이 이어집니다.</p>
      </div>`;
  }
}

function createMemoCard(memo) {
  const card = document.createElement('div');
  card.className = 'memo-card';
  card.dataset.id = memo.id;

  const isStarred = STATE.starredIds.has(memo.id);

  card.innerHTML = `
    ${memo.isVoice ? '<span class="memo-voice-badge">🎙️ AI 음성 교정</span>' : ''}
    <div class="memo-card-top">
      <span class="memo-time">${memo.time}</span>
      <div class="memo-card-actions">
        <button class="btn-star ${isStarred ? 'active' : ''}" data-id="${memo.id}" title="별표 즐겨찾기" aria-label="즐겨찾기 토글">⭐</button>
        <button class="btn-edit-card" data-id="${memo.id}" aria-label="수정하기">✏️ 수정</button>
        <button class="btn-share-card" data-id="${memo.id}" aria-label="공유하기">📤 공유</button>
      </div>
    </div>
    <p class="memo-text">${highlightAndEscape(memo.text, STATE.searchQuery)}</p>
  `;

  card.querySelector('.btn-star').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleStar(memo.id);
  });
  card.querySelector('.btn-edit-card').addEventListener('click', (e) => {
    e.stopPropagation();
    openEditModal(memo);
  });
  card.querySelector('.btn-share-card').addEventListener('click', (e) => {
    e.stopPropagation();
    openShare(memo);
  });

  return card;
}

// ── 메모 수정 모달 열기 ──────────────────────────────
function openEditModal(memo) {
  STATE.editingMemoId = memo.id;
  $('#modal-input-title').textContent = '✏️ 메모 수정';
  $('#btn-submit-memo').textContent = '💾 수정 완료';
  memoTextarea.value = memo.text;
  openModal(modalInput);
  setTimeout(() => memoTextarea.focus(), 100);
}

// ── 별표 ──────────────────────────────────────────
function toggleStar(id) {
  if (STATE.starredIds.has(id)) {
    STATE.starredIds.delete(id);
    showToast('별표를 해제했어요');
  } else {
    STATE.starredIds.add(id);
    showToast('⭐ 별표 장부에 보관했어요!');
  }
  saveAll();
  renderTimeline();
  renderStars();
}

function renderStars() {
  starList.innerHTML = '';
  const allMemos = getAllMemos();
  
  // 별표 보관함에도 검색 및 카테고리가 실시간으로 연동되도록 구현
  const starred = allMemos.filter(m => STATE.starredIds.has(m.id)).filter(shouldShowMemo);

  starEmpty.style.display = starred.length === 0 ? 'flex' : 'none';

  const isSearchingOrFiltering = STATE.searchQuery.trim() !== '' || STATE.categoryFilter !== 'all';
  if (starred.length === 0 && isSearchingOrFiltering) {
    starEmpty.querySelector('p').textContent = '🔍 일치하는 별표 기억이 없습니다.';
  } else if (starred.length === 0) {
    starEmpty.querySelector('p').innerHTML = '중요한 생각은 메모 카드의 별표(⭐)를 눌러주세요.<br>이곳 별표 장부에 평생 소중하게 보관됩니다.';
  }

  starred.forEach(memo => {
    const card = document.createElement('div');
    card.className = 'star-card';
    card.style.borderLeft = '6px solid var(--color-star)'; /* 아날로그 중요 책갈피 강조 */
    
    card.innerHTML = `
      <div class="star-card-top">
        <span class="star-card-date">${formatDateLabel(memo.dateKey)} ${memo.time}</span>
        <button class="btn-edit-star-card" data-id="${memo.id}" aria-label="수정하기">✏️ 수정</button>
      </div>
      <p class="star-card-text">${highlightAndEscape(memo.text, STATE.searchQuery)}</p>
    `;

    card.querySelector('.btn-edit-star-card').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(memo);
    });

    starList.appendChild(card);
  });
}

function getAllMemos() {
  const todayMemos = STATE.memos.map(m => ({ ...m, dateKey: TODAY_KEY }));
  const archiveMemos = Object.entries(STATE.archive)
    .flatMap(([dateKey, memos]) => memos.map(m => ({ ...m, dateKey })));
  return [...todayMemos, ...archiveMemos];
}

// ── 보관함 렌더링 ─────────────────────────────────
function renderArchive() {
  archiveList.innerHTML = '';
  const keys = Object.keys(STATE.archive).sort().reverse();

  archiveEmpty.style.display = keys.length === 0 ? 'flex' : 'none';

  keys.forEach(dateKey => {
    const memos = STATE.archive[dateKey];
    if (!memos || memos.length === 0) return;

    const group = document.createElement('div');
    group.className = 'archive-date-group';
    group.innerHTML = `
      <div class="archive-date-header">
        <span class="archive-date-title">📅 ${formatDateLabel(dateKey)}</span>
        <span class="archive-toggle-icon">▼</span>
      </div>
      <div class="archive-date-body"></div>
    `;

    const body = group.querySelector('.archive-date-body');
    memos.forEach(memo => body.appendChild(createMemoCard(memo, true)));

    group.querySelector('.archive-date-header').addEventListener('click', () => {
      group.classList.toggle('collapsed');
    });

    archiveList.appendChild(group);
  });
}

// ── 자동 보관 (밤 12시 지난 메모) ─────────────────
function checkAndArchivePrevious() {
  const keys = Object.keys(localStorage)
    .filter(k => k.startsWith('vn_memos_') && !k.endsWith(TODAY_KEY));

  keys.forEach(k => {
    const dateKey = k.replace('vn_memos_', '');
    const data = localStorage.getItem(k);
    if (data) {
      const memos = JSON.parse(data);
      if (memos.length > 0) {
        STATE.archive[dateKey] = memos;
      }
      localStorage.removeItem(k);
    }
  });
  saveAll();
}

// ── 공유 모달 ─────────────────────────────────────
function openShare(memo) {
  STATE.currentShareMemo = memo;
  sharePreview.textContent = memo.text;
  openModal(modalShare);
}

$('#btn-copy-text').addEventListener('click', () => {
  if (!STATE.currentShareMemo) return;
  navigator.clipboard.writeText(STATE.currentShareMemo.text).then(() => {
    showToast('📋 글이 복사되었어요!');
  }).catch(() => {
    // 폴백: execCommand
    const ta = document.createElement('textarea');
    ta.value = STATE.currentShareMemo.text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('📋 글이 복사되었어요!');
  });
});

$('#btn-share-kakao').addEventListener('click', () => {
  if (!STATE.currentShareMemo) return;
  const text = encodeURIComponent(STATE.currentShareMemo.text);
  // 카카오톡 공유 딥링크 (앱 설치 시 카카오톡으로 전환)
  window.open(`kakaotalk://send?text=${text}`, '_blank');
  showToast('카카오톡을 열고 있어요...');
});

$('#btn-share-whatsapp').addEventListener('click', () => {
  if (!STATE.currentShareMemo) return;
  const text = encodeURIComponent(STATE.currentShareMemo.text);
  window.open(`https://wa.me/?text=${text}`, '_blank');
});

$('#btn-close-share, #share-close').forEach = Array.prototype.forEach;
['btn-close-share', 'share-close'].forEach(id => {
  $(` #${id}`)?.addEventListener('click', closeAllModals);
});
$('#share-close').addEventListener('click', closeAllModals);
$('#btn-close-share').addEventListener('click', closeAllModals);

// ── 텍스트 입력 모달 ──────────────────────────────
$('#btn-add-text').addEventListener('click', () => {
  STATE.editingMemoId = null;
  $('#modal-input-title').textContent = '✏️ 메모 입력';
  $('#btn-submit-memo').textContent = '저장하기';
  memoTextarea.value = '';
  openModal(modalInput);
  setTimeout(() => memoTextarea.focus(), 100);
});

$('#btn-submit-memo').addEventListener('click', () => {
  const text = memoTextarea.value;
  if (!text.trim()) {
    showToast('메모 내용을 입력해 주세요.');
    return;
  }

  // 1. 메모 수정 모드인 경우 데이터 덮어쓰기
  if (STATE.editingMemoId) {
    let updated = false;

    // A. 오늘 메모 검색 및 수정
    const todayIndex = STATE.memos.findIndex(m => m.id === STATE.editingMemoId);
    if (todayIndex !== -1) {
      STATE.memos[todayIndex].text = text.trim();
      updated = true;
    }

    // B. 과거 보관 메모 검색 및 수정 (동일 ID 매칭)
    if (!updated) {
      for (const dateKey in STATE.archive) {
        const archiveIndex = STATE.archive[dateKey].findIndex(m => m.id === STATE.editingMemoId);
        if (archiveIndex !== -1) {
          STATE.archive[dateKey][archiveIndex].text = text.trim();
          updated = true;
          break;
        }
      }
    }

    if (updated) {
      saveAll();
      renderTimeline();
      renderStars();
      showToast('메모를 수정했어요 ✍️');
    }
    STATE.editingMemoId = null; // 수정 완료 후 ID 초기화
  } else {
    // 2. 새 메모 추가 모드
    addMemo(text, false);
  }

  closeAllModals();
});

$('#btn-cancel-memo, #modal-close').forEach = null;
$('#modal-close').addEventListener('click', closeAllModals);
$('#btn-cancel-memo').addEventListener('click', closeAllModals);

memoTextarea.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    $('#btn-submit-memo').click();
  }
});

// ── 음성 메모 ─────────────────────────────────────
$('#btn-voice').addEventListener('click', () => {
  // 상태 초기화
  voiceRawEl.textContent = '';
  voiceRefinedEl.textContent = '';
  voiceBox.classList.remove('visible');
  voiceHint.textContent = '🔴 마이크 버튼을 눌러 말씀하세요';
  voiceWave.classList.remove('recording');
  btnStartVoice.textContent = '🔴 녹음 시작';
  btnStartVoice.classList.remove('hidden');
  btnSaveVoice.classList.add('hidden');
  STATE.voiceRaw = '';
  STATE.voiceRefined = '';
  openModal(modalVoice);
});

$('#voice-close').addEventListener('click', () => {
  stopRecognition();
  closeAllModals();
});
$('#btn-cancel-voice').addEventListener('click', () => {
  stopRecognition();
  closeAllModals();
});

btnStartVoice.addEventListener('click', () => {
  if (STATE.isRecording) {
    stopRecognition();
  } else {
    startRecognition();
  }
});

btnSaveVoice.addEventListener('click', () => {
  const text = STATE.voiceRefined || STATE.voiceRaw;
  if (!text.trim()) { showToast('저장할 내용이 없어요.'); return; }
  addMemo(text, true);
  closeAllModals();
});

function startRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('이 브라우저는 음성 인식을 지원하지 않아요. Chrome을 사용해 주세요.');
    return;
  }

  STATE.recognition = new SpeechRecognition();
  STATE.recognition.lang = 'ko-KR';
  STATE.recognition.interimResults = true;
  STATE.recognition.continuous = true;

  STATE.isRecording = true;
  voiceWave.classList.add('recording');
  voiceHint.textContent = '🎙️ 말씀하세요... (편하게 이야기하세요)';
  btnStartVoice.textContent = '⏹ 녹음 중지';
  btnSaveVoice.classList.add('hidden');

  let finalTranscript = '';

  STATE.recognition.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) {
        finalTranscript += e.results[i][0].transcript;
      } else {
        interim += e.results[i][0].transcript;
      }
    }
    const display = finalTranscript + interim;
    voiceRawEl.textContent = display;
    voiceBox.classList.add('visible');
    STATE.voiceRaw = display;
  };

  STATE.recognition.onerror = (e) => {
    showToast('음성 인식 오류: ' + e.error);
    stopRecognition();
  };

  STATE.recognition.onend = () => {
    if (STATE.isRecording) {
      // 자동 종료 시 AI 교정 시뮬레이션
      stopRecognition(true);
    }
  };

  STATE.recognition.start();
}

function stopRecognition(auto = false) {
  STATE.isRecording = false;
  voiceWave.classList.remove('recording');
  btnStartVoice.textContent = '🔴 다시 녹음';

  if (STATE.recognition) {
    try { STATE.recognition.stop(); } catch(_) {}
    STATE.recognition = null;
  }

  if (STATE.voiceRaw.trim()) {
    refineWithAI(STATE.voiceRaw);
  }
}

// 🤖 구글 Gemini API 연동 AI 기억 교정 엔진 (대표님 승인 A안 핵심!)
async function refineWithAI(rawText) {
  // 1. 음성 웨이브 및 로딩 상태 UI 적용 (딜레이 불안감 해소)
  const voiceWave = document.getElementById('voice-wave');
  if (voiceWave) voiceWave.classList.add('processing');
  
  voiceRefinedEl.innerHTML = '<div class="typing-dots"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';
  voiceBox.classList.add('visible');

  // 사용자 지루함 완화를 위한 롤링 메시지 간격 설정
  const hintMessages = [
    '🤖 AI 기억이가 문맥을 짚어보고 있어요...',
    '✍️ 발음 오류와 맞춤법을 말끔하게 가다듬는 중...',
    '✨ 다듬어진 생각 문장을 이쁘게 조립하고 있어요...',
    '⏰ 거의 다 되었습니다! 조금만 더 기다려 주세요...'
  ];
  let messageIndex = 0;
  voiceHint.textContent = hintMessages[0];
  const hintInterval = setInterval(() => {
    messageIndex = (messageIndex + 1) % hintMessages.length;
    voiceHint.textContent = hintMessages[messageIndex];
  }, 2500);

  function cleanupRefinement() {
    clearInterval(hintInterval);
    if (voiceWave) voiceWave.classList.remove('processing');
  }

  // 1. 대표님 API Key가 입력되지 않았거나 비어있는 경우 -> 규칙 기반 로컬 폴백 작동
  if (!GEMINI_API_KEY || GEMINI_API_KEY === "대표님의_키_입력") {
    cleanupRefinement();
    runFallbackRefinement(rawText, "API 키가 등록되지 않아 로컬 교정기가 작동했어요 😊");
    return;
  }

  const prompt = `너는 오타, 뭉개진 발음, 중언부언, 사투리가 섞인 중장년층의 한국어 말소리를 자연스럽고 품격 있는 표준 메모 문장으로 다듬는 40대 이상 타겟의 메모장 정리 비서 '기억이'야. 아래 텍스트는 사용자가 음성 인식으로 편하게 흘려 적은 내용이다. 이 내용을 1. 불필요한 추임새 제거, 2. 문맥상 오타 및 맞춤법 교정, 3. 표준어 순화를 거쳐 친근하면서도 정갈한 한글 문장으로 교정해줘. 부가 설명이나 서론, 결론, 따옴표 없이 오직 교정된 최종 결과 문장만 단 한 줄로 출력해야 해.\n\n사용자 음성 입력: "${rawText}"`;

  // 2. 진짜 구글 Gemini API 비동기 호출 (2.5 Flash 최우선 호출 -> 1.5 Flash 2중 모델 자동 폴백!)
  try {
    let refinedText = "";
    try {
      refinedText = await callGeminiAPI("gemini-2.5-flash", prompt);
    } catch (e1) {
      console.warn("Gemini 2.5 Flash 통신 실패, 1.5 Flash 모델로 2차 시도합니다...", e1);
      try {
        refinedText = await callGeminiAPI("gemini-1.5-flash", prompt);
      } catch (e2) {
        throw new Error("모든 Gemini 모델 호출 실패");
      }
    }

    cleanupRefinement();

    if (refinedText) {
      voiceRefinedEl.textContent = refinedText;
      STATE.voiceRefined = refinedText;
      voiceHint.textContent = '✅ AI 기억 교정이 완료되었어요!';
      btnSaveVoice.classList.remove('hidden');
    } else {
      throw new Error('Gemini API 응답 결과가 비어있습니다.');
    }

  } catch (error) {
    cleanupRefinement();
    console.error('Gemini API 최종 연동 실패 오류:', error);
    runFallbackRefinement(rawText, `⚠️ AI 연결 불안정으로 로컬 교정기가 보완했어요`);
  }
}

// 🌐 Gemini API 다이렉트 호출 헬퍼 비동기 함수
async function callGeminiAPI(modelName, promptText) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: promptText }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`API ${modelName} 호출 실패 (Status: ${response.status})`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

// 🛡️ 비상 상황용 로컬 보조 교정 엔진 (Fallback)
function runFallbackRefinement(rawText, message) {
  setTimeout(() => {
    let refined = rawText
      .replace(/\s+/g, ' ')
      .replace(/^(아|어|음|그|뭐|저|근데|그래서|어그게)\s*/gi, '')
      .replace(/\s*(아|어|음|그|뭐|저)\s*$/gi, '')
      .trim();

    if (refined && !refined.match(/[.!?。！？]$/)) {
      refined += '.';
    }

    voiceRefinedEl.textContent = refined;
    STATE.voiceRefined = refined;
    voiceHint.textContent = message;
    btnSaveVoice.classList.remove('hidden');

    const voiceWave = document.getElementById('voice-wave');
    if (voiceWave) voiceWave.classList.remove('processing');
  }, 1000);
}

// ── 모달 유틸 ─────────────────────────────────────
function openModal(modal) {
  closeAllModals();
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
}

function closeAllModals() {
  [modalInput, modalVoice, modalShare].forEach(m => m.classList.add('hidden'));
  overlay.classList.add('hidden');
}

overlay.addEventListener('click', closeAllModals);

// ── 저장 인디케이터 ───────────────────────────────
function blinkSave() {
  saveText.textContent = '저장 중...';
  saveDot.style.color = '#c07d3a';
  setTimeout(() => {
    saveText.textContent = '백업 완료';
    saveDot.style.color = '';
  }, 600);
}

// ── 토스트 메시지 ─────────────────────────────────
let toastEl = null;
let toastTimer = null;

function showToast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.id = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2200);
}

// ── 이벤트 바인딩 ─────────────────────────────────
function bindEvents() {
  // 실시간 검색창 입력 핸들링 (대표님 승인 A안)
  if (inputSearch) {
    inputSearch.addEventListener('input', (e) => {
      STATE.searchQuery = e.target.value;
      if (STATE.searchQuery.trim() !== '') {
        btnClearSearch.classList.remove('hidden');
      } else {
        btnClearSearch.classList.add('hidden');
      }
      renderTimeline();
      renderStars();
    });
  }

  // 검색 지우기 버튼 핸들링
  if (btnClearSearch) {
    btnClearSearch.addEventListener('click', () => {
      inputSearch.value = '';
      STATE.searchQuery = '';
      btnClearSearch.classList.add('hidden');
      renderTimeline();
      renderStars();
    });
  }

  // 조약돌 카테고리 태그 단추 클릭 핸들링 (대표님 승인 C안)
  const categoryTagBtns = document.querySelectorAll('.category-tag-bar .tag-btn');
  categoryTagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryTagBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.categoryFilter = btn.dataset.category || 'all';
      renderTimeline();
      renderStars();
    });
  });
}

// ── 보조 ──────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

// ── 앱 시작 ───────────────────────────────────────
checkAndArchivePrevious();
init();

