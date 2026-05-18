// src/lib/getDictionary.ts
// 언어 코드를 받아 해당 딕셔너리 JSON을 로드하는 유틸 함수

const dictionaries: Record<string, () => Promise<Record<string, any>>> = {
  ko: () => import('../dictionaries/ko.json').then((m) => m.default),
  en: () => import('../dictionaries/en.json').then((m) => m.default),
  ja: () => import('../dictionaries/ja.json').then((m) => m.default),
};

export type Locale = 'ko' | 'en' | 'ja';

export const getDictionary = async (locale: Locale) => {
  const loader = dictionaries[locale] ?? dictionaries['ko'];
  return loader();
};
