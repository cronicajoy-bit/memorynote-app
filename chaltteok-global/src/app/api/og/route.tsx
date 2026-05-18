import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text') || 'My daily thought';
  const date = searchParams.get('date') || new Date().toLocaleDateString();
  const lang = (searchParams.get('lang') || 'ko') as 'ko' | 'en' | 'ja';

  const labels: Record<string, { app: string; from: string }> = {
    ko: { app: '🍡 찰떡메모', from: '찰떡메모에서 기록됨' },
    en: { app: '🍡 Chaltteok Memo', from: 'Recorded in Chaltteok Memo' },
    ja: { app: '🍡 チャルトクメモ', from: 'チャルトクメモで記録' },
  };
  const label = labels[lang];

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#F2EBE1',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '60px',
          fontFamily: 'sans-serif',
          border: '4px solid #1A1A1A',
        }}
      >
        {/* 앱 로고 헤더 */}
        <div
          style={{
            background: '#FFDE59',
            border: '3px solid #1A1A1A',
            borderRadius: '6px',
            padding: '10px 28px',
            fontSize: '28px',
            fontWeight: 700,
            color: '#1A1A1A',
            marginBottom: '40px',
            boxShadow: '4px 4px 0 #1A1A1A',
          }}
        >
          {label.app}
        </div>

        {/* 메모 카드 */}
        <div
          style={{
            background: '#FFFDF9',
            border: '3px solid #1A1A1A',
            borderRadius: '6px',
            padding: '40px 50px',
            maxWidth: '900px',
            width: '100%',
            boxShadow: '6px 6px 0 #1A1A1A',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* 날짜 */}
          <div
            style={{
              fontSize: '18px',
              color: '#4A4A4A',
              fontWeight: 500,
              borderBottom: '2px dashed #D9CDB8',
              paddingBottom: '12px',
            }}
          >
            📅 {date}
          </div>

          {/* 메모 본문 */}
          <div
            style={{
              fontSize: '34px',
              fontWeight: 500,
              color: '#1A1A1A',
              lineHeight: 1.6,
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {text}
          </div>
        </div>

        {/* 하단 출처 표시 */}
        <div
          style={{
            marginTop: '32px',
            fontSize: '18px',
            color: '#7A7A7A',
          }}
        >
          {label.from}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
