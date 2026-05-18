'use client';

import { useEffect, useRef } from 'react';
import { Locale } from '@/lib/getDictionary';

/* ────────────────────────────────
   소셜 채널 정의
──────────────────────────────── */
interface SocialChannel {
  id: string;
  label: string;
  emoji: string;
  color: string;
  getUrl: (text: string, url: string) => string;
}

const CHANNELS: Record<string, SocialChannel> = {
  kakao: {
    id: 'kakao',
    label: '카카오톡',
    emoji: '💬',
    color: '#FEE500',
    getUrl: (text, url) =>
      `https://story.kakao.com/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp',
    emoji: '🟢',
    color: '#25D366',
    getUrl: (text, url) =>
      `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
  facebook: {
    id: 'facebook',
    label: 'Facebook',
    emoji: '📘',
    color: '#1877F2',
    getUrl: (_text, url) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  twitter: {
    id: 'twitter',
    label: 'X (Twitter)',
    emoji: '🐦',
    color: '#000000',
    getUrl: (text, url) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  line: {
    id: 'line',
    label: 'LINE',
    emoji: '🟩',
    color: '#06C755',
    getUrl: (text, url) =>
      `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  sms: {
    id: 'sms',
    label: '문자 SMS',
    emoji: '📱',
    color: '#6C6C6C',
    getUrl: (text, _url) => `sms:?body=${encodeURIComponent(text)}`,
  },
  copy: {
    id: 'copy',
    label: '링크 복사',
    emoji: '🔗',
    color: '#F27A33',
    getUrl: (_text, url) => url,
  },
};

/* 국가(언어)별 소셜 우선순위 */
const LOCALE_PRIORITY: Record<Locale, string[]> = {
  ko: ['kakao', 'sms', 'whatsapp', 'twitter', 'facebook', 'copy'],
  en: ['whatsapp', 'facebook', 'twitter', 'sms', 'copy'],
  ja: ['line', 'whatsapp', 'twitter', 'facebook', 'sms', 'copy'],
};

/* ────────────────────────────────
   Props
──────────────────────────────── */
interface Props {
  lang: Locale;
  memo: { id: string; text: string; dateKey: string } | null;
  onClose: () => void;
  baseUrl?: string;
}

/* ────────────────────────────────
   컴포넌트
──────────────────────────────── */
export default function ShareModal({ lang, memo, onClose, baseUrl = '' }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!memo) return null;

  const shareUrl = `${baseUrl}/${lang}/share/${memo.id}`;
  const shareText = memo.text.slice(0, 120) + (memo.text.length > 120 ? '...' : '');
  const ogImageUrl = `${baseUrl}/api/og?text=${encodeURIComponent(shareText)}&date=${encodeURIComponent(memo.dateKey)}&lang=${lang}`;

  const orderedChannels = LOCALE_PRIORITY[lang].map((id) => CHANNELS[id]);

  /* 복사 / 외부 링크 핸들러 */
  const handleShare = (channel: SocialChannel) => {
    if (channel.id === 'copy') {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(lang === 'en' ? '✅ Link copied!' : lang === 'ja' ? '✅ リンクをコピーしました！' : '✅ 링크를 복사했습니다!');
      });
    } else {
      window.open(channel.getUrl(shareText, shareUrl), '_blank');
    }
    onClose();
  };

  const title =
    lang === 'en' ? 'Share this memo' :
    lang === 'ja' ? 'このメモをシェアする' :
    '이 메모 공유하기';

  const previewLabel =
    lang === 'en' ? 'Preview' :
    lang === 'ja' ? 'プレビュー' :
    '공유 미리보기';

  return (
    <>
      {/* 오버레이 */}
      <div
        ref={overlayRef}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 400,
        }}
      />

      {/* 모달 바텀 시트 */}
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          zIndex: 500,
          background: 'var(--bg-modal)',
          border: '2px solid var(--color-border)',
          borderRadius: 'var(--radius) var(--radius) 0 0',
          padding: '22px 20px 40px',
          boxShadow: 'var(--shadow-modal)',
          maxWidth: '640px',
          margin: '0 auto',
          animation: 'modalUp 0.25s ease',
        }}
      >
        {/* 헤더 */}
        <div className="modal-header">
          <span>{title}</span>
          <button onClick={onClose} style={{ fontSize: '1.4rem', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>

        {/* OG 썸네일 미리보기 */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-sub)', marginBottom: 8 }}>📸 {previewLabel}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ogImageUrl}
            alt="share preview"
            style={{
              width: '100%',
              borderRadius: 'var(--radius)',
              border: '2px solid var(--color-border)',
              boxShadow: '2px 2px 0 var(--color-border)',
              display: 'block',
            }}
          />
        </div>

        {/* 소셜 버튼 (국가별 우선순위 정렬) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orderedChannels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => handleShare(ch)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 18px',
                background: 'var(--bg-input)',
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--radius)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '2px 2px 0 var(--color-border)',
                transition: 'all 0.15s ease',
                textAlign: 'left',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '4px 4px 0 var(--color-border)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = '';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '2px 2px 0 var(--color-border)';
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{ch.emoji}</span>
              <span>{ch.label}</span>
              {/* 첫 번째(1순위) 채널에 '추천' 뱃지 */}
              {orderedChannels.indexOf(ch) === 0 && (
                <span
                  style={{
                    marginLeft: 'auto',
                    background: '#FFDE59',
                    border: '1.5px solid #1A1A1A',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    boxShadow: '1px 1px 0 #1A1A1A',
                  }}
                >
                  {lang === 'en' ? '⭐ Top' : lang === 'ja' ? '⭐ 人気' : '⭐ 추천'}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
