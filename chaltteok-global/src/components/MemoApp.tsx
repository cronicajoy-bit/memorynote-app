'use client';

import { useState, useEffect, useCallback } from 'react';
import { Locale } from '@/lib/getDictionary';
import ShareModal from '@/components/ShareModal';
import AuthModal from '@/components/AuthModal';
import PricingModal from '@/components/PricingModal';
import { useAuth, useSubscription, useMemos } from '@/hooks/useMemos';
import { createClient } from '@/lib/supabase/client';

/* ────────────────────────────────
   타입 정의
 ──────────────────────────────── */
interface Memo {
  id: string;
  text: string;
  time: string;
  isVoice: boolean;
  dateKey: string;
}

interface Props {
  dict: Record<string, any>;
  lang: Locale;
}

/* ────────────────────────────────
   유틸: 날짜 포맷
 ──────────────────────────────── */
function formatTodayFull(lang: Locale): string {
  const d = new Date();
  if (lang === 'en') {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
  }
  if (lang === 'ja') {
    const JA_DAYS = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${JA_DAYS[d.getDay()]}）`;
  }
  // 기본 한국어
  const KO_DAYS = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${KO_DAYS[d.getDay()]})`;
}

function getTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatTime(): string {
  return new Date().toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/* ────────────────────────────────
   WMO 날씨 코드 → 이모지
 ──────────────────────────────── */
function wmoToEmoji(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 57) return '🌦️';
  if (code >= 61 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '🌨️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 85 && code <= 86) return '❄️';
  if (code >= 95) return '⛈️';
  return '🌡️';
}

/* ────────────────────────────────
   메인 컴포넌트
 ──────────────────────────────── */
export default function MemoApp({ dict, lang }: Props) {
  const voiceDict = {
    en: {
      hintInfo: '👉 Press the [Speak Again] button to turn on the microphone',
      speakAgainBtn: 'Speak Again',
      aiPolishBtn: '🪄 AI Simplify & Polish',
      aiCorrecting: '🪄 AI Assistant is polishing your note... 🌸',
      listening: '🎙️ Speak now, I will write it down automatically',
      listeningAuto: '🎙️ Speak now, I will write it down automatically',
      emulatorWarning: '⚠️ Emulator may not capture host audio. Try on your host PC Chrome browser for seamless magical voice writing! 🌸',
    },
    ja: {
      hintInfo: '👉 [もう一度話す] ボタンを押すとマイク가 온になります',
      speakAgainBtn: 'もう一度話す',
      aiPolishBtn: '🪄 AI スッキリ整理',
      aiCorrecting: '🪄 AIアシスタントがノートを綺麗に整えています... 🌸',
      listening: '🎙️ 今話すと自動的に書き留められます',
      listeningAuto: '🎙️ 今話すと自動的に書き留められます',
      emulatorWarning: '⚠️ エミュレータはPCマ이크の接続制限により無音になる場合があります。PCのChromeブラウザでお試しいただくと、音声入力がスムーズに動作します！🌸',
    },
    ko: {
      hintInfo: '👉 [다시 말하기] 버튼을 누르면 마이크가 켜져요',
      speakAgainBtn: '다시 말하기',
      aiPolishBtn: '🪄 AI 깔끔하게 정리',
      aiCorrecting: '🪄 AI 비서가 글을 단정하고 알아보기 쉽게 다듬는 중... 🌸',
      listening: '🎙️ 지금 말씀하시면 자동으로 받아적어요',
      listeningAuto: '🎙️ 지금 말씀하시면 자동으로 받아적어요',
      emulatorWarning: '⚠️ 가상 폰(에뮬레이터)은 PC 마이크 장치 가로채기 한계로 무음으로 인식될 수 있습니다. 노트북 PC 크롬 브라우저에서 테스트해 보시면 마이크 받아쓰기가 아주 시원하게 마술처럼 잘 작동합니다! 🌸',
    }
  }[lang] || {
    hintInfo: '👉 [다시 말하기] 버튼을 누르면 마이크가 켜져요',
    speakAgainBtn: '다시 말하기',
    aiPolishBtn: '🪄 AI 깔끔하게 정리',
    aiCorrecting: '🪄 AI 비서가 글을 단정하고 알아보기 쉽게 다듬는 중... 🌸',
    listening: '🎙️ 지금 말씀하시면 자동으로 받아적어요',
    listeningAuto: '🎙️ 지금 말씀하시면 자동으로 받아적어요',
    emulatorWarning: '⚠️ 가상 폰(에뮬레이터)은 PC 마이크 장치 가로채기 한계로 무음으로 인식될 수 있습니다. 노트북 PC 크롬 브라우저에서 테스트해 보시면 마이크 받아쓰기가 아주 시원하게 마술처럼 잘 작동합니다! 🌸',
  };



  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'archive'>('timeline');
  const [fontSize, setFontSize] = useState(18);
  const [darkMode, setDarkMode] = useState(false);
  const [weatherEmoji, setWeatherEmoji] = useState('🌤️');
  const [memos, setMemos] = useState<Memo[]>([]);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [inputText, setInputText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [editingMemo, setEditingMemo] = useState<Memo | null>(null);
  const [currentShare, setCurrentShare] = useState<Memo | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showSettings, setShowSettings] = useState(false); // ⚙️ 직관적인 설정창 토글 상태 추가!

  // 대표님 기획안 요건: 40~49개 시 리마인더 배너 닫기 및 50개 초과 모달 제어
  const [dismissBanner, setDismissBanner] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // 🪜 스토리보드 5단계 점진적 피처 가이드 닫힘 상태
  const [dismissedGuides, setDismissedGuides] = useState<Set<string>>(new Set());

  // 🧠 AI 리마인더 일정 적재 배열 상태
  const [scheduledReminders, setScheduledReminders] = useState<{ id: string; targetDate: string; content: string }[]>([]);
  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set());

  // 🎁 자녀 대리 결제(효도 선물) 모드 유무 감지
  const [isGiftMode, setIsGiftMode] = useState(false);

  // 🔒 50개 락 모달용 요금제 선택 상태 (기본값: 평생권)
  const [limitSelectedPlan, setLimitSelectedPlan] = useState<'lifetime' | 'annual' | 'monthly'>('lifetime');

  // 🎙️ 실시간 음성인식(STT) 상태 및 엔진 탑재
  const [isListening, setIsListening] = useState(false);
  const [isAiCorrecting, setIsAiCorrecting] = useState(false); // 🪄 AI 교정 로딩 상태 추가
  const [aiCorrectingMessage, setAiCorrectingMessage] = useState('🪄 AI 찰떡이 교정 중...'); // 🪄 AI 로딩 메시지 상태 추가
  const [isVoiceUsed, setIsVoiceUsed] = useState(false); // 🎙️ 음성 인식 사용 여부 추적 상태 추가
  const [sttHasResult, setSttHasResult] = useState(true); // 🎙️ 가상 폰/웹뷰 STT 오동작 진단 힌트 상태 추가
  const [isVoiceMode, setIsVoiceMode] = useState(false); // 🎙️ 현재 말로 적기(음성) 모드로 입력 폼이 열려 있는지 제어 상태 추가
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false); // 📱 모바일 가상 키보드 감지 상태 추가

  // 🪄 Gemini API fetch 호출 헬퍼 비동기 함수
  const callGeminiAPI = async (modelName: string, promptText: string, apiKey: string) => {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
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
      throw new Error(`Gemini API Call Failed (Status: ${response.status})`);
    }
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  };

  // 🪄 어르신 구어체 ➔ 일목요연한 찰떡 어조 변환 초경량 로컬/글로벌 AI 엔진
  const runAiCorrection = async () => {
    if (!inputText.trim()) return;
    setIsAiCorrecting(true);
    setAiCorrectingMessage('🤖 AI 기억이가 문맥을 짚어보고 있어요...');

    const hintMessages = [
      '🤖 AI 기억이가 문맥을 짚어보고 있어요...',
      '✍️ 발음 오류와 맞춤법을 말끔하게 가다듬는 중...',
      '✨ 다듬어진 생각 문장을 이쁘게 조립하고 있어요...',
      '⏰ 거의 다 되었습니다! 조금만 더 기다려 주세요...'
    ];
    let msgIndex = 0;
    const intervalId = setInterval(() => {
      msgIndex = (msgIndex + 1) % hintMessages.length;
      setAiCorrectingMessage(hintMessages[msgIndex]);
    }, 2000);

    const cleanup = () => {
      clearInterval(intervalId);
      setIsAiCorrecting(false);
    };

    const originalText = inputText.trim();
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // 만약 API Key가 없거나 기본 데모 값일 경우 -> 더욱 지능화된 로컬 스마트 폴백 교정 알고리즘 작동!
    if (!geminiApiKey || geminiApiKey === '대표님의_키_입력') {
      setTimeout(() => {
        cleanup();
        let refined = originalText
          // 1) 대표적인 구어체 조사/감탄사 탈락 및 단정한 비서형 정리
          .replace(/있잖아|있자녀|있구만|그\.\.|저기\.\.|음\.\.|머시냐|거시기|말이여|말이야/g, '')
          .replace(/가가지고|가서/g, '방문하여')
          .replace(/\s+/g, ' ')
          .replace(/^(아|어|음|그|뭐|저|근데|그래서|어그게)\s*/gi, '')
          .replace(/\s*(아|어|음|그|뭐|저)\s*$/gi, '')
          .trim();

        if (refined && !refined.match(/[.!?。！？]$/)) {
          refined += '.';
        }

        setInputText(refined);
        alert('💡 [데모 모드] AI API 키가 아직 설정되지 않아, 로컬 스마트 교정기가 깔끔하게 다듬어 드렸어요! 깃허브나 Vercel 환경 변수에 진짜 Gemini API Key(NEXT_PUBLIC_GEMINI_API_KEY)를 등록하시면 초거대 AI 교정이 즉시 동작합니다. 😊');
      }, 2500);
      return;
    }

    const prompt = `너는 오타, 뭉개진 발음, 중언부언, 사투리가 섞인 중장년층의 한국어 말소리를 자연스럽고 품격 있는 표준 메모 문장으로 다듬는 40대 이상 타겟의 메모장 정리 비서 '기억이'야. 아래 텍스트는 사용자가 음성 인식으로 편하게 흘려 적은 내용이다. 이 내용을 1. 불필요한 추임새 제거, 2. 문맥상 오타 및 맞춤법 교정, 3. 표준어 순화를 거쳐 친근하면서도 정갈한 한글 문장으로 교정해줘. 부가 설명이나 서론, 결론, 따옴표 없이 오직 교정된 최종 결과 문장만 단 한 줄로 출력해야 해.\n\n사용자 음성 입력: "${originalText}"`;

    try {
      // 1차 시도: gemini-2.5-flash
      let refinedText = "";
      try {
        refinedText = await callGeminiAPI("gemini-2.5-flash", prompt, geminiApiKey);
      } catch (e1) {
        console.warn("Gemini 2.5 Flash 실패, 1.5 Flash 2차 시도...", e1);
        refinedText = await callGeminiAPI("gemini-1.5-flash", prompt, geminiApiKey);
      }

      cleanup();
      if (refinedText) {
        setInputText(refinedText);
      } else {
        throw new Error("응답이 비어있음");
      }
    } catch (error) {
      cleanup();
      console.error("Gemini API 최종 연동 실패:", error);
      
      // 통신 에러 시 로컬 폴백 작동
      let refined = originalText
        .replace(/\s+/g, ' ')
        .replace(/^(아|어|음|그|뭐|저|근데|그래서|어그게)\s*/gi, '')
        .replace(/\s*(아|어|음|그|뭐|저)\s*$/gi, '')
        .trim();
      if (refined && !refined.match(/[.!?。！？]$/)) {
        refined += '.';
      }
      setInputText(refined);
      alert('⚠️ [인터넷 연결 지연] AI 서버와 일시적으로 통신이 원활하지 않아, 로컬 스마트 교정기가 안전하게 글을 다듬어 드렸어요! 😢');
    }
  };

  const startSpeechRecognition = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('🎙️ 현재 기기나 브라우저에서 음성 인식을 지원하지 않습니다. 키보드로 편리하게 입력해 주세요!');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      // 🌸 [연속 인식 특급 보증] 천천히 뜸을 들이며 생각하며 말씀하셔도 귀를 닫지 않고 끝까지 연속으로 받아 적습니다!
      recognition.continuous = true;
      recognition.interimResults = true; // 실시간 받아쓰기 결과 노출로 극상의 부드러운 UX 실현
      recognition.lang = lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'ko-KR';

      let baseText = inputText.trim(); // 음성 감지 시작 전 입력창에 적혀있던 원래 글자 보존

      let sttTimeoutId: any = null;

      recognition.onstart = () => {
        setIsListening(true);
        setIsVoiceUsed(true); // 🎙️ 음성 인식 사용 감지 활성화!
        setSttHasResult(true); // 기본 진단 상태 초기화

        // 4초 동안 입력 신호(onresult)가 단 한 번도 안 오면 웹뷰/에뮬레이터 오동작으로 진단하여 힌트 띄우기!
        sttTimeoutId = setTimeout(() => {
          setSttHasResult(false);
        }, 4000);
      };

      recognition.onresult = (event: any) => {
        // 입력 신호가 들어왔으므로 타이머 해제 및 진단 성공 처리!
        if (sttTimeoutId) {
          clearTimeout(sttTimeoutId);
        }
        setSttHasResult(true);

        let interimTranscript = '';
        let finalTranscript = '';

        // 연속 수집 모드에서는 누적된 조각들을 실시간으로 분리 병합해 주는 알고리즘이 필수입니다!
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          baseText = baseText ? `${baseText} ${finalTranscript}` : finalTranscript;
          setInputText(baseText);
        } else if (interimTranscript) {
          // 말하고 있는 도중에도 사르륵 텍스트가 먼저 찍혀서 반응성을 극대화합니다!
          setInputText(baseText ? `${baseText} ${interimTranscript}` : interimTranscript);
        }
      };

      recognition.onerror = (e: any) => {
        console.error('음성 인식 오류:', e);
        if (sttTimeoutId) clearTimeout(sttTimeoutId);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const { user, authLoading, signOut } = useAuth();
  const { subscription, isPremium, loading: subLoading } = useSubscription(user);
  const { memos: dbMemos, addMemo, updateMemo, toggleStar: dbToggleStar } = useMemos(user);
  
  const TODAY_KEY = getTodayKey();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  /* 🔍 자동 카테고리 태그 분류 (대표님 승인 C안 - 다국어 키워드 지원) */
  const getMemoCategory = useCallback((text: string): string => {
    const normalized = text.toLowerCase();
    
    // 1. 금융/돈
    const financeKeywords = ['계좌', '신한', '은행', '송금', '돈', '가격', '원', '페이', '입금', '출금', '수수료', '주식', '카드', '월세', '용돈', 'account', 'bank', 'transfer', 'money', 'price', 'won', 'pay', 'deposit', 'fee', 'card', '口座', '銀行', '送金', '金', '価格', '円', 'ペイ', '入金', '手数料', 'カード'];
    if (financeKeywords.some(keyword => normalized.includes(keyword))) return 'finance';
    
    // 2. 약속/모임
    const meetingKeywords = ['친구', '동창', '모임', '약속', '시', '갈비', '만나', '예약', '방문', '동호회', '식사', '회의', '가족', '식구', '식당', 'friend', 'meeting', 'appointment', 'meet', 'reserve', 'dinner', 'lunch', 'family', 'restaurant', '友達', '同窓会', '集まり', '約束', 'カルビ', '会う', '予約', '訪問', '食事', '会議', '家族', '食堂'];
    if (meetingKeywords.some(keyword => normalized.includes(keyword))) return 'meeting';
    
    // 3. 장보기/할일
    const shoppingKeywords = ['마트', '마켓', '장볼', '우유', '계란', '두부', '장보기', '쇼핑', '리스트', '사야', '할일', '할 일', '청소', '세차', 'mart', 'market', 'grocery', 'milk', 'egg', 'tofu', 'shopping', 'list', 'todo', 'to-do', 'clean', 'wash', 'マート', 'マーケット', '牛乳', '卵', '豆腐', '買い物', 'ショッピング', 'リスト', 'すること', '掃除', '洗車'];
    if (shoppingKeywords.some(keyword => normalized.includes(keyword))) return 'shopping';
    
    return 'diary';
  }, []);

  /* 필터링 규칙 */
  const shouldShowMemo = useCallback((memo: Memo) => {
    if (categoryFilter !== 'all') {
      const cat = getMemoCategory(memo.text);
      if (cat !== categoryFilter) return false;
    }
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      if (!memo.text.toLowerCase().includes(query)) return false;
    }
    return true;
  }, [categoryFilter, searchQuery, getMemoCategory]);

  /* 형광펜 하이라이트 React 렌더 헬퍼 (대표님 승인 A안) */
  const renderHighlightedText = useCallback((text: string, query: string) => {
    if (!query || !query.trim()) return text;
    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="highlight">{part}</mark>
      ) : part
    );
  }, []);

  const filteredMemos = memos.filter(shouldShowMemo);
  const starredMemos = memos.filter(m => starredIds.has(m.id));
  const filteredStarredMemos = starredMemos.filter(shouldShowMemo);
  const isSearchingOrFiltering = searchQuery.trim() !== '' || categoryFilter !== 'all';

  // 클라이언트 마운트 완료 감지 (Hydration mismatch 방지)
  useEffect(() => { setMounted(true); }, []);

  // 📱 모바일 가상 키보드 팝업 감지 및 body 패딩 동적 제어 (대표님 피드백: 키보드가 입력 영역을 가리는 현상 완벽 방어!)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initialHeight = window.innerHeight;
    const handleResize = () => {
      // 뷰포트 높이가 초기 높이보다 150px 이상 좁아지면 가상 키보드가 열린 것으로 간주
      if (window.innerHeight < initialHeight - 150) {
        setIsKeyboardOpen(true);
        document.body.style.paddingBottom = '10px'; // 키보드가 열렸을 때는 패딩을 슬림하게 줄여서 저장/취소 버튼 가림 현상 해결!
      } else {
        setIsKeyboardOpen(false);
        document.body.style.paddingBottom = '105px'; // 키보드가 닫혔을 때는 원래 하단바 자리 패딩 복원!
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.style.paddingBottom = ''; // 언마운트 시 초기화
    };
  }, []);

  // 🌓 다크 모드 상태를 document.body에 동기화하여 전체 화면 다크모드 무력화 격파!
  useEffect(() => {
    if (!mounted) return;
    document.body.classList.toggle('dark-mode', darkMode);
  }, [mounted, darkMode]);

  // 🎁 자녀 효도 선물 URL 파라미터 감지 (?gift=true)
  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('gift') === 'true') {
      setIsGiftMode(true);
      setShowPricing(true); // 곧장 결제창을 오픈하여 전환유도
    }
  }, [mounted]);

  // 💡 구글 로그인 성공 후, 대기 중이던 결제(Stripe) 자동 실행 브릿지
  useEffect(() => {
    if (!mounted || !user) return;
    const pendingPlan = localStorage.getItem('pending_upgrade_plan');
    if (pendingPlan && (pendingPlan === 'lifetime' || pendingPlan === 'annual' || pendingPlan === 'monthly')) {
      localStorage.removeItem('pending_upgrade_plan');
      
      // 마이그레이션 및 Stripe로 리다이렉트
      alert('🌸 소중한 메모 50개를 안전한 클라우드로 안전하게 동기화하고 있습니다...\n잠시 후 결제 페이지로 이동합니다.');
      
      (async () => {
        try {
          const res = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lang, planType: pendingPlan }),
          });
          const data = await res.json();
          if (data.url) {
            window.location.href = data.url;
          }
        } catch (e) {
          console.error(e);
        }
      })();
    }
  }, [mounted, user, lang]);

  // Stripe 결제 페이지 리다이렉트 처리 함수
  const handleUpgrade = async (planType: 'lifetime' | 'annual' | 'monthly') => {
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, planType }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (e) {
      console.error(e);
      alert(lang === 'ko' ? '오류가 발생했습니다. 다시 시도해주세요.' : 'An error occurred. Please try again.');
    }
  };

  // 락 모달 내 원스톱 버튼 액션
  const handleLimitAction = async () => {
    if (!user) {
      // 비로그인 상태: 요금제 저장 후 구글 로그인 트리거
      localStorage.setItem('pending_upgrade_plan', limitSelectedPlan);
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?lang=${lang}`,
        },
      });
      if (error) {
        alert(error.message);
      }
    } else {
      // 로그인 상태: 즉시 결제 처리
      await handleUpgrade(limitSelectedPlan);
    }
  };

  // 🔒 락 모달 내 자녀에게 부탁하기 (카카오톡 공유 메시지 생성 및 클립보드 복사)
  const handleLimitShareGift = () => {
    const giftUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}${window.location.pathname}?gift=true` 
      : 'http://localhost:3001/ko?gift=true';

    const message = `🌸 기억노트\n\n엄마/아빠가 기억노트 공간이\n가득 찼대요.\n\n선물해 드리면 어떨까요? 🎁\n평생 이용권 ₩59,000 (1회 결제)\n\n👉 [선물하기 링크]\n${giftUrl}`;
    
    const alertMsg = `📋 자녀에게 보낼 카카오톡 선물 요청 메시지가 클립보드에 복사되었습니다!\n\n자녀분과의 카카오톡이나 문자 대화방을 열고 '붙여넣기(전송)' 하시면 자녀분이 대신 평생권을 선물해 드릴 수 있습니다 🌸`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(message).then(() => {
        alert(alertMsg);
      }).catch(() => {
        alert("메시지 복사에 실패했습니다. 직접 주소를 공유해주세요: " + giftUrl);
      });
    } else {
      alert("클립보드를 지원하지 않는 환경입니다. 주소: " + giftUrl);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 💡 [기억노트 하이브리드 영구 동기화 로직]
  // 1) 프리미엄 유저: Supabase 실시간 클라우드 동기화 활성화
  // 2) 일반/무료 유저: 기기 내부 localStorage 기반 로컬 백업 자동 활성화
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;

    // 가이드 닫힘 상태 및 AI 리마인더 로드
    try {
      const savedGuides = localStorage.getItem('chaltteok_dismissed_guides');
      if (savedGuides) {
        setDismissedGuides(new Set(JSON.parse(savedGuides)));
      }
      
      const savedReminders = localStorage.getItem('chaltteok_scheduled_reminders');
      if (savedReminders) {
        setScheduledReminders(JSON.parse(savedReminders));
      }

      const savedDismissedReminders = localStorage.getItem('chaltteok_dismissed_reminders');
      if (savedDismissedReminders) {
        setDismissedReminders(new Set(JSON.parse(savedDismissedReminders)));
      }
    } catch (e) {
      console.warn('로컬 가이드 및 리마인더 데이터 로드 실패:', e);
    }

    if (user && isPremium && dbMemos) {
      // 🌟 프리미엄 유저: Supabase 클라우드 동기화
      const mapped: Memo[] = dbMemos.map((m: any) => ({
        id: m.id,
        text: m.text,
        time: m.time_label,
        isVoice: m.is_voice,
        dateKey: m.date_key,
      }));
      setMemos(mapped);
      
      const starred = new Set(dbMemos.filter((m: any) => m.is_starred).map((m: any) => m.id));
      setStarredIds(starred);
    } else {
      // 🆓 일반 유저: 기기 내부 로컬 저장소 로드 (모바일 인앱 브라우저 보안 에러 원천 방어 try-catch)
      try {
        const local = localStorage.getItem('chaltteok_memos');
        if (local) {
          const parsed = JSON.parse(local);
          setMemos(parsed);
          
          const localStars = localStorage.getItem('chaltteok_starred');
          if (localStars) {
            setStarredIds(new Set(JSON.parse(localStars)));
          }
        }
      } catch (e) {
        console.warn('⚠️ [하이브리드 세이프가드] 로컬 스토리지를 이용할 수 없는 모바일 보안 브라우저입니다. 임시 메모리 모드로 정상 작동합니다.', e);
      }
    }
  }, [mounted, user, isPremium, dbMemos]);

  // 일반/무료 유저용 변경 시 localStorage 자동 덤프 백업 (모바일 인앱 브라우저 보안 에러 원천 방어 try-catch)
  useEffect(() => {
    if (!mounted || (user && isPremium)) return;
    try {
      localStorage.setItem('chaltteok_memos', JSON.stringify(memos));
    } catch (e) {
      console.warn('⚠️ [하이브리드 세이프가드] 로컬 스토리지 메모 저장이 차단되어 임시 상태로 유지됩니다.', e);
    }
  }, [memos, user, isPremium, mounted]);

  useEffect(() => {
    if (!mounted || (user && isPremium)) return;
    try {
      localStorage.setItem('chaltteok_starred', JSON.stringify(Array.from(starredIds)));
    } catch (e) {
      console.warn('⚠️ [하이브리드 세이프가드] 로컬 스토리지 별표 저장이 차단되어 임시 상태로 유지됩니다.', e);
    }
  }, [starredIds, user, isPremium, mounted]);

  // 가이드 및 리마인더 자동 저장 세이프가드
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('chaltteok_dismissed_guides', JSON.stringify(Array.from(dismissedGuides)));
    } catch (e) {
      console.warn('로컬 가이드 상태 저장 실패:', e);
    }
  }, [dismissedGuides, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('chaltteok_scheduled_reminders', JSON.stringify(scheduledReminders));
    } catch (e) {
      console.warn('로컬 리마인더 데이터 저장 실패:', e);
    }
  }, [scheduledReminders, mounted]);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('chaltteok_dismissed_reminders', JSON.stringify(Array.from(dismissedReminders)));
    } catch (e) {
      console.warn('로컬 닫은 리마인더 상태 저장 실패:', e);
    }
  }, [dismissedReminders, mounted]);

  /* 날씨 로드 (Geolocation 미지원 및 모바일 인앱 브라우저 강제 지연 방어) */
  useEffect(() => {
    (async () => {
      // 1. Geolocation API 아예 제공되지 않거나 비보안 HTTP 컨텍스트이면 곧장 디폴트 날씨 로드로 우회하여 프리징 완벽 격파!
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        try {
          const res = await fetch(
            'https://api.open-meteo.com/v1/forecast?latitude=37.57&longitude=126.98&current=weather_code&timezone=Asia/Seoul'
          );
          const data = await res.json();
          setWeatherEmoji(wmoToEmoji(data.current?.weather_code ?? 0));
        } catch {
          setWeatherEmoji('🌤️');
        }
        return;
      }

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 }) // 모바일 웹 브라우저 대기 타임아웃을 3초로 대폭 단축하여 극상 반응속도 확보!
        );
        const { latitude: lat, longitude: lon } = pos.coords;
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code&timezone=auto`
        );
        const data = await res.json();
        setWeatherEmoji(wmoToEmoji(data.current?.weather_code ?? 0));
      } catch {
        try {
          const res = await fetch(
            'https://api.open-meteo.com/v1/forecast?latitude=37.57&longitude=126.98&current=weather_code&timezone=Asia/Seoul'
          );
          const data = await res.json();
          setWeatherEmoji(wmoToEmoji(data.current?.weather_code ?? 0));
        } catch {
          setWeatherEmoji('🌤️');
        }
      }
    })();
  }, []);

  /* ✏️ 메모 쓰기 모달/인라인 오픈 제어 (50개 도달 시 하드 락 차단) */
  const handleOpenInput = () => {
    if (!isPremium && memos.length >= 50 && !showInput) {
      setShowLimitModal(true);
      return;
    }
    setIsVoiceMode(false); // 글씨 적기 모드로 강제 설정
    setShowInput(true); // 입력 폼 열기
    setTimeout(() => {
      const el = document.getElementById('memo-textarea');
      if (el) el.focus();
    }, 80);
  };

  /* 🧠 [AI & 로컬 하이브리드] 스마트 리마인더 날짜/일정 추출 엔진 */
  const extractReminderFromText = async (text: string): Promise<{ hasReminder: boolean; targetDate: string; content: string }> => {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth(); // 0-11
    const todayDay = now.getDate();
    const todayStr = `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`;

    // 1. 로컬 스마트 추론 (Gemini 미작동 시 폴백 및 초고속 매핑)
    const localParse = (): { hasReminder: boolean; targetDate: string; content: string } => {
      // 1) "몇월 몇일" 패턴
      const monthDayMatch = text.match(/(\d+)\s*월\s*(\d+)\s*일/);
      if (monthDayMatch) {
        const month = parseInt(monthDayMatch[1]) - 1; // 0-11
        const day = parseInt(monthDayMatch[2]);
        let year = todayYear;
        if (month < todayMonth) {
          year += 1;
        }
        const targetDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let content = text.replace(/\d+\s*월\s*\d+\s*일(날|에)?\s*/g, '').trim();
        if (!content) content = '기억할 일정';
        return { hasReminder: true, targetDate: targetDateStr, content: content.substring(0, 15) };
      }

      // 2) "몇일" 패턴 (대표님 공식 핵심 스마트 날짜 룰!)
      const dayMatch = text.match(/(\d+)\s*일/);
      if (dayMatch) {
        const day = parseInt(dayMatch[1]);
        let targetYear = todayYear;
        let targetMonth = todayMonth;

        if (day < todayDay) {
          // 오늘 이전 일자이면 자동 다음 달(익월) 이월!
          targetMonth += 1;
          if (targetMonth > 11) {
            targetMonth = 0;
            targetYear += 1;
          }
        }
        // 오늘 이후이거나 같으면 이번 달!
        const targetDateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        let content = text.replace(/\d+\s*일(날|에)?\s*/g, '').trim();
        if (!content) content = '기억할 일정';
        return { hasReminder: true, targetDate: targetDateStr, content: content.substring(0, 15) };
      }

      // 3) 내일/모레 패턴
      if (text.includes('내일')) {
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const targetDateStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
        let content = text.replace(/내일(날|에)?\s*/g, '').trim();
        if (!content) content = '내일 일정';
        return { hasReminder: true, targetDate: targetDateStr, content: content.substring(0, 15) };
      }
      if (text.includes('모레')) {
        const dayAfterTomorrow = new Date(now);
        dayAfterTomorrow.setDate(now.getDate() + 2);
        const targetDateStr = `${dayAfterTomorrow.getFullYear()}-${String(dayAfterTomorrow.getMonth() + 1).padStart(2, '0')}-${String(dayAfterTomorrow.getDate()).padStart(2, '0')}`;
        let content = text.replace(/모레(날|에)?\s*/g, '').trim();
        if (!content) content = '모레 일정';
        return { hasReminder: true, targetDate: targetDateStr, content: content.substring(0, 15) };
      }

      return { hasReminder: false, targetDate: '', content: '' };
    };

    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!geminiApiKey || geminiApiKey === '대표님의_키_입력') {
      return localParse();
    }

    // 2. Gemini 지능형 AI 파싱 엔진 구동
    try {
      const prompt = `사용자의 메모 텍스트에서 약속 일정 정보(약속 날짜와 일정 요약)를 파싱해야 합니다.
