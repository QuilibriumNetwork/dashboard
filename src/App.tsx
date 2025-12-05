import { lazy, Suspense } from "react";

import ScrollToTop from "@/components/helpers/ScrollToTop";
import { SimpleNavbar } from "@/components/SimpleNavbar";
import { SimpleFooter } from "@/components/SimpleFooter";
import { Routes, Route } from "react-router-dom";
import Spinner from "@/components/ui/Spinner";
import { ThemeProvider } from "@/components/helpers/ThemeContext";
import { PeerFavoritesProvider } from "@/components/helpers/PeerFavoritesContext";

// Pages
const NotFound = lazy(() => import("@/404"));
const Explorer = lazy(() => import("@/Explorer"));
const FrameDetail = lazy(() => import("@/FrameDetail"));
const PeerDetail = lazy(() => import("@/PeerDetail"));
const Peers = lazy(() => import("@/Peers"));
const FramesAnalytics = lazy(() => import("@/FramesAnalytics"));
const PeerFavorites = lazy(() => import("@/PeerFavorites"));
const ShardDetail = lazy(() => import("@/ShardDetail"));

const withSuspense = (
  Component: React.LazyExoticComponent<() => JSX.Element>
) => (
  <Suspense
    fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="40" />
      </div>
    }
  >
    <Component />
  </Suspense>
);

export default function App() {
  return (
    <ThemeProvider>
      <PeerFavoritesProvider>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col">
          <SimpleNavbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={withSuspense(Explorer)} />
              <Route path="/frames/:frameNumber" element={withSuspense(FrameDetail)} />
              <Route path="/frames-analytics" element={withSuspense(FramesAnalytics)} />
              <Route path="/peers" element={withSuspense(Peers)} />
              <Route path="/peers/:peerId" element={withSuspense(PeerDetail)} />
              <Route path="/peer-favorites" element={withSuspense(PeerFavorites)} />
              <Route path="/provers/shards/:filter" element={withSuspense(ShardDetail)} />
              <Route path="*" element={withSuspense(NotFound)} />
            </Routes>
          </main>
          <SimpleFooter />
        </div>
      </PeerFavoritesProvider>
    </ThemeProvider>
  );
}
