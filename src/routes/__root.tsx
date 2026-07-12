import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { FloatingWhatsApp } from "../components/FloatingWhatsApp";
import { ScrollToTopButton } from "../components/ScrollToTopButton";
import { MotionProvider } from "../components/motion/MotionProvider";
import { startVisualPropertiesEngine } from "../lib/design-lab/visual-editor";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { registerServiceWorker } from "../lib/pwa";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#FF6B00" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "author", content: "Hakim Coaching" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Hakim Coaching — برنامج تدريبي وغذائي مخصص" },
      { property: "og:title", content: "Hakim Coaching — برنامج تدريبي وغذائي مخصص" },
      { name: "twitter:title", content: "Hakim Coaching — برنامج تدريبي وغذائي مخصص" },
      {
        name: "description",
        content:
          "Hakim Coaching Landing Page: A responsive Arabic RTL hero section for premium fitness coaching.",
      },
      {
        property: "og:description",
        content:
          "Hakim Coaching Landing Page: A responsive Arabic RTL hero section for premium fitness coaching.",
      },
      {
        name: "twitter:description",
        content:
          "Hakim Coaching Landing Page: A responsive Arabic RTL hero section for premium fitness coaching.",
      },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/QicwtF0hdOh8u9TxR6SXxZWUZQJ2/social-images/social-1781802129820-a84bdb8c92175869f403771a73d7ef78787a53779ebf7913c0cdfc83c019eea7.webp",
      },
      {
        name: "twitter:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/QicwtF0hdOh8u9TxR6SXxZWUZQJ2/social-images/social-1781802129820-a84bdb8c92175869f403771a73d7ef78787a53779ebf7913c0cdfc83c019eea7.webp",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/icon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&family=Cairo:wght@400;700;800;900&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function PwaRegistrar() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return null;
}

function HashScrollHandler() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });

  useEffect(() => {
    if (pathname !== "/" || !hash) return;
    const id = hash.replace(/^#/, "");
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [pathname, hash]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isQuiz = pathname.startsWith("/quiz");
  const isPlatform = pathname.startsWith("/app");

  useEffect(() => {
    return startVisualPropertiesEngine(pathname);
  }, [pathname]);

  return (
    <MotionProvider>
      <QueryClientProvider client={queryClient}>
        <PwaRegistrar />
        <HashScrollHandler />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        {!isQuiz && !isPlatform && <FloatingWhatsApp />}
        {!isQuiz && !isPlatform && <ScrollToTopButton />}
      </QueryClientProvider>
    </MotionProvider>
  );
}
