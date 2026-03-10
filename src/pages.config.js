/**
 * pages.config.js - Page routing configuration
 *
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 *
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 *
 * Example file structure:
 *
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 *
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminAlerts from "./pages/AdminAlerts.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminMetrics from "./pages/AdminMetrics.jsx";
import AdminOrganizations from "./pages/AdminOrganizations.jsx";
import AdminSettings from "./pages/AdminSettings.jsx";
import AdminTickets from "./pages/AdminTickets.jsx";
import DonorDocuments from "./pages/DonorDocuments.jsx";
import DonorDonations from "./pages/DonorDonations.jsx";
import DonorPortal from "./pages/DonorPortal.jsx";
import Home from "./pages/Home.jsx";
import Manual from "./pages/Manual.jsx";
import OSCAlerts from "./pages/OSCAlerts.jsx";
import OSCChatbot from "./pages/OSCChatbot.jsx";
import OSCComplianceCases from "./pages/OSCComplianceCases.jsx";
import OSCDashboard from "./pages/OSCDashboard.jsx";
import OSCDonations from "./pages/OSCDonations.jsx";
import OSCDonors from "./pages/OSCDonors.jsx";
import OSCExpedientes from "./pages/OSCExpedientes.jsx";
import OSCSettings from "./pages/OSCSettings.jsx";
import __Layout from "./Layout.jsx";

export const PAGES = {
  AdminAlerts: AdminAlerts,
  AdminDashboard: AdminDashboard,
  AdminMetrics: AdminMetrics,
  AdminOrganizations: AdminOrganizations,
  AdminSettings: AdminSettings,
  AdminTickets: AdminTickets,
  DonorDocuments: DonorDocuments,
  DonorDonations: DonorDonations,
  DonorPortal: DonorPortal,
  Home: Home,
  Manual: Manual,
  OSCAlerts: OSCAlerts,
  OSCChatbot: OSCChatbot,
  OSCComplianceCases: OSCComplianceCases,
  OSCDashboard: OSCDashboard,
  OSCDonations: OSCDonations,
  OSCDonors: OSCDonors,
  OSCExpedientes: OSCExpedientes,
  OSCSettings: OSCSettings,
};

export const pagesConfig = {
  mainPage: "Home",
  Pages: PAGES,
  Layout: __Layout,
};