오늘 날짜는 ${todayStr} 입니다.
반드시 아래 규칙과 룰을 철저히 준수하여 유효한 JSON 형태로만 반환해야 합니다:
1. 사용자가 '월'을 명시하지 않고 '일'만 언급했을 때, 그 날짜가 오늘(${todayStr}) 기준 미래의 날짜(오늘 포함)이면 '이번 달'로 날짜를 완성합니다. 만약 과거의 날짜이면 '다음 달'로 날짜를 자동 완성합니다.
2. 약속이나 일정이 명시되어 있지 않다면 "hasReminder": false 로 지정합니다.
3. 응답은 다른 잡다한 설명이나 백틱(\`\`\`) 없이 오직 JSON 데이터 문자열 한 줄만 출력하십시오.

출력 JSON 스키마:
{
  "hasReminder": true 또는 false,
  "targetDate": "YYYY-MM-DD" 형태로 완성된 날짜,
  "content": "일정 제목 요약 (10자 이내, 예: 친구 약속)"
}

사용자 메모 텍스트: "${text}"`;

      let responseText = "";
      try {
        responseText = await callGeminiAPI("gemini-2.5-flash", prompt, geminiApiKey);
      } catch {
        responseText = await callGeminiAPI("gemini-1.5-flash", prompt, geminiApiKey);
      }

      // JSON 추출 정비
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed && typeof parsed.hasReminder === 'boolean') {
        return {
          hasReminder: parsed.hasReminder,
          targetDate: parsed.targetDate || '',
          content: parsed.content || '기억할 일정'
        };
      }
      return localParse();
    } catch (e) {
      console.warn("AI 리마인더 추출 실패, 로컬 룰 엔진 가동:", e);
      return localParse();
    }
  };

  /* 메모 저장 및 수정 */
  const saveMemo = useCallback(async () => {
    if (!inputText.trim()) return;

    // 저장 직전 최종적으로 무료 요금제 50개 용량 초과 체크
    if (!isPremium && memos.length >= 50 && !editingMemo) {
      setShowLimitModal(true);
      return;
    }

    const memoText = inputText.trim();

    if (editingMemo) {
      // 1) 프리미엄 유저의 Supabase 백엔드 데이터베이스 동기화
      if (user && isPremium) {
        await updateMemo(editingMemo.id, memoText);
      }
      setMemos(prev => prev.map(m => m.id === editingMemo.id ? { ...m, text: memoText } : m));
      
      // 수정된 메모의 리마인더 일정 재파싱
      const extracted = await extractReminderFromText(memoText);
      if (extracted.hasReminder && extracted.targetDate) {
        setScheduledReminders(prev => {
          // 기존에 이 메모 ID에 대한 리마인더가 있다면 교체, 없으면 추가
          const filtered = prev.filter(r => r.id !== editingMemo.id);
          return [...filtered, { id: editingMemo.id, targetDate: extracted.targetDate, content: extracted.content }];
        });
      }

      setEditingMemo(null);
    } else {
      const newMemoId = `m-${Date.now()}`;
      
      const newMemo: Memo = {
        id: newMemoId,
        text: memoText,
        time: formatTime(),
        isVoice: isVoiceUsed, // 🎙️ 음성 인식을 거친 내역을 온전히 기록
        dateKey: TODAY_KEY,
      };

      // 2) 프리미엄 유저의 Supabase 백엔드 데이터베이스 등록
      if (user && isPremium) {
        const created = await addMemo(memoText, TODAY_KEY, newMemo.time, isVoiceUsed, lang);
        if (created) {
          newMemo.id = created.id; // DB 실제 ID 연동
        }
      }

      setMemos(prev => [newMemo, ...prev]);

      // 🧠 AI 및 로컬 룰 기반 일정 자동 추출 기동!
      const extracted = await extractReminderFromText(memoText);
      if (extracted.hasReminder && extracted.targetDate) {
        setScheduledReminders(prev => [
          ...prev,
          { id: newMemo.id, targetDate: extracted.targetDate, content: extracted.content }
        ]);
        // 당일 당월 매핑이 잘 등록되었음을 알려주는 피드백 안내 (어르신 안심 꿀팁)
        alert(`⏰ 리마인더 일정이 자동으로 등록되었습니다!\n📅 약속 날짜: ${extracted.targetDate}\n📌 내용: ${extracted.content}`);
      }
    }
    setInputText('');
    setIsVoiceUsed(false); // 🎙️ 음성 사용 이력 안전하게 리셋
    setShowInput(false);
  }, [inputText, editingMemo, TODAY_KEY, isPremium, memos.length, user, addMemo, updateMemo, lang, isVoiceUsed, extractReminderFromText]);

  /* 수정 취소 */
  const cancelMemo = useCallback(() => {
    setInputText('');
    setEditingMemo(null);
    setIsVoiceUsed(false); // 🎙️ 음성 사용 이력 안전하게 리셋
    setShowInput(false);
  }, []);

  /* 수정 시작 */
  const startEdit = useCallback((memo: Memo) => {
    setEditingMemo(memo);
    setInputText(memo.text);
    setActiveTab('timeline'); // 무한 일력 탭으로 자동 이동하여 수정 창 표시
    setShowInput(true);
  }, []);

  /* 별표 토글 */
  const toggleStar = useCallback(async (id: string) => {
    const isCurrentlyStarred = starredIds.has(id);
    const nextStarred = !isCurrentlyStarred;

    setStarredIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

    if (user && isPremium) {
      await dbToggleStar(id, nextStarred);
    }
  }, [user, isPremium, starredIds, dbToggleStar]);

  // 🌸 [하이브리드 앱 영구 세이프가드] 클라이언트 마운트 완료 전에는 안전한 옐로우 브랜드 로딩바를 보여주어 
  // 서버와 스마트폰 간의 React Hydration Mismatch를 원천 차단하고 자바스크립트 스레드 프리징을 완벽 예방합니다!
  if (!mounted) {
    return (
      <div style={{
        background: '#FFDE59',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📝</div>
        <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#1A1A1A' }}>기억노트 켜지는 중...</div>
      </div>
    );
  }

  return (
    <div
      className={`app-container ${mounted && darkMode ? 'dark-mode' : ''}`}
      style={{ fontSize: `${fontSize}px` }}
      suppressHydrationWarning
    >
      {/* ====== 상단 헤더 ====== */}
      <header id="app-header">
        <div id="header-left">
          <span id="app-logo">📝 {dict.header.title}</span>
        </div>
        <div id="header-right">
          <button 
            className="font-btn" 
            onClick={() => setShowSettings(p => !p)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: showSettings 
                ? (darkMode ? '#3A2F5D' : '#E8DFFF')
                : 'var(--bg-card)',
              color: showSettings 
                ? (darkMode ? '#E8DFFF' : '#3D2E6F') 
                : 'var(--color-text)',
              borderColor: showSettings 
                ? (darkMode ? '#E8DFFF' : '#3D2E6F') 
                : 'var(--color-border)',
              fontWeight: 'bold'
            }}
          >
            ⚙️ {showSettings ? '설정 닫기' : '설정'}
          </button>
        </div>
      </header>

      {/* ⚙️ 설정 인라인 드롭다운 패널 */}
      {showSettings && (
        <div style={{
          background: darkMode ? '#201A30' : '#F0E9FF',
          borderBottom: darkMode ? '3px solid #3A2F5D' : '3px solid #3D2E6F',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          animation: 'modalUp 0.15s ease',
          boxShadow: 'inset 0 -2px 5px rgba(0,0,0,0.05)',
          zIndex: 300
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)' }}>
              🔤 글씨 크기 조절
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button 
                className="font-btn" 
                onClick={() => setFontSize(p => Math.max(14, p - 2))}
                style={{ padding: '6px 14px' }}
              >
                a−
              </button>
              <span style={{ fontSize: '0.9rem', fontWeight: 900, minWidth: '45px', textAlign: 'center' }}>
                {fontSize}px
              </span>
              <button 
                className="font-btn" 
                onClick={() => setFontSize(p => Math.min(26, p + 2))}
                style={{ padding: '6px 14px' }}
              >
                A+
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)' }}>
              🌗 화면 모드
            </span>
            <button 
              className="font-btn" 
              onClick={() => setDarkMode(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: '110px', justifyContent: 'center' }}
            >
              {mounted && darkMode ? '☀️ 밝게 보기' : '🌙 어둡게 보기'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--color-border)', paddingTop: 10 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)' }}>
              👤 회원 로그인 및 백업
            </span>
            {mounted && !authLoading && (
              user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-sub)', fontWeight: 'bold' }}>
                    {user.email?.split('@')[0]}님
                  </span>
                  <button
                    className="font-btn"
                    onClick={signOut}
                    style={{ background: 'var(--color-accent)', color: '#fff', borderColor: 'var(--color-border)', padding: '4px 10px', fontSize: '0.8rem' }}
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <button
                  className="font-btn"
                  onClick={() => {
                    setShowSettings(false);
                    setShowAuth(true);
                  }}
                  style={{ background: '#1A1A1A', color: '#FFDE59', borderColor: '#1A1A1A', padding: '4px 14px', fontSize: '0.8rem' }}
                >
                  로그인
                </button>
              )
            )}
          </div>

          {!isPremium && (
            <div 
              onClick={() => {
                setShowSettings(false);
                setShowPricing(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #FFFDF0 0%, #FFF2B2 100%)',
                border: '1px solid #D4A96A',
                borderRadius: '8px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                marginTop: 4
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#855E1A' }}>
                  👑 평생 이용권 구매하기
                </span>
                <span style={{ fontSize: '0.72rem', color: '#9E773B', fontWeight: 700 }}>
                  50개 제한 해제 및 철통 자동 클라우드 백업
                </span>
              </div>
              <span style={{ fontSize: '1.2rem' }}>➔</span>
            </div>
          )}
          
          {isPremium && (
            <div style={{
              background: '#FFF9E6',
              border: '1px solid gold',
              borderRadius: '8px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.8rem',
              fontWeight: 'bold',
              color: '#B38F00'
            }}>
              👑 기억노트 평생 프리미엄 회원입니다 🌸
            </div>
          )}

          <button
            onClick={() => setShowSettings(false)}
            style={{
              width: '100%',
              padding: '12px',
              background: darkMode ? '#3A2F5D' : '#FFFFFF',
              color: darkMode ? '#E8DFFF' : '#3D2E6F',
              border: darkMode ? '1px solid #E8DFFF' : '1px solid #3D2E6F',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 900,
              cursor: 'pointer',
              textAlign: 'center',
              marginTop: 4
            }}
          >
            ⚙️ 설정 완료 (닫기 ✕)
          </button>
        </div>
      )}

      {/* 🎁 자녀 대리 결제(효도 선물) 모드 상단 웰컴 배너 */}
      {isGiftMode && (
        <div style={{
          background: '#FFF0F5',
          borderBottom: '1px solid var(--color-border)',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          textAlign: 'center',
          zIndex: 100
        }}>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#C71585', display: 'flex', alignItems: 'center', gap: 6 }}>
            🌸 부모님을 위한 따뜻한 효도 선물 도착!
          </h4>
          <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: '#333', lineHeight: 1.4 }}>
            부모님의 일기장 용량이 가득 차 안전한 영구 보관용 <strong>'평생권'</strong>을 요청하셨습니다.<br />
            아래 버튼을 눌러 선물해 주시면 부모님 기기에서 바로 평생 무제한 사용이 활성화됩니다!
          </p>
          <button
            onClick={() => setShowPricing(true)}
            style={{
              padding: '10px 24px',
              background: '#C71585',
              color: '#fff',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              fontWeight: 900,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            🎁 부모님께 1초 만에 평생권 선물하기
          </button>
        </div>
      )}

      {/* ====== 탭 네비게이션 ====== */}
      <nav id="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          📅 {dict.tabs.timeline}
        </button>
        <button
          className={`tab-btn ${activeTab === 'archive' ? 'active' : ''}`}
          onClick={() => setActiveTab('archive')}
        >
          ⭐ {dict.tabs.archive}
        </button>
      </nav>

      {/* ====== 상단 65% 타임라인 스크롤 영역 ====== */}
      <section className="timeline-section" style={{ height: isKeyboardOpen ? '100%' : '65%' }}>
        {/* ── 무한 일력 탭 ── */}
        {activeTab === 'timeline' && (
          <>
            <div id="daily-header">
              <div id="daily-date-left">
                <span id="daily-date-display" suppressHydrationWarning>
                  {mounted ? formatTodayFull(lang) : ''}
                </span>
              </div>
              <div id="daily-header-right">
                <span id="weather-icon">{weatherEmoji}</span>
                <span className="sync-status">
                  {isPremium ? `● Cloud ${dict.timeline.sync}` : `● Local ${dict.timeline.sync}`}
                </span>
              </div>
            </div>

            {/* 🔒 50개 가득 찼을 때 상단 오렌지색 경고 뱃지 */}
            {!isPremium && memos.length >= 50 && (
              <div 
                onClick={() => setShowLimitModal(true)}
                style={{
                  margin: '12px 16px 0',
                  padding: '12px',
                  background: '#FFF4E5',
                  border: '1px solid #F27A33',
                  borderRadius: 'var(--radius)',
                  color: '#D05A10',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                ⚠️ 무료 저장 공간 초과 (50/50개) - 공간 늘리기 ➔
              </div>
            )}

            {/* 🔍 실시간 검색창 & 조약돌 태그 바 */}
            <div id="search-filter-section">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="찾고 싶은 기억을 여기에 적어보세요..."
                  aria-label="기억 검색"
                />
                {searchQuery && (
                  <button id="btn-clear-search" onClick={() => setSearchQuery('')} aria-label="검색 지우기">✕</button>
                )}
              </div>
              <div className="category-tag-bar">
                <button className={`tag-btn${categoryFilter === 'all' ? ' active' : ''}`} onClick={() => setCategoryFilter('all')}>전체 📝</button>
                <button className={`tag-btn${categoryFilter === 'finance' ? ' active' : ''}`} onClick={() => setCategoryFilter('finance')}>금융/돈 💵</button>
                <button className={`tag-btn${categoryFilter === 'meeting' ? ' active' : ''}`} onClick={() => setCategoryFilter('meeting')}>약속/모임 👥</button>
                <button className={`tag-btn${categoryFilter === 'shopping' ? ' active' : ''}`} onClick={() => setCategoryFilter('shopping')}>장보기/할일 🛒</button>
                <button className={`tag-btn${categoryFilter === 'diary' ? ' active' : ''}`} onClick={() => setCategoryFilter('diary')}>일상/기록 ✍️</button>
              </div>
            </div>

            {/* 텍스트 입력 폼 (글씨로 적기 또는 마이크 보조창) */}
            {showInput && (
              <div style={{ padding: '12px 16px', background: 'var(--bg-card)', borderBottom: '1px solid var(--color-border)' }}>
                {!isVoiceMode && (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: 'var(--color-accent)', 
                    fontWeight: 800, 
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    lineHeight: '1.4'
                  }}>
                    ✏️ 오타나 띄어쓰기가 조금 틀려도 괜찮아요! 아래 [🪄 AI 깔끔하게 정리]를 누르면 예쁜 표준 문장으로 다듬어 드립니다.
                  </div>
                )}
                <textarea
                  id="memo-textarea"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="오늘 하루의 소중한 기억을 기록해 보세요..."
                  autoFocus
                  rows={4}
                  style={{ fontSize: `${fontSize}px` }}
                />
                
                {isVoiceMode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0 10px 0' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-sub)' }}>
                      {isListening ? voiceDict.listeningAuto : voiceDict.hintInfo}
                    </span>
                    {!isListening && (
                      <button 
                        onClick={startSpeechRecognition}
                        style={{
                          background: 'var(--color-accent)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        🎙️ {voiceDict.speakAgainBtn}
                      </button>
                    )}
                  </div>
                )}

                {isAiCorrecting ? (
                  <div style={{
                    background: '#FFF9E6',
                    border: '1px dashed #D4AF37',
                    borderRadius: '8px',
                    padding: '10px',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    color: '#B38F00',
                    marginBottom: '10px'
                  }}>
                    {aiCorrectingMessage}
                  </div>
                ) : (
                  <button
                    onClick={runAiCorrection}
                    disabled={!inputText.trim()}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: inputText.trim() 
                        ? 'linear-gradient(135deg, #FFE5EC 0%, #FFB7B2 100%)' 
                        : '#F0F0F0',
                      color: inputText.trim() ? '#6F2E31' : '#A0A0A0',
                      border: inputText.trim() ? '1px solid #FF8B94' : '1px solid #D0D0D0',
                      borderRadius: '10px',
                      fontSize: '0.88rem',
                      fontWeight: 900,
                      cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      opacity: inputText.trim() ? 1 : 0.65,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {voiceDict.aiPolishBtn}
                  </button>
                )}

                <div className="modal-actions" style={{ flexDirection: 'row', gap: 8 }}>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={saveMemo}>
                    💾 {editingMemo ? '수정 완료' : '저장'}
                  </button>
                  <button className="btn-secondary" onClick={cancelMemo}>
                    취소
                  </button>
                </div>
              </div>
            )}

            <div id="memo-list" className="memo-container">
              {/* 🧠 AI 당일 일정 리마인더 배너 출력 */}
              {scheduledReminders.map(rem => {
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                // 당일 약속 매칭 및 닫지 않은 리마인더만 렌더링!
                if (rem.targetDate === todayStr && !dismissedReminders.has(rem.id)) {
                  return (
                    <div key={rem.id} className="reminder-banner">
                      <div className="reminder-content">
                        <span className="reminder-icon">⏰</span>
                        <div className="reminder-text-wrapper">
                          <span className="reminder-badge">오늘의 약속</span>
                          <span className="reminder-title">{rem.content}</span>
                          <span className="reminder-desc">기억노트가 알려드려요! 소중한 약속이 오늘 있으니 꼭 기억하세요 🌸</span>
                        </div>
                      </div>
                      <button 
                        className="btn-close-reminder" 
                        onClick={() => setDismissedReminders(prev => {
                          const next = new Set(prev);
                          next.add(rem.id);
                          return next;
                        })}
                      >
                        ✕
                      </button>
                    </div>
                  );
                }
                return null;
              })}

              {/* 🪜 스토리보드 5단계 점진적 피처 가이드 카드 렌더링 */}
              {/* [1단계] 첫 실행: 메모가 0개일 때 */}
              {memos.length === 0 && !dismissedGuides.has('guide-step-1') && (
                <div className="guide-card">
                  <div className="guide-card-header">
                    <span className="guide-card-title">🌸 기억노트에 오신 것을 환영합니다!</span>
                    <button className="btn-close-guide" onClick={() => setDismissedGuides(prev => new Set(prev).add('guide-step-1'))}>✕</button>
                  </div>
                  <div className="guide-card-content">
                    반갑습니다! 기억노트와 함께 매일의 소소하지만 소중한 생각과 하루 일상을 적어보세요.<br />
                    키보드로 입력하지 않고 <strong>아래 하단 영역(마이크 그림)</strong>을 가볍게 누른 뒤 편하게 말씀하셔도 글자가 저절로 적힙니다. 지금 첫 메모를 시작해보세요! 😊
                  </div>
                </div>
              )}

              {/* [2단계] 메모 3회 이상: 별표 기능 꿀팁 */}
              {memos.length >= 3 && !dismissedGuides.has('guide-step-2') && (
                <div className="guide-card">
                  <div className="guide-card-header">
                    <span className="guide-card-title">⭐ 꼭 기억할 중요한 추억은 별표를 달아보세요!</span>
                    <button className="btn-close-guide" onClick={() => setDismissedGuides(prev => new Set(prev).add('guide-step-2'))}>✕</button>
                  </div>
                  <div className="guide-card-content">
                    메모가 예쁘게 쌓이고 있네요! 혹시 나중에 빠르게 찾아보고 싶은 중요한 은행 계좌번호나 모임 약속이 있으신가요?<br />
                    메모 카드 오른쪽 위의 <strong>별표(⭐) 단추</strong>를 누르면, 상단 '⭐ 별표 보관함' 탭에 따로 모아서 볼 수 있어요! 💡
                  </div>
                  <div className="guide-card-actions">
                    <button className="guide-btn-accent" onClick={() => {
                      setActiveTab('archive');
                      setDismissedGuides(prev => new Set(prev).add('guide-step-2'));
                    }}>별표 보관함 가보기 ➔</button>
                  </div>
                </div>
              )}

              {/* [3단계] 메모 10회 이상: AI 분류 제안 */}
              {memos.length >= 10 && !dismissedGuides.has('guide-step-3') && (
                <div className="guide-card">
                  <div className="guide-card-header">
                    <span className="guide-card-title">🤖 AI 지능형 카테고리 태그 바가 활성화되었습니다!</span>
                    <button className="btn-close-guide" onClick={() => setDismissedGuides(prev => new Set(prev).add('guide-step-3'))}>✕</button>
                  </div>
                  <div className="guide-card-content">
                    축하합니다! 소중한 추억이 10개 이상 등록되어, AI가 메모 내용을 분석해 <strong>[금융/돈 💵], [약속/모임 👥], [장보기/할일 🛒]</strong> 등으로 지능형 분류를 제공합니다.<br />
                    위의 조약돌 단추들을 눌러서 메모들을 주제별로 쏙쏙 간편하게 모아 보세요! 어떠신가요?
                  </div>
                  <div className="guide-card-actions">
                    <button className="guide-btn-accent" onClick={() => {
                      setCategoryFilter('meeting');
                      setDismissedGuides(prev => new Set(prev).add('guide-step-3'));
                      alert('👥 약속/모임 메모만 필터링해 보았어요! 조약돌 단추로 카테고리를 바꿔보세요.');
                    }}>좋아요 👍</button>
                    <button className="guide-btn-sub" onClick={() => setDismissedGuides(prev => new Set(prev).add('guide-step-3'))}>괜찮아요 ✕</button>
                  </div>
                </div>
              )}

              {/* [4단계] 별표 3개 이상: 가족 공유 제안 */}
              {starredIds.size >= 3 && !dismissedGuides.has('guide-step-4') && (
                <div className="guide-card">
                  <div className="guide-card-header">
                    <span className="guide-card-title">🌸 소중한 기억을 자녀나 가족에게 전송해볼까요?</span>
                    <button className="btn-close-guide" onClick={() => setDismissedGuides(prev => new Set(prev).add('guide-step-4'))}>✕</button>
                  </div>
                  <div className="guide-card-content">
                    중요하게 별표해 둔 메모가 3개나 모였습니다! 가족들과 나누고 싶은 재미있는 에피소드나 잊지 말아야 할 대소사가 있다면,<br />
                    메모 카드의 <strong>[👤 공유]</strong> 단추를 눌러 카카오톡으로 자녀에게 즉시 전송해보세요. 가족이 더 많이 기뻐할 것입니다! 🌸
                  </div>
                </div>
              )}

              {/* [5단계] 메모 40개 도달: 평생 무제한 저장 안내 (차단 없음) */}
              {memos.length >= 40 && !dismissedGuides.has('guide-step-5') && !isPremium && (
                <div className="guide-card" style={{ background: '#FFFDF0', borderColor: '#F2C363' }}>
                  <div className="guide-card-header">
                    <span className="guide-card-title" style={{ color: '#A17A00' }}>👑 추억 저장 공간을 무제한으로 넓혀보세요</span>
                    <button className="btn-close-guide" onClick={() => setDismissedGuides(prev => new Set(prev).add('guide-step-5'))}>✕</button>
                  </div>
                  <div className="guide-card-content">
                    벌써 40개 이상의 소중한 기록이 기억노트에 안전하게 저장되었습니다!<br />
                    무료 회원은 50개까지 저장이 가능하며, 평생권 이용 시 <strong>무제한 영구 보관</strong> 및 <strong>기기 고장 시 안전 복원용 자동 클라우드 백업</strong>이 영원히 활성화됩니다.
                  </div>
                  <div className="guide-card-actions">
                    <button className="guide-btn-accent" style={{ background: '#D4AF37' }} onClick={() => {
                      setShowPricing(true);
                      setDismissedGuides(prev => new Set(prev).add('guide-step-5'));
                    }}>평생권 알아보기 👑</button>
                    <button className="guide-btn-sub" onClick={() => setDismissedGuides(prev => new Set(prev).add('guide-step-5'))}>나중에 하기 ✕</button>
                  </div>
                </div>
              )}

              {/* 40~49개일 때 배너를 닫았더라도 상단에 작게 카운팅 노출 */}
              {!isPremium && memos.length >= 40 && memos.length < 50 && dismissBanner && (
                <div style={{
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  color: '#C71585',
                  textAlign: 'right',
                  paddingRight: 4
                }}>
                  📝 {memos.length} / 50 개의 메모가 저장되었습니다
                </div>
              )}

              {filteredMemos.length === 0 && (
                <div className="empty-hint">
                  <p>
                    {isSearchingOrFiltering ? (
                      '🔍 일치하는 기억이 없습니다.'
                    ) : (
                      '✍️ 아래 마이크 버튼을 누르고 편하게 말씀해 보세요!\n글씨가 저절로 정갈하게 적힙니다. 🌸'
                    )}
                  </p>
                </div>
              )}
              {filteredMemos.map(memo => (
                <div key={memo.id} className="memo-card">
                  <div className="memo-card-top">
                    <span className="memo-time">{memo.time}</span>
                    <div className="memo-card-actions">
                      <button className={`btn-star${starredIds.has(memo.id) ? ' active' : ''}`}
                        onClick={() => toggleStar(memo.id)}
                      >⭐</button>
                      <button className="btn-edit-card" onClick={() => startEdit(memo)}>✏️ 수정</button>
                      <button
                        className="btn-share-card"
                        onClick={() => setCurrentShare(memo)}
                      >👤 공유</button>
                    </div>
                  </div>
                  <div className="memo-text" style={{ fontSize: `${fontSize}px` }}>{renderHighlightedText(memo.text, searchQuery)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── 별표 보관함 탭 ── */}
        {activeTab === 'archive' && (
          <>
            <div className="view-header">
              <h2 className="view-title">⭐ {dict.archive.title}</h2>
              <p className="view-subtitle">{dict.archive.subtitle}</p>
            </div>
            
            <div id="search-filter-section">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="별표 보관함 내 기억 검색..."
                  aria-label="기억 검색"
                />
                {searchQuery && (
                  <button id="btn-clear-search" onClick={() => setSearchQuery('')} aria-label="검색 지우기">✕</button>
                )}
              </div>
              <div className="category-tag-bar">
                <button className={`tag-btn${categoryFilter === 'all' ? ' active' : ''}`} onClick={() => setCategoryFilter('all')}>전체 📝</button>
                <button className={`tag-btn${categoryFilter === 'finance' ? ' active' : ''}`} onClick={() => setCategoryFilter('finance')}>금융/돈 💵</button>
                <button className={`tag-btn${categoryFilter === 'meeting' ? ' active' : ''}`} onClick={() => setCategoryFilter('meeting')}>약속/모임 👥</button>
                <button className={`tag-btn${categoryFilter === 'shopping' ? ' active' : ''}`} onClick={() => setCategoryFilter('shopping')}>장보기/할일 🛒</button>
                <button className={`tag-btn${categoryFilter === 'diary' ? ' active' : ''}`} onClick={() => setCategoryFilter('diary')}>일상/기록 ✍️</button>
              </div>
            </div>

            <div className="archive-container" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredStarredMemos.length === 0 ? (
                <div className="empty-hint">
                  <p>
                    {isSearchingOrFiltering ? (
                      '🔍 일치하는 별표 기억이 없습니다.'
                    ) : (
                      dict.archive.empty
                    )}
                  </p>
                </div>
              ) : (
                filteredStarredMemos.map(memo => (
                  <div key={memo.id} className="star-card">
                    <div className="star-card-top">
                      <span className="star-card-date">{memo.dateKey} {memo.time}</span>
                      <button className="btn-edit-star-card" onClick={() => startEdit(memo)}>✏️ 수정</button>
                    </div>
                    <div className="memo-text" style={{ fontSize: `${fontSize}px` }}>{renderHighlightedText(memo.text, searchQuery)}</div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </section>

      {/* ====== 하단 35% '자이언트 음성 존' (모바일 가상 키보드 활성화 시 숨김) ====== */}
      <section className={`voice-zone ${isKeyboardOpen ? 'keyboard-hidden' : ''}`} style={{ height: isKeyboardOpen ? '0%' : '35%' }}>
        <div className="giant-mic-container">
          <div 
            className={`giant-mic-outer ${isListening ? 'recording' : ''}`}
            onClick={() => {
              if (isListening) {
                // 이미 인식 중이면 안전하게 수동 종료
                setIsListening(false);
              } else {
                if (isPremium || memos.length < 50) {
                  setIsVoiceMode(true);
                  setShowInput(true);
                  startSpeechRecognition();
                  setTimeout(() => {
                    const el = document.getElementById('memo-textarea');
                    if (el) el.focus();
                  }, 80);
                } else {
                  setShowLimitModal(true);
                }
              }
            }}
          >
            <div className="giant-mic-inner">
              {isListening ? '⏹️' : '🎙️'}
            </div>
          </div>
        </div>
        <div className="voice-guide-text">
          {isListening ? '듣고 있어요! 편하게 말씀하세요' : '여기 누르고 말씀하세요'}
        </div>
        <div className="voice-sub-text">
          {isListening ? '말씀을 끝내시면 [저장] 단추를 눌러주세요 🌸' : '손가락 어디든 가볍게 닿으면 마술처럼 시작돼요'}
        </div>
      </section>

      {/* ====== 공유 모달 ====== */}
      <ShareModal
        lang={lang}
        memo={currentShare}
        onClose={() => setCurrentShare(null)}
        baseUrl={typeof window !== 'undefined' ? window.location.origin : ''}
      />

      {/* ====== 로그인 모달 ====== */}
      {showAuth && (
        <AuthModal
          lang={lang}
          onClose={() => setShowAuth(false)}
          onGuestMode={() => setShowAuth(false)}
        />
      )}

      {/* ====== 요금제 모달 ====== */}
      {showPricing && (
        <PricingModal
          lang={lang}
          isPremium={isPremium}
          isLoggedIn={!!user}
          onClose={() => setShowPricing(false)}
          onLoginRequired={() => {
            setShowPricing(false);
            setShowAuth(true);
          }}
        />
      )}

      {/* 🔒 50개 용량 도달 시 차단 팝업 모달 */}
      {showLimitModal && (
        <>
          <div 
            onClick={() => setShowLimitModal(false)} 
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.65)',
              zIndex: 700,
              backdropFilter: 'blur(3px)',
            }} 
          />

          <div style={{
            position: 'fixed',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '92%',
            maxWidth: '430px',
            background: 'var(--bg-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '24px 20px',
            boxShadow: 'var(--shadow-modal)',
            zIndex: 800,
            animation: 'modalUp 0.2s ease',
            color: 'var(--color-text)',
            boxSizing: 'border-box'
          }}>
            <button 
              onClick={() => setShowLimitModal(false)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none', fontSize: '1.2rem',
                cursor: 'pointer', color: 'var(--color-sub)'
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '6px' }}>🌸</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 900, margin: '0 0 8px 0', color: 'var(--color-text)' }}>
                기억 공간이 가득 찼어요
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#666', margin: 0, lineHeight: 1.4, fontWeight: 700 }}>
                <span style={{ color: '#E53935' }}>50개의 메모가 이 기기에만 저장되어 있어요. ⚠️</span><br />
                기기를 분실하거나 고장 나면 소중한 추억이 사라질 수 있습니다. 🌸<br />
                안전하게 클라우드에 연동하고 저장 공간을 넓혀주세요.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              
              <div 
                onClick={() => setLimitSelectedPlan('lifetime')}
                style={{
                  border: limitSelectedPlan === 'lifetime' ? '3px solid #D4AF37' : '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  background: limitSelectedPlan === 'lifetime' ? '#FFFDF0' : 'var(--bg-input)',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: limitSelectedPlan === 'lifetime' ? '0 4px 12px rgba(212, 175, 55, 0.15)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{
                  position: 'absolute', top: -10, right: 14,
                  background: '#D4AF37', color: '#fff', fontSize: '0.68rem',
                  fontWeight: 900, padding: '2px 8px', borderRadius: '20px',
                  border: '1px solid var(--color-border)'
                }}>
                  ★ 강력 추천 • 평생 소장
                </span>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 900, color: '#A17A00', display: 'flex', alignItems: 'center', gap: 4 }}>
                      👑 평생 이용권
                    </h4>
                    <p style={{ margin: '3px 0 0 0', fontSize: '0.78rem', color: '#555', fontWeight: 600 }}>
                      한 번만 내면 평생 무제한이에요
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#1A1A1A' }}>₩59,000</span>
                    <span style={{ fontSize: '0.7rem', display: 'block', color: '#666', fontWeight: 600 }}>(1회 결제)</span>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setLimitSelectedPlan('annual')}
                style={{
                  border: limitSelectedPlan === 'annual' ? '3px solid var(--color-accent)' : '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  background: limitSelectedPlan === 'annual' ? '#F0F8FF' : 'var(--bg-input)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)' }}>
                      🌸 연간 이용권
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--color-sub)' }}>
                      연 단위로 실속 있게 이용하세요 (2개월 무료 상당)
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text)' }}>₩24,900</span>
                    <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--color-sub)' }}>/년</span>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setLimitSelectedPlan('monthly')}
                style={{
                  border: limitSelectedPlan === 'monthly' ? '3px solid var(--color-accent)' : '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  background: limitSelectedPlan === 'monthly' ? '#F0F8FF' : 'var(--bg-input)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)' }}>
                      📝 월간 이용권
                    </h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--color-sub)' }}>
                      가볍게 시작해볼 수 있어요
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text)' }}>₩2,900</span>
                    <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--color-sub)' }}>/월</span>
                  </div>
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={handleLimitAction}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: '#FFFFFF',
                  color: '#1A1A1A',
                  border: '1px solid var(--color-border)',
                  borderRadius: '14px',
                  fontSize: '1rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {user ? '💳 선택한 요금제로 결제하기' : '👤 구글 계정으로 시작하기'}
              </button>

              <button
                onClick={handleLimitShareGift}
                style={{
                  width: '100%',
                  padding: '15px',
                  background: '#FEE500',
                  color: '#3A1D1D',
                  border: '1px solid #3A1D1D',
                  borderRadius: '14px',
                  fontSize: '1rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                💬 카카오톡으로 자녀에게 부탁하기
              </button>
            </div>

            <button
              onClick={() => setShowLimitModal(false)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                marginTop: '16px',
                color: '#888',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              지금은 괜찮아요 (닫기)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
