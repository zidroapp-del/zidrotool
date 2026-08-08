import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SkeletonGrid } from "@/components/Skeletons";

const HomePage = lazy(() => import("@/pages/HomePage"));
const ToolsListPage = lazy(() => import("@/pages/ToolsListPage"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const ToolPage = lazy(() => import("@/pages/ToolPage"));
const BlogPage = lazy(() => import("@/pages/BlogPage"));
const BlogPostPage = lazy(() => import("@/pages/BlogPostPage"));
const BlogCategoryPage = lazy(() => import("@/pages/BlogCategoryPage"));
const AuthorPage = lazy(() => import("@/pages/AuthorPage"));
const PricingPage = lazy(() => import("@/pages/PricingPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const CookiesPage = lazy(() => import("@/pages/CookiesPage"));
const StatusPage = lazy(() => import("@/pages/StatusPage"));
const ChangelogPage = lazy(() => import("@/pages/ChangelogPage"));
const ApiPage = lazy(() => import("@/pages/ApiPage"));
const CareersPage = lazy(() => import("@/pages/CareersPage"));
const PartnersPage = lazy(() => import("@/pages/PartnersPage"));
const FeedbackPage = lazy(() => import("@/pages/FeedbackPage"));
const SignInPage = lazy(() => import("@/pages/SignInPage"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const BillingPage = lazy(() => import("@/pages/BillingPage"));
const InvoicesPage = lazy(() => import("@/pages/InvoicesPage"));
const UsagePage = lazy(() => import("@/pages/UsagePage"));
const ServicesPage = lazy(() => import("@/pages/ServicesPage"));
const ServiceDetailPage = lazy(() => import("@/pages/ServiceDetailPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const PressKitPage = lazy(() => import("@/pages/PressKitPage"));
const RoadmapPage = lazy(() => import("@/pages/RoadmapPage"));
const ReleaseNotesPage = lazy(() => import("@/pages/ReleaseNotesPage"));
const OfflinePage = lazy(() => import("@/pages/OfflinePage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

function PageLoader() {
  return (
    <div className="container-page py-12">
      <SkeletonGrid count={8} />
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
        <Route path="tools" element={<Suspense fallback={<PageLoader />}><ToolsListPage /></Suspense>} />
        <Route path="category/:slug" element={<Suspense fallback={<PageLoader />}><CategoryPage /></Suspense>} />
        <Route path="tools/:slug" element={<Suspense fallback={<PageLoader />}><ToolPage /></Suspense>} />
        <Route path="blog" element={<Suspense fallback={<PageLoader />}><BlogPage /></Suspense>} />
        <Route path="blog/category/:slug" element={<Suspense fallback={<PageLoader />}><BlogCategoryPage /></Suspense>} />
        <Route path="blog/author/:slug" element={<Suspense fallback={<PageLoader />}><AuthorPage /></Suspense>} />
        <Route path="blog/:slug" element={<Suspense fallback={<PageLoader />}><BlogPostPage /></Suspense>} />
        <Route path="pricing" element={<Suspense fallback={<PageLoader />}><PricingPage /></Suspense>} />
        <Route path="about" element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
        <Route path="contact" element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
        <Route path="privacy" element={<Suspense fallback={<PageLoader />}><PrivacyPage /></Suspense>} />
        <Route path="terms" element={<Suspense fallback={<PageLoader />}><TermsPage /></Suspense>} />
        <Route path="cookies" element={<Suspense fallback={<PageLoader />}><CookiesPage /></Suspense>} />
        <Route path="status" element={<Suspense fallback={<PageLoader />}><StatusPage /></Suspense>} />
        <Route path="changelog" element={<Suspense fallback={<PageLoader />}><ChangelogPage /></Suspense>} />
        <Route path="api" element={<Suspense fallback={<PageLoader />}><ApiPage /></Suspense>} />
        <Route path="careers" element={<Suspense fallback={<PageLoader />}><CareersPage /></Suspense>} />
        <Route path="partners" element={<Suspense fallback={<PageLoader />}><PartnersPage /></Suspense>} />
        <Route path="feedback" element={<Suspense fallback={<PageLoader />}><FeedbackPage /></Suspense>} />
        <Route path="signin" element={<Suspense fallback={<PageLoader />}><SignInPage /></Suspense>} />
        <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
        <Route path="dashboard/billing" element={<Suspense fallback={<PageLoader />}><BillingPage /></Suspense>} />
        <Route path="dashboard/invoices" element={<Suspense fallback={<PageLoader />}><InvoicesPage /></Suspense>} />
        <Route path="dashboard/usage" element={<Suspense fallback={<PageLoader />}><UsagePage /></Suspense>} />
        <Route path="services" element={<Suspense fallback={<PageLoader />}><ServicesPage /></Suspense>} />
        <Route path="services/:slug" element={<Suspense fallback={<PageLoader />}><ServiceDetailPage /></Suspense>} />
        <Route path="admin" element={<Suspense fallback={<PageLoader />}><AdminPage /></Suspense>} />
        <Route path="press" element={<Suspense fallback={<PageLoader />}><PressKitPage /></Suspense>} />
        <Route path="roadmap" element={<Suspense fallback={<PageLoader />}><RoadmapPage /></Suspense>} />
        <Route path="release-notes" element={<Suspense fallback={<PageLoader />}><ReleaseNotesPage /></Suspense>} />
        <Route path="offline" element={<Suspense fallback={<PageLoader />}><OfflinePage /></Suspense>} />
        <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
      </Route>
    </Routes>
  );
}
