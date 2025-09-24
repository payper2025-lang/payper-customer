"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/ui/header";
import Footer from "@/components/ui/footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const getLayout = () => {
    if (pathname.startsWith("/login")) {
      return children;
    } else {
      return (
        <>
          <Header />
          <div className="min-h-[calc(100vh-130px)]">
            {children}
          </div>
          <Footer />
        </>
      );
    }
  };

  return <>{getLayout()}</>;
}
