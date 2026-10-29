import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState, Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { SearchDialog } from "@/components/SearchDialog";
import "@/nv.css";

export function Layout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  // The homepage and the tools directory use the dark navy "NV" theme (nav, page and footer) whatever theme the visitor picked.
  const isHome = location.pathname === "/" || location.pathname === "/tools";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className={isHome ? "dark nv-site flex min-h-full flex-col" : "flex min-h-full flex-col"} style={isHome ? { colorScheme: "dark" } : undefined}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <Navbar onOpenSearch={() => setSearchOpen(true)} />
      <main id="main-content" className="flex-1">
        <div key={location.pathname} className="nv-page">
          <span className="nv-route-bar" aria-hidden="true" />
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
