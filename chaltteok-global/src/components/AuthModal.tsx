'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Locale } from '@/lib/getDictionary';

/* ── 언어별 라벨 ── */
const labels = {
  ko: {
    title: '📝 기억노트 시작하기',
    subtitle: '내 메모를 어디서나 안전하게 보관하세요',
    google: '🔵 구글(Google)로 계속하기',
    kakao: '💛 카카오(Kakao)로 계속하기',
    or: '또는 이메일로',
    email: '이메일 주소',
    password: '비밀번호',
    loginBtn: '로그인',
    signupBtn: '회원가입',
    switchToLogin: '이미 계정이 있으신가요? 로그인',
    switchToSignup: '처음이신가요? 회원가입',
    skipGuest: '지금은 로그인 없이 사용하기 (기기에만 저장)',
    sending: '전송 중...',
    checkEmail: '📧 이메일을 확인해 주세요! 인증 링크를 보냈습니다.',
    error: '오류가 발생했습니다. 다시 시도해주세요.',
    free: '✅ 무료 • ✅ 크로스 디바이스 동기화 • ✅ 클라우드 백업',
  },
  en: {
    title: '📝 Start Memory Note',
    subtitle: 'Keep your memos safe and synced everywhere',
    google: '🔵 Continue with Google',
    kakao: '💛 Continue with Kakao',
    or: 'Or sign in with email',
    email: 'Email address',
    password: 'Password',
    loginBtn: 'Sign In',
    signupBtn: 'Sign Up',
    switchToLogin: 'Already have an account? Sign in',
    switchToSignup: "Don't have an account? Sign up",
    skipGuest: 'Continue without account (stored on this device only)',
    sending: 'Sending...',
    checkEmail: '📧 Check your email! We sent a confirmation link.',
    error: 'Something went wrong. Please try again.',
    free: '✅ Free • ✅ Cross-device sync • ✅ Cloud backup',
  },
  ja: {
    title: '📝 記憶ノートを始める',
    subtitle: 'メモをどこでも安全に保管しましょう',
    google: '🔵 Googleで続ける',
    kakao: '💛 Kakaoで続ける',
    or: 'またはメールアドレスで',
    email: 'メールアドレス',
    password: 'パスワード',
    loginBtn: 'ログイン',
    signupBtn: '新規登録',
    switchToLogin: 'アカウントをお持ちの方はこちら',
    switchToSignup: 'アカウントをお持ちでない方はこちら',
    skipGuest: 'ログインなしで使う（このデバイスのみ保存）',
    sending: '送信中...',
    checkEmail: '📧 メールをご確認ください！確認リンクを送りました。',
    error: 'エラーが発生しました。もう一度お試しください。',
    free: '✅ 無料 • ✅ クロ스デバイス同期 • ✅ クラウドバックアップ',
  },
};

/* ── Props ── */
interface Props {
  lang: Locale;
  onClose: () => void;
  onGuestMode: () => void;
}

