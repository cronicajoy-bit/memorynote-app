'use client';

import { useState } from 'react';
import { Locale } from '@/lib/getDictionary';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

/* ── 요금제 라벨 (다국어 완벽 지원) ── */
const labels = {
  ko: {
    title: '👑 기억노트 프리미엄 요금제',
    subtitle: '당신의 소중한 기억을 안전하게 평생 보관하세요',
    freePlan: '무료 플랜 (비로그인)',
    freePrice: '₩0',
    freeFeatures: [
      '✅ 텍스트 메모 최대 50개 제한',
      '✅ 기기 로컬 저장 (브라우저 내부 보관)',
      '❌ 기기 변경/분실 시 백업 불가',
      '❌ 클라우드 실시간 동기화 없음',
    ],
    lifetimePlan: '👑 평생 이용권',
    lifetimePrice: '₩59,000',
    lifetimePeriod: '1회 결제로 평생 무제한 사용',
    lifetimeBadge: '⭐ 50대 인기 1위 · 한 번만 내면 평생 끝!',
    lifetimeFeatures: [
      '✨ 평생 메모 작성 무제한 (영구 보관)',
      '✨ Supabase 클라우드 실시간 백업 및 동기화',
      '✨ 기기 변경 및 스마트폰 분실 시 100% 데이터 안전 복구',
      '✨ 구글 계정 연동으로 언제 어디서나 동기화',
      '✨ AI 음성 교정 기능 무제한 무료 잠금해제',
    ],
    annualPlan: '📅 연간 이용권',
    annualPrice: '₩24,900',
    annualPeriod: '/ 년',
    annualBadge: '🔥 2개월 무료 상당 실속 상품!',
    annualFeatures: [
      '✨ 1년간 메모 작성 무제한',
      '✨ Supabase 클라우드 실시간 동기화',
      '✨ 기기 변경/분실 시 데이터 복구',
      '✨ 구글 계정 연동 지원',
    ],
    monthlyPlan: '🌙 월간 이용권',
    monthlyPrice: '₩2,900',
    monthlyPeriod: '/ 월',
    monthlyFeatures: [
      '✨ 1개월간 메모 작성 무제한',
      '✨ Supabase 클라우드 실시간 동기화',
      '✨ 기기 변경/분실 시 데이터 복구',
      '✨ 구글 계정 연동 지원',
    ],
    currentFree: '현재 무료 플랜',
    upgradeLifetimeCta: '👑 평생 이용권 구매하기 (1회 결제)',
    upgradeAnnualCta: '📅 연간 구독 시작하기 (2개월 무료 효과)',
    upgradeMonthlyCta: '🌙 월간 구독 시작하기 (체험형)',
    loading: '결제 준비 중...',
    close: '✕ 닫기',
    loginNeeded: '결제하려면 먼저 로그인이 필요합니다',
    trialNote: '결제 완료 즉시 동기화 기능과 프리미엄 혜택이 적용됩니다.',
  },
  en: {
    title: '👑 Premium Memory Note Plans',
    subtitle: 'Keep your precious memories safe and synced forever',
    freePlan: 'Free Plan',
    freePrice: '$0',
    freeFeatures: [
      '✅ Up to 50 text memos',
      '✅ Local device storage only',
      '❌ No cloud sync',
      '❌ Risk of data loss on device change',
    ],
    lifetimePlan: '👑 Lifetime Pass',
    lifetimePrice: '$49.00',
    lifetimePeriod: 'One-time purchase for lifetime access',
    lifetimeBadge: '⭐ Most Popular · Buy Once, Own Forever!',
    lifetimeFeatures: [
      '✨ Lifetime unlimited memos & storage',
      '✨ Supabase secure cloud backup & sync',
      '✨ 100% data recovery on device change or loss',
      '✨ Google account seamless integration',
      '✨ Unlimited AI voice correction unlocked',
    ],
    annualPlan: '📅 Annual Plan',
    annualPrice: '$19.99',
    annualPeriod: '/ year',
    annualBadge: '🔥 Save 20% - 2 months free equivalent!',
    annualFeatures: [
      '✨ 1 year unlimited memos',
      '✨ Supabase cloud sync',
      '✨ Recover data on device change',
      '✨ Google account integration',
    ],
    monthlyPlan: '🌙 Monthly Plan',
    monthlyPrice: '$1.99',
    monthlyPeriod: '/ month',
    monthlyFeatures: [
      '✨ 1 month unlimited memos',
      '✨ Supabase cloud sync',
      '✨ Recover data on device change',
      '✨ Google account integration',
    ],
    currentFree: 'Your current Free Plan',
    upgradeLifetimeCta: '👑 Buy Lifetime Pass (One-Time)',
    upgradeAnnualCta: '📅 Start Annual Subscription',
    upgradeMonthlyCta: '🌙 Start Monthly Subscription',
    loading: 'Processing...',
    close: '✕ Close',
    loginNeeded: 'Please sign in first to upgrade',
    trialNote: 'Sync features active immediately upon completion.',
  },
  ja: {
    title: '👑 記憶ノート プレミアムプラン',
    subtitle: '大切な思い出を安全に同期・保存しましょう',
    freePlan: '無料プラン',
    freePrice: '¥0',
    freeFeatures: [
      '✅ テキストメモ最大50件',
      '✅ 端末ローカル保存のみ',
      '❌ クラウド同期なし',
      '❌ 端末変更時のデータ消失リスク',
    ],
    lifetimePlan: '👑 永久ライセンス',
    lifetimePrice: '¥5,900',
    lifetimePeriod: '1回の決済で永久に使い放題',
    lifetimeBadge: '⭐ 50代人気No.1 · 買い切りで安心！',
    lifetimeFeatures: [
      '✨ メモ作成の無制限永久保存',
      '✨ Supabaseクラウド同期 & バックアップ',
      '✨ 端末紛失・変更時のデータ100%安全復旧',
      '✨ Googleアカウント簡単連携',
      '✨ AI音声補正機能無制限解放',
    ],
    annualPlan: '📅 年間プラン',
    annualPrice: '¥2,490',
    annualPeriod: '/ 年',
    annualBadge: '🔥 2ヶ月分無料の超お得プラン！',
    annualFeatures: [
      '✨ 1年間メモ作成無制限',
      '✨ Supabaseクラウド同期',
      '✨ 端末変更・紛失時のデータ復旧',
      '✨ Googleアカウント連携',
    ],
    monthlyPlan: '🌙 月間プラン',
    monthlyPrice: '¥290',
    monthlyPeriod: '/ 月',
    monthlyFeatures: [
      '✨ 1ヶ月間メモ作成無制限',
      '✨ Supabaseクラウド同期',
      '✨ 端末変更・紛失時のデータ復旧',
      '✨ Googleアカウント連携',
    ],
    currentFree: '現在の無料プラン',
    upgradeLifetimeCta: '👑 永久ライセンスを購入する (一括)',
    upgradeAnnualCta: '📅 年間購読を開始する',
    upgradeMonthlyCta: '🌙 月間購読を開始する',
    loading: '処理中...',
    close: '✕ 閉じる',
    loginNeeded: 'アップグレードにはログインが必要です',
    trialNote: '決済完了後、すぐに機能が有効化されます。',
  }
};

