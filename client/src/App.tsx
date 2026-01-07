import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocationProvider } from "./contexts/LocationContext";
import DashboardLayout from "./components/DashboardLayout";
import { ProtectedRoute, FEATURES } from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Dashboard from "./pages/Dashboard";
import CompanyProfile from "./pages/CompanyProfile";
import Locations from "./pages/Locations";
import Compliance from "./pages/Compliance";
import ComplianceSection from "./pages/ComplianceSection";
import PersonCompliance from "./pages/PersonCompliance";
import Audits from "./pages/Audits";

import Analytics from "@/pages/Analytics";
import ComplianceReports from "@/pages/ComplianceReports";
import AuditSchedules from "@/pages/AuditSchedules";
import AuditHistory from "@/pages/AuditHistory";
import ConductAudit from "./pages/ConductAudit";
import AuditResults from "./pages/AuditResults";
import AIAudits from "./pages/AIAudits";
import AuditCalendar from "./pages/AuditCalendar";
import Incidents from "./pages/Incidents";
import IncidentAnalytics from "./pages/IncidentAnalytics";
import Reports from "./pages/Reports";
import ServiceUsers from "./pages/ServiceUsers";
import Staff from "./pages/Staff";
import AuditScheduling from "./pages/AuditScheduling";
import AuditComparison from "./pages/AuditComparison";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataPrivacy from "./pages/DataPrivacy";
import PublicPrivacyPolicy from "./pages/PublicPrivacyPolicy";
import PublicTermsOfService from "./pages/PublicTermsOfService";
import RoleManagement from "./pages/RoleManagement";
import UserManagement from "./pages/UserManagement";
import TermsOfService from "./pages/TermsOfService";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import ActionLog from "./pages/ActionLog";
import EmailSettings from "./pages/EmailSettings";
import AcceptInvitation from "./pages/AcceptInvitation";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import ErrorMonitoring from "./pages/ErrorMonitoring";
import Notifications from "./pages/Notifications";
import HelpCenter from "./pages/HelpCenter";
import HelpArticle from "./pages/HelpArticle";
import SubscriptionRequired from "./pages/SubscriptionRequired";
import KloeManagement from "./pages/KloeManagement";
import AiCarePlanAudit from "./pages/AiCarePlanAudit";
import AiCareNotesAudit from "./pages/AiCareNotesAudit";
import AiCarePlanAudits from "./pages/AiCarePlanAudits";
import AiCarePlanAuditDetail from "./pages/AiCarePlanAuditDetail";
import { useSessionKeepalive } from "./hooks/useSessionKeepalive";
import ScrollToTop from "./components/ScrollToTop";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/accept-invitation" component={AcceptInvitation} />
      <Route path="/privacy" component={PublicPrivacyPolicy} />
      <Route path="/terms" component={PublicTermsOfService} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/subscription-required" component={SubscriptionRequired} />
      
      {/* Dashboard - always accessible */}
      <Route path="/">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      
      {/* Admin-only routes (handled by page-level checks) */}
      <Route path="/company-profile">
        <DashboardLayout>
          <CompanyProfile />
        </DashboardLayout>
      </Route>
      
      <Route path="/locations">
        <DashboardLayout>
          <Locations />
        </DashboardLayout>
      </Route>
      
      <Route path="/terms-of-service">
        <DashboardLayout>
          <TermsOfService />
        </DashboardLayout>
      </Route>
      
      <Route path="/settings">
        <DashboardLayout>
          <Settings />
        </DashboardLayout>
      </Route>
      
      <Route path="/notifications">
        <DashboardLayout>
          <Notifications />
        </DashboardLayout>
      </Route>
      
      <Route path="/help" component={HelpCenter} />
      <Route path="/help/:id" component={HelpArticle} />
      
      <Route path="/admin-dashboard">
        <DashboardLayout>
          <AdminDashboard />
        </DashboardLayout>
      </Route>
      
      <Route path="/admin/subscription">
        <DashboardLayout>
          <SubscriptionManagement />
        </DashboardLayout>
      </Route>
      
      <Route path="/admin/error-monitoring">
        <DashboardLayout>
          <ErrorMonitoring />
        </DashboardLayout>
      </Route>
      
      {/* Staff - protected by feature */}
      <Route path="/staff">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.STAFF}>
            <Staff />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      {/* Service Users - protected by feature */}
      <Route path="/service-users">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.SERVICE_USERS}>
            <ServiceUsers />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/compliance">
        <DashboardLayout>
          <Compliance />
        </DashboardLayout>
      </Route>
      
      <Route path="/compliance/section/:sectionId">
        <DashboardLayout>
          <ComplianceSection />
        </DashboardLayout>
      </Route>
      
      <Route path="/staff/:id/compliance">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.STAFF}>
            <PersonCompliance personType="staff" />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/service-users/:id/compliance">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.SERVICE_USERS}>
            <PersonCompliance personType="service_user" />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      {/* Audits - protected by feature */}
      <Route path="/audits">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.AUDITS}>
            <Audits />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/analytics">
        <DashboardLayout>
          <Analytics />
        </DashboardLayout>
      </Route>

      <Route path="/action-log">
        <DashboardLayout>
          <ActionLog />
        </DashboardLayout>
      </Route>

      {/* Incidents - protected by feature */}
      <Route path="/incidents">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.INCIDENTS}>
            <Incidents />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>

      <Route path="/incident-analytics">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.INCIDENTS}>
            <IncidentAnalytics />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/email-settings">
        <DashboardLayout>
          <EmailSettings />
        </DashboardLayout>
      </Route>

      <Route path="/audit-schedules">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.AUDITS}>
            <AuditSchedules />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/audit-history">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.AUDITS}>
            <AuditHistory />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/conduct-audit/:id">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.AUDITS}>
            <ConductAudit />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/audits/:id/results">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.AUDITS}>
            <AuditResults />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/ai-audits">
        <DashboardLayout>
          <AIAudits />
        </DashboardLayout>
      </Route>
      
      <Route path="/audit-calendar">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.AUDITS}>
            <AuditCalendar />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/audit-scheduling">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.AUDITS}>
            <AuditScheduling />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/audit-comparison">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.AUDITS}>
            <AuditComparison />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/privacy-policy">
        <DashboardLayout>
          <PrivacyPolicy />
        </DashboardLayout>
      </Route>
      
      <Route path="/data-privacy">
        <DashboardLayout>
          <DataPrivacy />
        </DashboardLayout>
      </Route>
      
      <Route path="/role-management">
        <DashboardLayout>
          <RoleManagement />
        </DashboardLayout>
      </Route>
      
      <Route path="/user-management">
        <DashboardLayout>
          <UserManagement />
        </DashboardLayout>
      </Route>
      
      <Route path="/kloe-management">
        <DashboardLayout>
          <KloeManagement />
        </DashboardLayout>
      </Route>
      
      {/* AI Care Plan Audit - protected by feature */}
      <Route path="/ai-care-plan-audit">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.AI_CARE_PLAN_AUDIT}>
            <AiCarePlanAudit />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/ai-care-plan-audits">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.AI_CARE_PLAN_AUDIT}>
            <AiCarePlanAudits />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      <Route path="/ai-care-plan-audits/:id">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.AI_CARE_PLAN_AUDIT}>
            <AiCarePlanAuditDetail />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      {/* AI Care Notes Audit - protected by feature */}
      <Route path="/ai-care-notes-audit">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.AI_CARE_NOTES_AUDIT}>
            <AiCareNotesAudit />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>
      
      {/* Reports - protected by feature */}
      <Route path="/reports">
        <DashboardLayout>
          <ProtectedRoute feature={FEATURES.REPORTS}>
            <Reports />
          </ProtectedRoute>
        </DashboardLayout>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Keep session alive during inactivity (ping every 5 minutes)
  useSessionKeepalive(5 * 60 * 1000);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <LocationProvider>
          <TooltipProvider>
            <ScrollToTop />
            <Toaster />
            <Router />
          </TooltipProvider>
        </LocationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
