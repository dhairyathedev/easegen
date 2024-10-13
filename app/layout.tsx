import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";


export const metadata: Metadata = {
  title: "Easegen - Automate your practical file creation",
  description: "Discover Easegen, the innovative solution for streamlining practical file creation for computer science students. Say goodbye to tedious formatting and hello to efficiency! With Easegen, you can upload custom Word templates, execute code, capture output, and generate multiple practicals in minutes. Focus on learning and coding rather than formatting with our user-friendly interface. Transform your academic experience and save time with Easegen today!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