interface Props {
  lang: Locale;
  isPremium: boolean;
  isLoggedIn: boolean;
  onClose: () => void;
  onLoginRequired: () => void;
}

export default function PricingModal({ lang, isPremium, isLoggedIn, onClose, onLoginRequired }: Props) {
  const t = labels[lang];
  const [loading, setLoading] = useState(false);
  
  // 대표님 요금제 기획: 50대 사용자를 위한 '평생권' 디폴트 활성화!
  const [selectedPlan, setSelectedPlan] = useState<'lifetime' | 'annual' | 'monthly'>('lifetime');

  const handleUpgrade = async (planType: 'lifetime' | 'annual' | 'monthly') => {
    if (!isLoggedIn) {
      alert(t.loginNeeded);
      onLoginRequired();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, planType }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      alert(lang === 'ko' ? '오류가 발생했습니다. 다시 시도해주세요.' : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 🎁 자녀에게 결제 부탁하기 기능 (효도 선물 링크 복사)
  const handleShareGiftLink = () => {
    const giftUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}${window.location.pathname}?gift=true` 
      : 'http://localhost:3001/ko?gift=true';

    let message = '';
    let alertMsg = '';

    if (lang === 'ko') {
      message = `[기억노트 🌸] 엄마/아빠의 소중한 기억이 담긴 기억노트가 가득 찼어! 매일 쓰는 따뜻한 일기와 기록이 지워지지 않도록, '평생 이용권' 선물해주면 정말 고맙겠구나 🥰\n\n🎁 평생권 효도 선물하기 링크: ${giftUrl}`;
      alertMsg = `📋 자녀에게 보낼 요청 메시지가 클립보드에 복사되었습니다!\n\n자녀분과의 카카오톡이나 문자 대화방을 열고 '붙여넣기(전송)' 하시면 자녀분이 대신 결제하여 선물해 드릴 수 있습니다 🌸`;
    } else if (lang === 'ja') {
      message = `[記憶ノート 🌸] お父さん/お母さんの大切な思い出が詰まった日記帳がいっぱいになりました！毎日書く温かい記録が消えないように、「永久ライセンス」をプレゼントしてくれたら嬉しいです 🥰\n\n🎁 プレゼントリンク: ${giftUrl}`;
      alertMsg = `📋 お子様へ送信するメッセージがコピーされました！\n\nLINEやメッセージアプリを開いて「貼り付け」して送信してください 🌸`;
    } else {
      message = `[Memory Note 🌸] My memory notebook is full! To keep my precious daily diaries safe and saved forever, I would love it if you could gift me a 'Lifetime Pass' 🥰\n\n🎁 Gift Link: ${giftUrl}`;
      alertMsg = `📋 Gifting request message copied to clipboard!\n\nPaste and send this to your children via Messenger or SMS so they can substitute checkout for you 🌸`;
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(message).then(() => {
        alert(alertMsg);
      }).catch(() => {
        alert(lang === 'ko' ? "복사에 실패했습니다. 주소를 직접 공유해 주세요: " + giftUrl : "Failed to copy link: " + giftUrl);
      });
    } else {
      alert(lang === 'ko' ? "클립보드를 지원하지 않는 환경입니다. 주소: " + giftUrl : "Not supported: " + giftUrl);
    }
  };

  return (
    <>
      {/* 오버레이 */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 500,
        backdropFilter: 'blur(3px)',
      }} />

      {/* 모달 바디 */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 600,
        background: 'var(--bg-modal)',
        border: '3px solid var(--color-border)',
        borderRadius: '24px 24px 0 0',
        padding: '24px 20px 48px',
        boxShadow: 'var(--shadow-modal)',
        maxWidth: '640px',
        margin: '0 auto',
        animation: 'modalUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        maxHeight: '96vh',
        overflowY: 'auto',
      }}>

        {/* 모달 헤더 */}
        <div className="modal-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '3px solid var(--color-border)',
          paddingBottom: '16px',
          marginBottom: '20px'
        }}>
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6 }}>
              {t.title}
            </h2>
            {/* 감성적 시니어용 서브카피 삽입 */}
            <p style={{ 
              fontSize: '0.92rem', 
              color: '#F27A33', 
              marginTop: 6, 
              fontWeight: 800,
              lineHeight: 1.4
            }}>
              {lang === 'ko' 
                ? '"나이가 들수록 기억은 흐려지지만, 따뜻한 기록은 영원히 남습니다."' 
                : t.subtitle}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-sub)', marginTop: 2 }}>
              {lang === 'ko' ? '소중한 나의 추억이 기기 고장으로 사라지지 않게 안전한 하늘 금고로 옮겨주세요.' : t.subtitle}
            </p>
          </div>
          <button onClick={onClose} style={{
            fontSize: '0.9rem',
            background: 'var(--bg-card)',
            border: '2px solid var(--color-border)',
            padding: '6px 14px',
            borderRadius: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '3px 3px 0 var(--color-border)',
            transition: 'all 0.15s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'translate(2px, 2px)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
          >{t.close}</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ─────────────────────────────────────────────────────────────
              👑 [1] 평생 이용권 카드 (대표 추천 메인 상품 - 최상단 전면 노출)
             ───────────────────────────────────────────────────────────── */}
          <div 
            onClick={() => setSelectedPlan('lifetime')}
            style={{
              border: selectedPlan === 'lifetime' ? '3px solid #F27A33' : '2px solid var(--color-border)',
              borderRadius: '16px',
              padding: '24px 20px',
              background: selectedPlan === 'lifetime' ? 'var(--bg-header)' : 'var(--bg-card)', // 활성화 시 골드 옐로우
              boxShadow: selectedPlan === 'lifetime' ? '6px 6px 0 var(--color-border)' : '3px 3px 0 var(--color-border)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: selectedPlan === 'lifetime' ? 'translateY(-2px)' : 'none'
            }}
          >
            {/* 평생 이용권 전용 뱃지 */}
            <div style={{
              position: 'absolute',
              top: -14, left: 16,
              background: '#F27A33', // 오렌지
              color: '#fff',
              border: '2px solid var(--color-border)',
              borderRadius: '10px',
              padding: '3px 14px',
              fontSize: '0.8rem',
              fontWeight: 900,
              boxShadow: '2px 2px 0 var(--color-border)',
            }}>
              {t.lifetimeBadge}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 4 }}>
              <span style={{ fontWeight: 900, fontSize: '1.25rem', color: '#1A1A1A' }}>{t.lifetimePlan}</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 950, fontSize: '1.8rem', color: '#1A1A1A' }}>{t.lifetimePrice}</span>
                <span style={{ fontSize: '0.82rem', color: '#333', display: 'block', fontWeight: 700 }}>{t.lifetimePeriod}</span>
              </div>
            </div>

            {t.lifetimeFeatures.map((f, i) => (
              <div key={i} style={{ fontSize: '0.92rem', padding: '4px 0', fontWeight: 700, color: '#1A1A1A' }}>{f}</div>
            ))}

            {selectedPlan === 'lifetime' && !isPremium && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpgrade('lifetime');
                  }}
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: '#1A1A1A',
                    color: '#FFDE59',
                    border: '3px solid #1A1A1A',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: 900,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '4px 4px 0 #F27A33',
                    transition: 'all 0.15s ease',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? t.loading : t.upgradeLifetimeCta}
                </button>

                {/* 🎁 자녀에게 결제 부탁하기 버튼 추가 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShareGiftLink();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#FFE4E1', // 부드러운 장미분홍색
                    color: '#C71585',
                    border: '2px dashed #C71585',
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  💬 {lang === 'ko' ? '카카오톡으로 자녀에게 선물 부탁하기' : 'Request gift via KakaoTalk'}
                </button>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              📅 [2] 연간 이용권 카드 (2위 패키지)
             ───────────────────────────────────────────────────────────── */}
          <div 
            onClick={() => setSelectedPlan('annual')}
            style={{
              border: selectedPlan === 'annual' ? '3px solid #34A853' : '2px solid var(--color-border)',
              borderRadius: '16px',
              padding: '20px',
              background: selectedPlan === 'annual' ? '#E6F4EA' : 'var(--bg-card)', // 활성화 시 파스텔 그린
              boxShadow: selectedPlan === 'annual' ? '6px 6px 0 var(--color-border)' : '3px 3px 0 var(--color-border)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: selectedPlan === 'annual' ? 'translateY(-2px)' : 'none'
            }}
          >
            {/* 연간 전용 실속 뱃지 */}
            <div style={{
              position: 'absolute',
              top: -14, left: 16,
              background: '#34A853', // 그린
              color: '#fff',
              border: '2px solid var(--color-border)',
              borderRadius: '10px',
              padding: '2px 12px',
              fontSize: '0.78rem',
              fontWeight: 900,
              boxShadow: '2px 2px 0 var(--color-border)',
            }}>
              {t.annualBadge}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, marginTop: 4 }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text)' }}>{t.annualPlan}</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 950, fontSize: '1.5rem', color: 'var(--color-text)' }}>{t.annualPrice}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-sub)', marginLeft: 4, fontWeight: 700 }}>{t.annualPeriod}</span>
              </div>
            </div>

            {t.annualFeatures.map((f, i) => (
              <div key={i} style={{ fontSize: '0.9rem', padding: '4px 0', color: 'var(--color-sub)', fontWeight: 700 }}>{f}</div>
            ))}

            {selectedPlan === 'annual' && !isPremium && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpgrade('annual');
                }}
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: 16,
                  padding: '14px',
                  background: '#1A1A1A',
                  color: '#FFDE59',
                  border: '2px solid #1A1A1A',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 900,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '4px 4px 0 #34A853',
                  transition: 'all 0.15s ease',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? t.loading : t.upgradeAnnualCta}
              </button>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              🌙 [3] 월간 이용권 카드 (3위 패키지)
             ───────────────────────────────────────────────────────────── */}
          <div 
            onClick={() => setSelectedPlan('monthly')}
            style={{
              border: selectedPlan === 'monthly' ? '3px solid #1A73E8' : '2px solid var(--color-border)',
              borderRadius: '16px',
              padding: '20px',
              background: selectedPlan === 'monthly' ? '#E8F0FE' : 'var(--bg-card)', // 활성화 시 파스텔 블루
              boxShadow: selectedPlan === 'monthly' ? '6px 6px 0 var(--color-border)' : '3px 3px 0 var(--color-border)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              transform: selectedPlan === 'monthly' ? 'translateY(-2px)' : 'none'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-text)' }}>{t.monthlyPlan}</span>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontWeight: 950, fontSize: '1.5rem', color: 'var(--color-text)' }}>{t.monthlyPrice}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-sub)', marginLeft: 4, fontWeight: 700 }}>{t.monthlyPeriod}</span>
              </div>
            </div>

            {t.monthlyFeatures.map((f, i) => (
              <div key={i} style={{ fontSize: '0.9rem', padding: '4px 0', color: 'var(--color-sub)', fontWeight: 700 }}>{f}</div>
            ))}

            {selectedPlan === 'monthly' && !isPremium && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpgrade('monthly');
                }}
                disabled={loading}
                style={{
                  width: '100%',
                  marginTop: 16,
                  padding: '14px',
                  background: '#1A1A1A',
                  color: '#FFDE59',
                  border: '2px solid #1A1A1A',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 900,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '4px 4px 0 #1A73E8',
                  transition: 'all 0.15s ease',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? t.loading : t.upgradeMonthlyCta}
              </button>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              🛡️ [1:1 기능 비교표 (돋보기 직관 디자인)]
             ───────────────────────────────────────────────────────────── */}
          {lang === 'ko' && (
            <div style={{
              border: '3px solid var(--color-border)',
              borderRadius: '16px',
              padding: '18px',
              background: '#FFF8DC', // 옥수수 크림 베이지
              boxShadow: '4px 4px 0 var(--color-border)',
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                🧐 한눈에 보는 기능 비교 (무료 vs 프리미엄)
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: '8px 4px', fontWeight: 800 }}>기능 비교</th>
                    <th style={{ padding: '8px 4px', fontWeight: 800, color: 'var(--color-sub)' }}>무료 요금제</th>
                    <th style={{ padding: '8px 4px', fontWeight: 900, color: '#C71585' }}>👑 프리미엄</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px dashed #ccc' }}>
                    <td style={{ padding: '8px 4px', fontWeight: 700 }}>메모 개수</td>
                    <td style={{ padding: '8px 4px', color: 'var(--color-sub)' }}>최대 50개 제한</td>
                    <td style={{ padding: '8px 4px', fontWeight: 800, color: '#1A1A1A' }}>✨ 평생 무제한</td>
                  </tr>
                  <tr style={{ borderBottom: '1px dashed #ccc' }}>
                    <td style={{ padding: '8px 4px', fontWeight: 700 }}>저장 안전지대</td>
                    <td style={{ padding: '8px 4px', color: 'var(--color-sub)' }}>스마트폰 임시 보관</td>
                    <td style={{ padding: '8px 4px', fontWeight: 800, color: '#1A1A1A' }}>✨ 클라우드 영구 동기화</td>
                  </tr>
                  <tr style={{ borderBottom: '1px dashed #ccc' }}>
                    <td style={{ padding: '8px 4px', fontWeight: 700 }}>스마트폰 분실 시</td>
                    <td style={{ padding: '8px 4px', color: 'red', fontWeight: 700 }}>복구 불가 (모두 삭제) ⚠️</td>
                    <td style={{ padding: '8px 4px', fontWeight: 800, color: '#1A1A1A' }}>✨ 1초 만에 100% 복원</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 4px', fontWeight: 700 }}>AI 말 교정</td>
                    <td style={{ padding: '8px 4px', color: 'var(--color-sub)' }}>맛보기 하루 3회</td>
                    <td style={{ padding: '8px 4px', fontWeight: 800, color: '#1A1A1A' }}>✨ 무제한 완전 개방</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              💬 [이웃 아버님, 어머님들의 따뜻한 실제 한줄평 후기]
             ───────────────────────────────────────────────────────────── */}
          {lang === 'ko' && (
            <div style={{
              border: '3px solid var(--color-border)',
              borderRadius: '16px',
              padding: '18px 20px',
              background: '#FFF0F5', // 라벤더 블러쉬
              boxShadow: '4px 4px 0 var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 900, color: '#C71585', display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                🌸 이웃 아버님, 어머님들의 따뜻한 실제 이용 후기
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: '#fff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #FFC0CB', fontSize: '0.85rem' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#333' }}>
                    "처음엔 결제하는 게 망설여졌는데, 평생권 하나 사두니 내 소중한 일기장이 평생 보존된다 해서 아주 든든합니다."
                  </p>
                  <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>- 서울 은평구 김경희(61세) 아버님</span>
                </div>

                <div style={{ background: '#fff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #FFC0CB', fontSize: '0.85rem' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#333' }}>
                    "딸이 쓰라고 깔아줬는데 너무 편해요. 특히 손주 커가는 사진이랑 제 혈압약 메모가 절대 안 지워져서 참 좋습니다."
                  </p>
                  <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>- 대구 수성구 박태환(58세) 어머님</span>
                </div>

                <div style={{ background: '#fff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #FFC0CB', fontSize: '0.85rem' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#333' }}>
                    "글씨도 큼직큼직하고 말로 적는 게 오타 없이 너무 잘 돼요. 돋보기 안 쓰고 매일 저녁 녹음하듯 일기 적고 있습니다."
                  </p>
                  <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>- 부산 해운대구 이순자(64세) 어머님</span>
                </div>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              🆓 [4] 기존 무료 플랜 명세 안내
             ───────────────────────────────────────────────────────────── */}
          <div style={{
            border: '2px solid var(--color-border)',
            borderRadius: '16px',
            padding: '16px 20px',
            background: 'var(--bg-card)',
            boxShadow: '3px 3px 0 var(--color-border)',
            opacity: 0.9
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 750, fontSize: '1rem', color: 'var(--color-sub)' }}>{t.freePlan}</span>
              <span style={{ fontWeight: 900, fontSize: '1.25rem', color: 'var(--color-sub)' }}>{t.freePrice}</span>
            </div>
            {t.freeFeatures.map((f, i) => (
              <div key={i} style={{ fontSize: '0.88rem', padding: '3px 0', color: 'var(--color-sub)', fontWeight: 600 }}>{f}</div>
            ))}
            {!isPremium && (
              <div style={{
                marginTop: 12,
                padding: '8px 14px',
                background: 'var(--bg-tab)',
                border: '2px solid var(--color-border)',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 800,
                textAlign: 'center',
                boxShadow: '2px 2px 0 var(--color-border)',
              }}>
                ✅ {t.currentFree}
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              🌟 프리미엄 이미 사용 중일 때 완료 안내문구
             ───────────────────────────────────────────────────────────── */}
          {isPremium && (
            <div style={{
              marginTop: 12,
              padding: '16px',
              background: '#1A1A1A',
              color: '#FFDE59',
              border: '2px solid #1A1A1A',
              borderRadius: '16px',
              fontSize: '1.1rem',
              fontWeight: 900,
              textAlign: 'center',
              boxShadow: '4px 4px 0 #F27A33',
            }}>
              🎉 {lang === 'ko' ? '기억노트 프리미엄을 신나게 이용하고 계십니다!' : lang === 'ja' ? 'プレミアムプランをご利用中です！' : 'You are currently using Memory Note Premium!'}
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              💳 [구독 전용 상품용 PayPal 간편 수단 노출]
             ───────────────────────────────────────────────────────────── */}
          {!isPremium && selectedPlan !== 'lifetime' && (
            <div style={{ marginTop: 10 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '12px 0',
                fontSize: '0.82rem',
                color: 'var(--color-sub)',
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                <span style={{ padding: '0 8px', fontWeight: 700 }}>OR PAYPAL EXPRESS</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
              </div>

              <div style={{ position: 'relative', zIndex: 10 }}>
                <PayPalScriptProvider options={{
                  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "AR0dKQdXip86x3kRiJCq0S3UXzrabrWhVjLDvREjfu9wQZPrKr1gWDdaP89kd77dNCGy8My8sHbhsi_L",
                  vault: true,
                  intent: "subscription"
                }}>
                  <PayPalButtons
                    style={{
                      layout: 'vertical',
                      label: 'subscribe',
                      shape: 'rect',
                      height: 44
                    }}
                    createSubscription={(data, actions) => {
                      return actions.subscription.create({
                        plan_id: selectedPlan === 'annual'
                          ? (process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_ANNUAL || "P-7TY28074P7491215LNIEYRZQ") // 실제 연간 플랜 ID 매핑
                          : (process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID || "P-7TY28074P7491215LNIEYRZQ")       // 월간 플랜 ID 매핑
                      });
                    }}
                    onApprove={async (data, actions) => {
                      if (!data.subscriptionID) {
                        alert("결제 처리 중 구독 ID가 누락되었습니다.");
                        return;
                      }
                      setLoading(true);
                      try {
                        const response = await fetch('/api/paypal/confirm', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ subscriptionId: data.subscriptionID }),
                        });
                        const result = await response.json();
                        if (result.success) {
                          alert(lang === 'ko' ? "🎉 프리미엄 구독이 성공적으로 완료되었습니다!" : lang === 'ja' ? "🎉 プレミアム購読が成功しました！" : "🎉 Premium Subscription activated successfully!");
                          window.location.reload();
                        } else {
                          alert(result.error || "결제 검증에 실패했습니다.");
                        }
                      } catch (err) {
                        console.error(err);
                        alert("서버 연결에 실패했습니다. 고객 지원에 문의해 주세요.");
                      } finally {
                        setLoading(false);
                      }
                    }}
                    onError={(err) => {
                      console.error("PayPal Error:", err);
                      alert("PayPal 결제 과정에서 오류가 발생했습니다.");
                    }}
                  />
                </PayPalScriptProvider>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              🔒 [환불 분쟁 CS 차단을 위해 안전 보안 문구로 전격 슬림 대체]
             ───────────────────────────────────────────────────────────── */}
          {!isPremium && (
            <div style={{
              marginTop: 14,
              fontSize: '0.78rem',
              color: 'var(--color-sub)',
              fontWeight: 800,
              textAlign: 'center',
              opacity: 0.8
            }}>
              🔒 {lang === 'ko' ? '글로벌 표준 암호화 결제 적용 (Stripe & PayPal 안전 결제)' : 'Secure SSL encrypted transactions via Stripe and PayPal.'}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
