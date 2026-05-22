'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export interface DailySummaryRow {
  id: string;
  user_id: string;
  date: string;          // 'YYYY-MM-DD' KST
  summary_text: string;
  memo_count: number;
  is_free_limit: boolean;
  created_at: string;
}

/* KST 오늘 날짜 키 (클라이언트 측) */
function getKstTodayKey(): string {
  const now = new Date();
  // KST offset: +9h
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  return kst.toISOString().slice(0, 10);
}

export function useDailySummary(user: User | null) {
  const supabase = createClient();
  const [summary, setSummary] = useState<DailySummaryRow | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setSummary(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const todayKey = getKstTodayKey();

    supabase
      .from('daily_summaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', todayKey)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) {
          setSummary(data as DailySummaryRow);
        } else {
          setSummary(null);
        }
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [user, supabase]);

  return {
    summary: summary?.summary_text ?? null,
    date: summary?.date ?? '',
    isFreeLimit: summary?.is_free_limit ?? false,
    memoCount: summary?.memo_count ?? 0,
    isLoading,
  };
}
