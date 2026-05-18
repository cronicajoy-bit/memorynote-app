import { getDictionary, Locale } from '@/lib/getDictionary';
import MemoApp from '@/components/MemoApp';

interface PageProps {
  params: Promise<{ lang: Locale }>;
}

export default async function LocalePage({ params }: PageProps) {
  const { lang } = await params;
  const validLang: Locale = (['ko', 'en', 'ja'] as Locale[]).includes(lang) ? lang : 'ko';
  const dict = await getDictionary(validLang);

  return <MemoApp dict={dict} lang={validLang} />;
}
