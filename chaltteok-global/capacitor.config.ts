import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vardai.chaltteok',
  appName: '기억노트',
  webDir: 'out',
  server: {
    // 가상 스마트폰에서 PC의 로컬 개발 서버(localhost:3000)를 바라보도록 설정 (실시간 개발/핫리로딩용!)
    url: 'http://10.0.2.2:3000',
    cleartext: true
  }
};

export default config;
