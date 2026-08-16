import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SkeletonGrid } from "@/components/Skeletons";
import { Analytics } from "@vercel/analytics/react";

// Helper لتفادي أخطاء Export Default / Named Export مع React.lazy
const safeLazy = (importFn: () => Promise<any>, exportName?: string) =>
  lazy(() =>
    importFn().then((module) => {
      if (exportName && module[exportName]) {
        return { default: module[exportName] };
      }
      return { default: module.default || module[Object.keys(module)[0]] };
    })
  );

// Pages
const HomePage = safeLazy(() => import("@/pages/HomePage"));
const ToolsListPage = safeLazy(() => import("@/pages/ToolsListPage"));
const CategoryPage = safeLazy(() => import("@/pages/CategoryPage"));
const ToolPage = safeLazy(() => import("@/pages/ToolPage"));

const SpeechToText = safeLazy(() => import("@/tools/SpeechToText"));
const TextToSpeech = safeLazy(() => import("@/tools/TextToSpeech"));
const ImageToTextOcr = safeLazy(() => import("@/tools/ImageToTextOcr"));
const PdfToText = safeLazy(() => import("@/tools/PdfToText"));
const QrCodeScanner = safeLazy(() => import("@/tools/QrCodeScanner"));
const InvoiceGenerator = safeLazy(() => import("@/tools/InvoiceGenerator"));
const ImageBackgroundRemover = safeLazy(() => import("@/tools/ImageBackgroundRemover"));
const ImageCropper = safeLazy(() => import("@/tools/ImageCropper"));

// Blog Pages - safe resolution for named/default exports
const BlogPage = safeLazy(() => import("@/pages/BlogPage"), "BlogPage");
const BlogPostPage = safeLazy(() => import("@/pages/BlogPostPage"), "BlogPostPage");
const BlogCategoryPage = safeLazy(() => import("@/pages/BlogCategoryPage"), "BlogCategoryPage");
const AuthorPage = safeLazy(() => import("@/pages/AuthorPage"), "AuthorPage");

const PricingPage = safeLazy(() => import("@/pages/PricingPage"));
const AboutPage = safeLazy(() => import("@/pages/AboutPage"));
const ContactPage = safeLazy(() => import("@/pages/ContactPage"));
const PrivacyPage = safeLazy(() => import("@/pages/PrivacyPage"));
const TermsPage = safeLazy(() => import("@/pages/TermsPage"));
const CookiesPage = safeLazy(() => import("@/pages/CookiesPage"));
const StatusPage = safeLazy(() => import("@/pages/StatusPage"));
const ChangelogPage = safeLazy(() => import("@/pages/ChangelogPage"));
const ApiPage = safeLazy(() => import("@/pages/ApiPage"));
const CareersPage = safeLazy(() => import("@/pages/CareersPage"));
const PartnersPage = safeLazy(() => import("@/pages/PartnersPage"));
const FeedbackPage = safeLazy(() => import("@/pages/FeedbackPage"));

const SignInPage = safeLazy(() => import("@/pages/SignInPage"));
const DashboardPage = safeLazy(() => import("@/pages/DashboardPage"));
const BillingPage = safeLazy(() => import("@/pages/BillingPage"));
const InvoicesPage = safeLazy(() => import("@/pages/InvoicesPage"));
const UsagePage = safeLazy(() => import("@/pages/UsagePage"));

const ServicesPage = safeLazy(() => import("@/pages/ServicesPage"));
const ServiceDetailPage = safeLazy(() => import("@/pages/ServiceDetailPage"));

const AdminPage = safeLazy(() => import("@/pages/AdminPage"));
const PressKitPage = safeLazy(() => import("@/pages/PressKitPage"));
const RoadmapPage = safeLazy(() => import("@/pages/RoadmapPage"));
const ReleaseNotesPage = safeLazy(() => import("@/pages/ReleaseNotesPage"));
const OfflinePage = safeLazy(() => import("@/pages/OfflinePage"));
const NotFoundPage = safeLazy(() => import("@/pages/NotFoundPage"));

function PageLoader() {
  return (
    <div className="container-page py-12">
      <SkeletonGrid count={8} />
    </div>
  );
}

export function App() {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="tools" element={<ToolsListPage />} />
            <Route path="category/:slug" element={<CategoryPage />} />

            {/* Explicit routes for advanced tools */}
            <Route path="tools/speech-to-text" element={<SpeechToText />} />
            <Route path="tools/text-to-speech" element={<TextToSpeech />} />
            <Route path="tools/image-to-text-ocr" element={<ImageToTextOcr />} />
            <Route path="tools/pdf-to-text" element={<PdfToText />} />
            <Route path="tools/qr-code-scanner" element={<QrCodeScanner />} />
            <Route path="tools/invoice-generator" element={<InvoiceGenerator />} />
            <Route path="tools/image-background-remover" element={<ImageBackgroundRemover />} />
            <Route path="tools/image-cropper" element={<ImageCropper />} />
            <Route path="tools/:slug" element={<ToolPage />} />

            {/* Blog Routes */}
            <Route path="blog" element={<BlogPage />} />
            <Route path="blog/category/:slug" element={<BlogCategoryPage />} />
            <Route path="blog/author/:slug" element={<AuthorPage />} />
            <Route path="blog/:slug" element={<BlogPostPage />} />

            {/* Static & Utility Pages */}
            <Route path="pricing" element={<PricingPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="cookies" element={<CookiesPage />} />
            <Route path="status" element={<StatusPage />} />
            <Route path="changelog" element={<ChangelogPage />} />
            <Route path="api" element={<ApiPage />} />
            <Route path="careers" element={<CareersPage />} />
            <Route path="partners" element={<PartnersPage />} />
            <Route path="feedback" element={<FeedbackPage />} />

            {/* Dashboard & User Pages */}
            <Route path="signin" element={<SignInPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="dashboard/billing" element={<BillingPage />} />
            <Route path="dashboard/invoices" element={<InvoicesPage />} />
            <Route path="dashboard/usage" element={<UsagePage />} />

            {/* Services Pages */}
            <Route path="services" element={<ServicesPage />} />
            <Route path="services/:slug" element={<ServiceDetailPage />} />

            {/* Admin & Other */}
            <Route path="admin" element={<AdminPage />} />
            <Route path="press" element={<PressKitPage />} />
            <Route path="roadmap" element={<RoadmapPage />} />
            <Route path="release-notes" element={<ReleaseNotesPage />} />
            <Route path="offline" element={<OfflinePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
      <Analytics />
    </>
  );
}