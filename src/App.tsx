import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { SignUpPage } from './pages/SignUpPage';
import { LoginPage } from './pages/LoginPage';
import { PendingApprovalPage } from './pages/PendingApprovalPage';
import { UserDashboard } from './pages/UserDashboard';
import { DownloadsPage } from './pages/DownloadsPage';
import { FilePasswordPage } from './pages/FilePasswordPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

function MainRouter() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Parse path and query parameters
  const renderPage = () => {
    // 1. Home Page
    if (currentPath === '/' || currentPath === '') {
      return <HomePage navigate={navigate} />;
    }

    // 2. Sign Up Page
    if (currentPath === '/signup') {
      return <SignUpPage navigate={navigate} />;
    }

    // 3. Login Page
    if (currentPath === '/login') {
      return <LoginPage navigate={navigate} />;
    }

    // 4. Pending Approval Page
    if (currentPath === '/pending-approval') {
      return <PendingApprovalPage navigate={navigate} />;
    }

    // 5. User Dashboard
    if (currentPath === '/dashboard') {
      return <UserDashboard navigate={navigate} />;
    }

    // 6. Available Downloads Page
    if (currentPath === '/downloads') {
      return <DownloadsPage navigate={navigate} />;
    }

    // 7. File route
    if (currentPath.startsWith('/file/')) {
      return <DownloadsPage navigate={navigate} />;
    }

    // 8. Access Denied Page: /access-denied
    if (currentPath.startsWith('/access-denied')) {
      const urlParams = new URLSearchParams(window.location.search);
      const statusParam = urlParams.get('status') || undefined;
      return <AccessDeniedPage navigate={navigate} statusOverride={statusParam} />;
    }

    // 9. Admin Login Page
    if (currentPath === '/admin/login') {
      return <AdminLoginPage navigate={navigate} />;
    }

    // 10. Admin Control Panel
    if (currentPath === '/admin' || currentPath.startsWith('/admin')) {
      return <AdminPage navigate={navigate} />;
    }

    // Default fallback to Home
    return <HomePage navigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      <Navbar currentPath={currentPath} navigate={navigate} />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
