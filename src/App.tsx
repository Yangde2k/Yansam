import React, { Suspense, lazy, type PropsWithChildren } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppLockScreen, AppShell, ErrorFallback, GlassCard, LoadingScreen, ToastSystem } from './components';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useUIStore } from './store/ui';
import { isSupabaseConfigured, missingSupabaseEnv } from './lib/supabase';

const LandingPage = lazy(() => import('./pages/auth-pages').then((module) => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import('./pages/auth-pages').then((module) => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import('./pages/auth-pages').then((module) => ({ default: module.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth-pages').then((module) => ({ default: module.ForgotPasswordPage })));

const HomePage = lazy(() => import('./pages/app-pages').then((module) => ({ default: module.HomePage })));
const MemoriesPage = lazy(() => import('./pages/app-pages').then((module) => ({ default: module.MemoriesPage })));
const GalleryPage = lazy(() => import('./pages/app-pages').then((module) => ({ default: module.GalleryPage })));
const TimelinePage = lazy(() => import('./pages/app-pages').then((module) => ({ default: module.TimelinePage })));
const LettersPage = lazy(() => import('./pages/app-pages').then((module) => ({ default: module.LettersPage })));
const MoodsPage = lazy(() => import('./pages/app-pages').then((module) => ({ default: module.MoodsPage })));
const FuturePage = lazy(() => import('./pages/app-pages').then((module) => ({ default: module.FuturePage })));
const SpecialMomentsPage = lazy(() => import('./pages/app-pages').then((module) => ({ default: module.SpecialMomentsPage })));
const SettingsPage = lazy(() => import('./pages/app-pages').then((module) => ({ default: module.SettingsPage })));

function MissingEnvironmentScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-romance-gradient px-4">
      <GlassCard className="w-full max-w-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-cocoa/55">Deployment required</p>
        <p className="mt-3 font-serif text-3xl text-wine">YANSAM still needs Supabase keys</p>
        <p className="mt-3 text-sm leading-7 text-cocoa/75">This build is deployment-ready, but it cannot connect to the live private backend until environment variables are added. Once you create Supabase and Vercel, paste the keys and redeploy.</p>
        <div className="mt-5 rounded-3xl bg-white/55 p-4">
          <p className="text-sm font-medium text-wine">Missing environment variables</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-cocoa/80">
            {missingSupabaseEnv.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="mt-5 rounded-3xl bg-white/55 p-4 text-sm leading-7 text-cocoa/80">
          Follow <span className="font-medium text-wine">DEPLOYMENT_GUIDE.md</span> in the project root for the exact Supabase + Vercel setup.
        </div>
      </GlassCard>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 20,
    },
    mutations: {
      retry: 1,
    },
  },
});

function RouteLoader({ label = 'Opening your sanctuary…' }: { label?: string }) {
  return <LoadingScreen label={label} />;
}

function LazyPage({ children, label }: PropsWithChildren<{ label?: string }>) {
  return <Suspense fallback={<RouteLoader label={label} />}>{children}</Suspense>;
}

class AppErrorBoundary extends React.Component<PropsWithChildren, { hasError: boolean }> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}

function AppLockManager() {
  const { session } = useAuth();
  const security = useUIStore((state) => state.security);
  const isLocked = useUIStore((state) => state.isLocked);
  const initializeLockForSession = useUIStore((state) => state.initializeLockForSession);
  const lockApp = useUIStore((state) => state.lockApp);
  const registerInteraction = useUIStore((state) => state.registerInteraction);

  React.useEffect(() => {
    initializeLockForSession(Boolean(session));
  }, [initializeLockForSession, security.enabled, security.passcode, session]);

  React.useEffect(() => {
    if (!session || !security.enabled || !security.passcode) return;

    const activityEvents: (keyof WindowEventMap)[] = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => registerInteraction();
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && security.lockOnBackground) {
        lockApp();
        return;
      }
      if (document.visibilityState === 'visible') {
        registerInteraction();
      }
    };

    activityEvents.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = window.setInterval(() => {
      const { security: latestSecurity, lastInteractionAt, isLocked: latestIsLocked } = useUIStore.getState();
      if (latestIsLocked || !latestSecurity.enabled || !latestSecurity.passcode) return;
      const timeoutMs = latestSecurity.autoLockMinutes * 60 * 1000;
      if (Date.now() - lastInteractionAt >= timeoutMs) {
        useUIStore.getState().lockApp();
      }
    }, 15_000);

    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(interval);
    };
  }, [isLocked, lockApp, registerInteraction, security.autoLockMinutes, security.enabled, security.lockOnBackground, security.passcode, session]);

  return null;
}

function ProtectedLayout() {
  const { session, loading, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const isLocked = useUIStore((state) => state.isLocked);
  const unlockApp = useUIStore((state) => state.unlockApp);
  const security = useUIStore((state) => state.security);
  const resetSessionLockState = useUIStore((state) => state.resetSessionLockState);

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/login" replace />;

  return (
    <>
      <AppLockManager />
      <AppLockScreen
        open={security.enabled && Boolean(security.passcode) && isLocked}
        onUnlock={unlockApp}
        onSignOut={() => {
          void signOut().then(() => {
            resetSessionLockState();
            navigate('/login', { replace: true });
          });
        }}
      />
      <AppShell profile={profile} />
    </>
  );
}

function PublicOnly({ children }: PropsWithChildren) {
  const { session, loading } = useAuth();
  const lastRoute = useUIStore((state) => state.preferences.lastRoute);

  if (loading) return <LoadingScreen />;
  if (session) return <Navigate to={lastRoute || '/app/home'} replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicOnly>
            <LazyPage label="Opening YANSAM…">
              <LandingPage />
            </LazyPage>
          </PublicOnly>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LazyPage label="Opening login…">
              <LoginPage />
            </LazyPage>
          </PublicOnly>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnly>
            <LazyPage label="Preparing your sanctuary…">
              <SignupPage />
            </LazyPage>
          </PublicOnly>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnly>
            <LazyPage label="Opening password reset…">
              <ForgotPasswordPage />
            </LazyPage>
          </PublicOnly>
        }
      />

      <Route path="/app" element={<ProtectedLayout />}>
        <Route path="home" element={<LazyPage label="Loading your home…"><HomePage /></LazyPage>} />
        <Route path="memories" element={<LazyPage label="Loading memories…"><MemoriesPage /></LazyPage>} />
        <Route path="gallery" element={<LazyPage label="Loading gallery…"><GalleryPage /></LazyPage>} />
        <Route path="timeline" element={<LazyPage label="Loading timeline…"><TimelinePage /></LazyPage>} />
        <Route path="letters" element={<LazyPage label="Loading letters…"><LettersPage /></LazyPage>} />
        <Route path="moods" element={<LazyPage label="Loading check-ins…"><MoodsPage /></LazyPage>} />
        <Route path="future" element={<LazyPage label="Loading plans…"><FuturePage /></LazyPage>} />
        <Route path="special" element={<LazyPage label="Loading surprise pages…"><SpecialMomentsPage /></LazyPage>} />
        <Route path="settings" element={<LazyPage label="Opening settings…"><SettingsPage /></LazyPage>} />
        <Route index element={<Navigate to="home" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  if (!isSupabaseConfigured) {
    return <MissingEnvironmentScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppErrorBoundary>
          <BrowserRouter>
            <ToastSystem />
            <AppRoutes />
          </BrowserRouter>
        </AppErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}