// ============================================
// 찰떡메모 - 스마트 Push 알림 유틸리티
// ============================================

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

// Base64 URL → Uint8Array 변환 (Web Push 표준 요구사항)
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ✅ Service Worker 등록 + Push 구독 신청
export async function subscribeToPush(deviceId: string, userId?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('이 브라우저는 Web Push를 지원하지 않습니다.');
    return false;
  }
  if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID 공개키가 설정되지 않았습니다.');
    return false;
  }

  try {
    // 1) 알림 권한 요청
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('알림 권한이 거부되었습니다.');
      return false;
    }

    // 2) SW 등록
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // 3) 기존 구독 확인
    let subscription = await registration.pushManager.getSubscription();

    // 4) 구독 없으면 새로 신청
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // 5) 서버(Supabase)에 구독 정보 저장
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        deviceId,
        userId: userId || null,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Push 구독 실패:', error);
    return false;
  }
}

// 🗑️ Push 구독 해제
export async function unsubscribeFromPush(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!registration) return;
  const subscription = await registration.pushManager.getSubscription();
  if (subscription) await subscription.unsubscribe();
}

// 📅 알림 예약 등록 (API 호출)
export async function scheduleReminder(params: {
  deviceId: string;
  userId?: string;
  memoId: string;
  memoText: string;
  appointmentDate: string;   // 'YYYY-MM-DD'
  appointmentTime?: string;  // 'HH:MM' (없으면 기본값 적용)
  travelType: 'local' | 'city' | 'intercity_train' | 'intercity_bus' | 'overseas';
}): Promise<boolean> {
  const notifyAt = calculateNotifyTime(
    params.appointmentDate,
    params.appointmentTime,
    params.travelType,
  );

  const response = await fetch('/api/push/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...params, notifyAt }),
  });

  return response.ok;
}

// ⏰ 이동 유형 + 약속 시간 → 알림 발송 시각 계산
export function calculateNotifyTime(
  appointmentDate: string,
  appointmentTime?: string,
  travelType: 'local' | 'city' | 'intercity_train' | 'intercity_bus' | 'overseas' = 'local',
): string {
  const [year, month, day] = appointmentDate.split('-').map(Number);

  if (appointmentTime) {
    // ── 시간이 명시된 경우: 역산 계산 ──
    const [hour, minute] = appointmentTime.split(':').map(Number);
    const appointmentMs = new Date(year, month - 1, day, hour, minute, 0).getTime();

    const leadMinutes: Record<string, number> = {
      local:           90,   // 1.5시간 전
      city:            120,  // 2시간 전
      intercity_train: 240,  // 4시간 전 (KTX 1h40m + 역까지 20m + 버퍼 2h)
      intercity_bus:   300,  // 5시간 전 (버스 3h + 터미널 이동 30m + 버퍼 2h - 일부 조정)
      overseas:        360,  // 6시간 전
    };

    const notifyMs = appointmentMs - (leadMinutes[travelType] || 90) * 60 * 1000;
    return new Date(notifyMs).toISOString();

  } else {
    // ── 시간이 없는 경우: 타입별 기본 알림 시각 ──
    if (travelType === 'intercity_train' || travelType === 'intercity_bus' || travelType === 'overseas') {
      // 원거리: 전날 오후 6시
      const prevDay = new Date(year, month - 1, day - 1, 18, 0, 0);
      return prevDay.toISOString();
    } else {
      // 근거리/시내: 당일 오전 9시
      const sameDay = new Date(year, month - 1, day, 9, 0, 0);
      return sameDay.toISOString();
    }
  }
}

// 🗺️ 텍스트 → 이동 유형 분류 (로컬 룰 기반)
export function analyzeTravelType(
  text: string,
): 'local' | 'city' | 'intercity_train' | 'intercity_bus' | 'overseas' {
  const t = text;

  // 해외/비행기
  const overseasKw = ['비행기', '항공', '공항', '출국', '해외', '일본', '미국', '중국', '동남아', '유럽', '방콕', '도쿄', '오사카', '베이징', '뉴욕'];
  if (overseasKw.some(k => t.includes(k))) return 'overseas';

  // 타도시 (기차/KTX)
  const trainKw = ['KTX', 'SRT', '기차', '기차역', '서울역', '수서역', '동대구역', '부산역'];
  if (trainKw.some(k => t.includes(k))) return 'intercity_train';

  // 타도시 (버스)
  const busKw = ['터미널', '고속버스', '시외버스', '버스터미널'];
  if (busKw.some(k => t.includes(k))) return 'intercity_bus';

  // 타도시 지명 (기차/버스 미명시 → 기차로 추정)
  const intercityCity = [
    '서울', '부산', '광주', '인천', '대전', '울산', '수원', '고양', '창원', '성남',
    '청주', '전주', '천안', '안산', '안양', '포항', '제주', '강릉', '춘천', '여수',
    '목포', '마산', '진주', '경주', '안동', '구미', '익산', '군산',
  ];
  if (intercityCity.some(k => t.includes(k))) return 'intercity_train';

  // 동네/근거리
  const localKw = ['동네', '근처', '앞', '편의점', '마트', '카페', '골목'];
  if (localKw.some(k => t.includes(k))) return 'local';

  // 기본: 같은 도시
  return 'city';
}
