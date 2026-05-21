import "./globals.css";

export const metadata = {
  title: "מצפן - גישור זוגי מבוסס AI",
  description: "המרחב הבטוח לפתרון קונפליקטים וגישור זוגי",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}