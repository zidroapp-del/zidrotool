import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchDialog } from "@/components/SearchDialog";

export function Layout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-full flex-col">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar onOpenSearch={() => setSearchOpen(true)} />
      <main id="main-content" className="flex-1">
        <div key={location.pathname} className="animate-fade-in">
          <Suspense fallback={<div className="container-page py-12">Loading…</div>}>
            <Outlet context={{ openSearch: () => setSearchOpen(true) }} />
          </Suspense>
        </div>
      </main>
      <Footer />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
