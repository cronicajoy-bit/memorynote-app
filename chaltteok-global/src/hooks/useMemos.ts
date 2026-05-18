'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export interface MemoRow {
  id: string;
  text: string;
  date_key: string;
  time_label: string;
  is_voice: boolean;
  is_starred: boolean;
  lang: string;
  created_at: string;
}

export function useMemos(user: User | null) {
  const supabase = createClient();
  const [memos, setMemos] = useState<MemoRow[]>([]);
  const [loading, setLoading] = useState(false);

  /* 오늘 + 최근 30일 메모 불러오기 */
  const loadMemos = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('memos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error && data) setMemos(data as MemoRow[]);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  /* 메모 추가 */
  const addMemo = useCallback(async (
    text: string,
    dateKey: string,
    timeLabel: string,
    isVoice = false,
    lang = 'ko'
  ) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('memos')
      .insert({ user_id: user.id, text, date_key: dateKey, time_label: timeLabel, is_voice: isVoice, lang })
      .select()
      .single();

    if (!error && data) {
      setMemos(prev => [data as MemoRow, ...prev]);
      return data as MemoRow;
    }
    return null;
  }, [user, supabase]);

  /* 메모 수정 */
  const updateMemo = useCallback(async (id: string, text: string) => {
    const { error } = await supabase
      .from('memos')
      .update({ text })
      .eq('id', id);

    if (!error) {
      setMemos(prev => prev.map(m => m.id === id ? { ...m, text } : m));
    }
  }, [supabase]);

  /* 별표 토글 */
  const toggleStar = useCallback(async (id: string, isStarred: boolean) => {
    const { error } = await supabase
      .from('memos')
      .update({ is_starred: isStarred })
      .eq('id', id);

    if (!error) {
      setMemos(prev => prev.map(m => m.id === id ? { ...m, is_starred: isStarred } : m));
    }
  }, [supabase]);

  /* 메모 삭제 */
  const deleteMemo = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('memos')
      .delete()
      .eq('id', id);

    if (!error) {
      setMemos(prev => prev.filter(m => m.id !== id));
    }
  }, [supabase]);

  return { memos, loading, addMemo, updateMemo, toggleStar, deleteMemo, reload: loadMemos };
}

/* 현재 로그인 유저 감지 훅 */
export function useAuth() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, authLoading, signOut };
}

/* 현재 로그인 유저의 구독 정보 감지 훅 */
export function useSubscription(user: User | null) {
  const supabase = createClient();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setSubscription(data);
    setLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const isPremium = subscription?.plan === 'premium' && subscription?.status === 'active';

  return { subscription, isPremium, loading, reload: loadSubscription };
}
