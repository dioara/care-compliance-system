import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocationProvider } from "./contexts/LocationContext";
import DashboardLayout from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
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
import ConductAudit from "./pages/ConductAudit";
import AuditResults from "./pages/AuditResults";
import AIAudits from "./pages/AIAudits";
import Incidents from "./pages/Incidents";
import Reports from "./pages/Reports";
import ServiceUsers from "./pages/ServiceUsers";
import Staff from "./pages/Staff";
import AuditScheduling from "./pages/AuditScheduling";
import AuditComparison from "./pages/AuditComparison";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DataPrivacy from "./pages/DataPrivacy";
import RoleManagement from "./pages/RoleManagement";
import UserManagement from "./pages/UserManagement";
import TermsOfService from "./pages/TermsOfService";
import Settings from "./pages/Settings";
import AdminDashboard from "./pages/AdminDashboard";
import ActionLog from "./pages/ActionLog";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      <Route path="/">
        <DashboardLayout>
          <Dashboard />
        </DashboardLayout>
      </Route>
      
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
      
      <Route path="/admin-dashboard">
        <DashboardLayout>
          <AdminDashboard />
        </DashboardLayout>
      </Route>  
      <Route path="/staff">
        <DashboardLayout>
          <Staff />
        </DashboardLayout>
      </Route>
      
      <Route path="/service-users">
        <DashboardLayout>
          <ServiceUsers />
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
          <PersonCompliance personType="staff" />
        </DashboardLayout>
      </Route>
      
      <Route path="/service-users/:id/compliance">
        <DashboardLayout>
          <PersonCompliance personType="service_user" />
        </DashboardLayout>
      </Route>
      
      <Route path="/audits">
        <DashboardLayout>
          <Audits />
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

      <Route path="/reports">
        <DashboardLayout>
          <ComplianceReports />
        </DashboardLayout>
      </Route>

      <Route path="/audit-schedules">
        <DashboardLayout>
          <AuditSchedules />
        </DashboardLayout>
      </Route>
      
      <Route path="/audits/:id">
        <DashboardLayout>
          <ConductAudit />
        </DashboardLayout>
      </Route>
      
      <Route path="/audits/:id/results">
        <DashboardLayout>
          <AuditResults />
        </DashboardLayout>
      </Route>
      
      <Route path="/ai-audits">
        <DashboardLayout>
          <AIAudits />
        </DashboardLayout>
      </Route>
      
      <Route path="/incidents">
        <DashboardLayout>
          <Incidents />
        </DashboardLayout>
      </Route>
      
      <Route path="/audit-scheduling">
        <DashboardLayout>
          <AuditScheduling />
        </DashboardLayout>
      </Route>
      
      <Route path="/audit-comparison">
        <DashboardLayout>
          <AuditComparison />
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
      
      <Route path="/terms-of-service" component={TermsOfService} />
      
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
      
      <Route path="/reports">
        <DashboardLayout>
          <Reports />
        </DashboardLayout>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <LocationProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LocationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;