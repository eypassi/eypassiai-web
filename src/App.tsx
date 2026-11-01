import { lazy, Suspense } from "react";
import LandingPage from "./LandingPage";

const AppRuntime = lazy(() => import("./AppRuntime"));

export default function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  if (pathname === "/" || pathname === "/index.html") return <LandingPage />;
  return (
    <Suspense fallback={<main className="center-screen"><div className="brand-mark">eypassiai</div><div className="muted" role="status">Web-App wird geladen...</div></main>}>
      <AppRuntime />
    </Suspense>
  );
}