/* ── 컴포넌트 ── */
export default function AuthModal({ lang, onClose, onGuestMode }: Props) {
  const t = labels[lang];
  const supabase = createClient();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  /* 구글 OAuth */
  const handleGoogle = async () => {
    setLoading(true);
    setMessage('');
    // 이메일 로그인을 우선 권장하며 설정을 안내하는 친절한 팝업
    const confirmGoogle = window.confirm(
      lang === 'ko' 
        ? '💡 구글 로그인을 사용하려면 Supabase 대시보드 및 Google Cloud Console 연동 설정이 필요합니다.\n\n지금은 "이메일 로그인/회원가입"을 통해 즉시 모든 기능을 테스트하실 수 있습니다. 이메일로 진행해 보시겠습니까?' 
        : lang === 'ja'
        ? '💡 Googleログインを使用するには、SupabaseとGoogle Cloudの設定が必要です。\n\n現在は「メールアドレス」で即時テストが可能です。メールアドレスで進めますか？'
        : '💡 Google Login requires setting up Google Cloud Console and Supabase dashboard.\n\nCurrently, you can test everything using "Email Sign In/Up". Would you like to use email instead?'
    );
    if (!confirmGoogle) {
      setLoading(false);
      return;
    }
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?lang=${lang}`,
      },
    });
    if (error) {
      setMessage(
        lang === 'ko'
          ? '❌ 구글 프로바이더가 활성화되지 않았습니다. Supabase 대시보드 -> Auth -> Providers에서 Google을 활성화해주세요!'
          : error.message
      );
      setIsError(true);
      setLoading(false);
    }
  };

  /* 카카오 OAuth */
  const handleKakao = async () => {
    setLoading(true);
    setMessage('');
    const confirmKakao = window.confirm(
      lang === 'ko' 
        ? '💡 카카오 로그인을 사용하려면 Supabase 대시보드 및 Kakao Developers 연동 설정이 필요합니다.\n\n지금은 "이메일 로그인/회원가입"을 통해 즉시 모든 기능을 테스트하실 수 있습니다. 이메일로 진행해 보시겠습니까?' 
        : lang === 'ja'
        ? '💡 Kakaoログインを使用するには、SupabaseとKakao Developersの設定が必要です。\n\n現在は「メールアドレス」で即時テストが可能です。メールアドレスで進めますか？'
        : '💡 Kakao Login requires setting up Kakao Developers and Supabase dashboard.\n\nCurrently, you can test everything using "Email Sign In/Up". Would you like to use email instead?'
    );
    if (!confirmKakao) {
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?lang=${lang}`,
      },
    });
    if (error) {
      setMessage(
        lang === 'ko'
          ? '❌ 카카오 프로바이더가 활성화되지 않았습니다. Supabase 대시보드 -> Auth -> Providers에서 Kakao를 활성화해주세요!'
          : error.message
      );
      setIsError(true);
      setLoading(false);
    }
  };

  /* 이메일 로그인/가입 */
  const handleEmail = async () => {
    setLoading(true);
    setMessage('');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/api/auth/callback?lang=${lang}` },
        });
        if (error) throw error;
        if (data?.user) {
          setMessage(lang === 'ko' ? '🎉 회원가입 성공! 즉시 로그인되었습니다.' : '🎉 Signup success!');
          setIsError(false);
          // 1.5초 후 닫기
          setTimeout(() => onClose(), 1500);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (err: any) {
      console.error('Auth error details:', err);
      setMessage(err.message || t.error);
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 오버레이 */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 500,
        }}
      />

      {/* 모달 */}
      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 600,
        background: 'var(--bg-modal)',
        border: '2px solid var(--color-border)',
        borderRadius: 'var(--radius) var(--radius) 0 0',
        padding: '28px 22px 44px',
        boxShadow: 'var(--shadow-modal)',
        maxWidth: '640px',
        margin: '0 auto',
        animation: 'modalUp 0.25s ease',
        maxHeight: '92vh',
        overflowY: 'auto',
      }}>

        {/* 헤더 */}
        <div className="modal-header" style={{ marginBottom: 6 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{t.title}</h2>
          <button onClick={onClose} style={{ fontSize: '1.4rem', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-sub)', marginBottom: 24 }}>{t.subtitle}</p>

        {/* 무료 혜택 배너 */}
        <div style={{
          background: 'var(--bg-header)',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius)',
          padding: '10px 14px',
          fontSize: '0.78rem',
          fontWeight: 600,
          marginBottom: 20,
          boxShadow: '2px 2px 0 var(--color-border)',
        }}>
          {t.free}
        </div>

        {/* 소셜 로그인 버튼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          <button
            onClick={handleGoogle}
            disabled={loading}
            style={{
              padding: '14px',
              background: '#fff',
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '2px 2px 0 var(--color-border)',
              transition: 'all 0.15s ease',
            }}
          >
            {t.google}
          </button>

          {/* 카카오는 한국어 사용자에게만 기본 노출 */}
          {lang === 'ko' && (
            <button
              onClick={handleKakao}
              disabled={loading}
              style={{
                padding: '14px',
                background: '#FEE500',
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '2px 2px 0 var(--color-border)',
              }}
            >
              {t.kakao}
            </button>
          )}
        </div>

        {/* 구분선 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 2, background: 'var(--color-border)' }} />
          <span style={{ fontSize: '0.78rem', color: 'var(--color-sub)', fontWeight: 600 }}>{t.or}</span>
          <div style={{ flex: 1, height: 2, background: 'var(--color-border)' }} />
        </div>

        {/* 이메일/비밀번호 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <input
            type="email"
            placeholder={t.email}
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              padding: '12px 14px',
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              fontSize: '1rem',
              background: 'var(--bg-input)',
              boxShadow: '2px 2px 0 var(--color-border)',
              outline: 'none',
            }}
          />
          <input
            type="password"
            placeholder={t.password}
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEmail()}
            style={{
              padding: '12px 14px',
              border: '2px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              fontSize: '1rem',
              background: 'var(--bg-input)',
              boxShadow: '2px 2px 0 var(--color-border)',
              outline: 'none',
            }}
          />
        </div>

        {/* 메시지 */}
        {message && (
          <div style={{
            padding: '10px 14px',
            background: isError ? '#FFF0F0' : '#F0FFF4',
            border: `2px solid ${isError ? '#E57373' : '#81C784'}`,
            borderRadius: 'var(--radius)',
            fontSize: '0.85rem',
            marginBottom: 12,
          }}>
            {message}
          </div>
        )}

        {/* 이메일 버튼 */}
        <button
          onClick={handleEmail}
          disabled={loading || !email || !password}
          className="btn-primary"
          style={{ width: '100%', marginBottom: 10 }}
        >
          {loading ? t.sending : mode === 'login' ? t.loginBtn : t.signupBtn}
        </button>

        {/* 모드 전환 */}
        <button
          onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setMessage(''); }}
          style={{ width: '100%', background: 'none', border: 'none', color: 'var(--color-sub)', fontSize: '0.85rem', cursor: 'pointer', padding: '8px', textDecoration: 'underline' }}
        >
          {mode === 'login' ? t.switchToSignup : t.switchToLogin}
        </button>

        {/* 게스트 모드 */}
        <button
          onClick={onGuestMode}
          style={{ width: '100%', background: 'none', border: 'none', color: 'var(--color-sub)', fontSize: '0.8rem', cursor: 'pointer', padding: '8px', opacity: 0.7 }}
        >
          {t.skipGuest}
        </button>
      </div>
    </>
  );
}
