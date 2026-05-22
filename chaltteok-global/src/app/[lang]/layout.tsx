import type { Metadata } from 'next';
import { Noto_Sans_KR, Noto_Serif_KR } from 'next/font/google';
import { getDictionary, Locale } from '@/lib/getDictionary';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-sans-kr',
});

const notoSerifKR = Noto_Serif_KR({
  subsets: ['latin'],
  weight: ['500', '600', '700', '900'],
  display: 'swap',
  variable: '--font-serif-kr',
});

const localeMetadata: Record<string, Metadata> = {
  ko: {
    title: '기억노트 - 하루 한 장, 나의 생각 기록',
    description: '배울 필요 없는 아날로그 감성 AI 기억 기록장. 40대 이상을 위한 극직관 글로벌 기억노트 앱.',
    openGraph: {
      title: '기억노트',
      description: '배울 필요 없는 아날로그 감성 AI 기억 기록장',
      locale: 'ko_KR',
      type: 'website',
    },
  },
  en: {
    title: 'Memory Note - Your Daily Thought Journal',
    description: 'An intuitive AI-powered analog memo app for 40+. Zero learning curve.',
    openGraph: {
      title: 'Memory Note',
      description: 'An intuitive AI-powered analog memo app for 40+',
      locale: 'en_US',
      type: 'website',
    },
  },
  ja: {
    title: '記憶ノート - 毎日の思考を記録',
    description: '学習不要のアナログ感性AIメモリ帳。40代以上のためのグローバル記憶ノートアプリ。',
    openGraph: {
      title: '記憶ノート',
      description: '学習不要のアナログ感性AIメモリ帳',
      locale: 'ja_JP',
      type: 'website',
    },
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return localeMetadata[lang] ?? localeMetadata['ko'];
}

export async function generateStaticParams() {
  return [{ lang: 'ko' }, { lang: 'en' }, { lang: 'ja' }];
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const validLang = (['ko', 'en', 'ja'] as const).includes(lang as Locale)
    ? (lang as Locale)
    : 'ko';

  return (
    <html
      lang={validLang}
      className={`${notoSansKR.variable} ${notoSerifKR.variable}`}
      data-theme="paper"
      data-size="large"
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
