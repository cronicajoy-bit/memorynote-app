'use client';

import { useState } from 'react';

interface DailySummaryCardProps {
  summary: string | null;
  date: string;          // 'YYYY-MM-DD' KST
  isFreeLimit: boolean;  // true: 무료 플랜 한도 초과
  isPremium: boolean;
  lang?: 'ko' | 'en' | 'ja';
  onUpgradeClick?: () => void;
}

/* ── 날짜 레이블: 'YYYY-MM-DD' → '5월 22일 오늘의 기억' ── */
function formatDateLabel(date: string, lang: string): string {
  if (!date) return '';
  const [, month, day] = date.split('-').map(Number);
  if (lang === 'en') return `Today's Memory — ${new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
  if (lang === 'ja') return `今日の記憶 — ${month}月${day}日`;
  return `${month}월 ${day}일 오늘의 기억`;
}

export default function DailySummaryCard({
  summary,
  date,
  isFreeLimit,
  isPremium,
  lang = 'ko',
  onUpgradeClick,
}: DailySummaryCardProps) {
  const [collapsed, setCollapsed] = useState(false);

  // 요약 없으면 카드 미표시 (메모 없는 날)
  if (!summary) return null;

  const label = formatDateLabel(date, lang);

  return (
    <div
      style={{
        margin: '12px 16px 0',
        background: '#FFFDF8',              // 따뜻한 종이 크림
        border: '2px solid #E0DDD8',        // DESIGN.md border 색상
        borderRadius: '12px',
        boxShadow: '3px 3px 0 #E0DDD8',
        overflow: 'hidden',
        animation: 'modalUp 0.2s ease',
      }}
    >
      {/* ── 헤더 (클릭하면 펼침/접힘) ── */}
      <button
        onClick={() => setCollapsed(p => !p)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 8,
          minHeight: '60px',              // 60px 터치 타겟 (실버세대 UX)
        }}
        aria-expanded={!collapsed}
        aria-label={label}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '1.25rem' }}>🌸</span>
          <div>
            <div style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#8E8E93',
              letterSpacing: '0.02em',
            }}>
              {label}
            </div>
            {isFreeLimit && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginTop: 2,
                padding: '2px 8px',
                background: '#FFF0E8',
                border: '1px solid #E8622A',
                borderRadius: 20,
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#E8622A',
              }}>
                ⭐ 프리미엄
              </div>
            )}
          </div>
        </div>
        <span style={{
          fontSize: '1rem',
          color: '#8E8E93',
          transition: 'transform 0.2s',
          transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
          display: 'inline-block',
        }}>
          ▲
        </span>
      </button>

      {/* ── 본문 (접혔을 때 숨김) ── */}
      {!collapsed && (
        <div style={{ padding: '0 16px 16px' }}>
          <p style={{
            fontFamily: "'Noto Serif KR', 'Noto Sans KR', serif",
            fontSize: '1.2rem',            // 실버세대: 20px+
            lineHeight: 1.9,
            color: '#1C1C1E',
            margin: 0,
            wordBreak: 'keep-all',
          }}>
            {summary}
          </p>

          {/* 무료 한도 초과: 업그레이드 CTA */}
          {isFreeLimit && !isPremium && (
            <div style={{ marginTop: 14 }}>
              <button
                onClick={onUpgradeClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '12px 16px',
                  background: '#FFF0E8',
                  border: '2px solid #E8622A',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#E8622A',
                  boxShadow: '2px 2px 0 #E8622A',
                  minHeight: '56px',       // 56px 터치 타겟
                }}
              >
                <span>⭐</span>
                <span>
                  {lang === 'en' ? 'Continue with Premium — unlimited daily memories' :
                   lang === 'ja' ? 'プレミアムで毎日の記憶を続ける' :
                   '프리미엄에서 매일 기억 돌아보기'}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
