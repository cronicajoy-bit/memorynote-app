import './globals.css';

// 루트 레이아웃 - html/body는 [lang]/layout.tsx에서 처리
// suppressHydrationWarning은 [lang]/layout.tsx의 html 태그에 적용
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children as React.ReactElement;
}
