'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'archive'>('timeline');
  const [fontSize, setFontSize] = useState(18);
  const [weatherEmoji, setWeatherEmoji] = useState('🌤️');

  useEffect(() => {
    // 임시 날씨 가져오기 효과
    setWeatherEmoji('☀️');
  }, []);

  return (
    <div style={{ fontSize: `${fontSize}px` }}>
      {/* ====== 상단 헤더 ====== */}
      <header id="app-header">
        <div id="header-left">
          <span id="app-logo">🍡 찰떡메모</span>
        </div>
        <div id="header-right">
          <button className="font-btn" onClick={() => setFontSize(prev => Math.max(14, prev - 2))}>a−</button>
          <button className="font-btn" onClick={() => setFontSize(prev => Math.min(26, prev + 2))}>A+</button>
          <button id="btn-toggle-theme">🌙</button>
        </div>
      </header>

      {/* ====== 탭 내비게이션 ====== */}
      <nav id="tab-nav">
        <button 
          className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          📅 무한 일력
        </button>
        <button 
          className={`tab-btn ${activeTab === 'archive' ? 'active' : ''}`}
          onClick={() => setActiveTab('archive')}
        >
          ⭐ 별표 보관함
        </button>
      </nav>

      <main>
        {/* 무한 일력 뷰 */}
        {activeTab === 'timeline' && (
          <div id="view-timeline" className="tab-view active">
            <div id="daily-header">
              <div id="daily-date-left">
                <span className="daily-year-month">2026년 5월</span>
                <span className="daily-day">17일 (일)</span>
              </div>
              <div id="daily-header-right">
                <span id="weather-icon">{weatherEmoji}</span>
                <span className="sync-status">● 자동 저장됨</span>
              </div>
            </div>
            <div id="memo-list" className="memo-container">
              {/* 임시 메모 카드 */}
              <div className="memo-card">
                <div className="memo-card-top">
                  <span className="memo-time">오전 11:05</span>
                  <div className="memo-card-actions">
                    <button className="btn-star">⭐</button>
                    <button className="btn-edit-card">✏️ 수정</button>
                    <button className="btn-share-card">👤 공유</button>
                  </div>
                </div>
                <div className="memo-text">
                  찰떡메모 글로벌 상용화 버전 (Phase 2) 개발 시작! 
                  Next.js 프레임워크 기반으로 리액트 컴포넌트로 분리 중입니다.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 별표 보관함 뷰 */}
        {activeTab === 'archive' && (
          <div id="view-archive" className="tab-view active">
            <div className="view-header">
              <h2 className="view-title">⭐ 별표 즐겨찾기 장부</h2>
              <p className="view-subtitle">중요한 메모만 모아보는 곳입니다.</p>
            </div>
            <div id="star-list" className="archive-container">
              <div className="empty-hint"><p>별표 표시한 메모가 없습니다.</p></div>
            </div>
          </div>
        )}
      </main>

      {/* ====== 액션 바 ====== */}
      <div id="action-bar">
        <button className="action-btn primary">
          🎙️ 말로 적기 <span style={{fontSize:'0.8em', opacity: 0.9}}>(AI 찰떡)</span>
        </button>
        <button className="action-btn">
          ✏️ 글씨로 적기
        </button>
      </div>

    </div>
  );
}
