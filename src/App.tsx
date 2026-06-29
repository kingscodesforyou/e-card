import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import AdminLayout from "./components/admin/AdminLayout";
import HomePage from "./pages/HomePage";
import TemplateLibrary from "./pages/TemplateLibrary";
import EditorPage from "./pages/EditorPage";
import PreviewPage from "./pages/PreviewPage";
import ExportPage from "./pages/ExportPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerificationSentPage from "./pages/VerificationSentPage";
import UserProfile from "./pages/UserProfile";
import DashboardPage from "./pages/admin/DashboardPage";
import UserManagementPage from "./pages/admin/UserManagementPage";
import TemplateManagementPage from "./pages/admin/TemplateManagementPage";
import TemplateEditorPage from "./pages/admin/TemplateEditorPage";
import CardManagementPage from "./pages/admin/CardManagementPage";
import SettingsPage from "./pages/admin/SettingsPage";
import LabelManagementPage from "./pages/admin/LabelManagementPage";
import { useAuth } from "./hooks/useAuth";

/** 路由切换时自动滚动到页面顶部 */
function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}

/** 判断当前路由是否为全屏页面（隐藏 Footer） */
function useIsFullscreenRoute(): boolean {
  const { pathname } = useLocation();
  return pathname.startsWith('/editor') || pathname.startsWith('/preview') || pathname.startsWith('/export');
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />;
  }
  if (!isAdmin) {
    return <Navigate to="/user/profile" />;
  }
  return <AdminLayout>{children}</AdminLayout>;
}

function AdminTemplateEditorRoute() {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" />;
  }
  if (!isAdmin) {
    return <Navigate to="/user/profile" />;
  }
  return <TemplateEditorPage />;
}

/** 主布局：包裹 Header、内容区和 Footer，全屏路由隐藏 Footer */
function MainLayout() {
  const isFullscreen = useIsFullscreenRoute();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/templates" element={<TemplateLibrary />} />
          <Route path="/editor/:templateId?" element={<EditorPage />} />
          <Route path="/preview" element={<PreviewPage />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/auth/verification-sent" element={<VerificationSentPage />} />
          <Route path="/user/profile" element={<UserProfile />} />
        </Routes>
      </main>
      {!isFullscreen && <Footer />}
    </div>
  );
}

function AppContent() {
  useAuth();

  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route
        path="/admin/*"
        element={
          <AdminRoute>
            <Routes>
              <Route path="" element={<DashboardPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="templates" element={<TemplateManagementPage />} />
              <Route path="cards" element={<CardManagementPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="labels" element={<LabelManagementPage />} />
            </Routes>
          </AdminRoute>
        }
      />

      {/* 管理员模板编辑器（独立布局，不使用 AdminLayout） */}
      <Route path="/admin/template-editor/:templateId" element={<AdminTemplateEditorRoute />} />

      <Route path="/*" element={<MainLayout />} />
    </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}