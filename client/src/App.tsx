import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";

// Pages
import Dashboard from "./pages/Dashboard";
import CompanyProfile from "./pages/CompanyProfile";
import Locations from "./pages/Locations";
import Compliance from "./pages/Compliance";
import Audits from "./pages/Audits";
import AIAudits from "./pages/AIAudits";
import Incidents from "./pages/Incidents";
import Reports from "./pages/Reports";

function Router() {
  return (
    <Switch>
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
      
      <Route path="/compliance">
        <DashboardLayout>
          <Compliance />
        </DashboardLayout>
      </Route>
      
      <Route path="/audits">
        <DashboardLayout>
          <Audits />
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
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
