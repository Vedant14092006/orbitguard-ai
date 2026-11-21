import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavPage } from './components/layout/Sidebar';
import { CommandPalette } from './components/layout/CommandPalette';
import { NotificationDrawer } from './components/layout/NotificationDrawer';
import { SpaceDataModal } from './components/common/SpaceDataModal';
import { DashboardOverview } from './pages/DashboardOverview';
import { OrbitalTrackerPage } from './pages/OrbitalTrackerPage';
import { DebrisExplorerPage } from './pages/DebrisExplorerPage';
import { CollisionRiskPage } from './pages/CollisionRiskPage';
import { SatelliteMonitoringPage } from './pages/SatelliteMonitoringPage';
import { SustainabilityAnalyticsPage } from './pages/SustainabilityAnalyticsPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { IntroLoadingScreen } from './components/common/IntroLoadingScreen';
import { MOCK_EVENTS } from './data/mockEvents';
import { OrbitalEvent } from './types/orbit';

export function App() {
  const [isBooting, setIsBooting] = useState<boolean>(true);
  const [activePage, setActivePage] = useState<NavPage>('overview');
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [pendingAssistantPrompt, setPendingAssistantPrompt] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSpaceDataOpen, setIsSpaceDataOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < 1024
  );
  const [unreadCount, setUnreadCount] = useState(MOCK_EVENTS.length);

  const handleNavigate = (page: NavPage, objectId?: string) => {
    setActivePage(page);
    if (objectId) {
      setSelectedTargetId(objectId);
    }
  };

  const handleSelectEvent = (event: OrbitalEvent) => {
    setIsNotificationsOpen(false);
    if (event.type === 'CONJUNCTION_WARNING') {
      setActivePage('collision-risk');
      if (event.objectId) setSelectedTargetId(event.objectId);
    } else if (event.type === 'DEBRIS_DETECTED' || event.type === 'REENTRY_FORECAST') {
      setActivePage('debris');
      if (event.objectId) setSelectedTargetId(event.objectId);
    } else if (event.type === 'MANEUVER_EXECUTED' || event.type === 'SOLAR_EVENT') {
      setActivePage('satellites');
      if (event.objectId) setSelectedTargetId(event.objectId);
    } else {
      setActivePage('overview');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-mono selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Polished Introductory Aerospace Boot Screen */}
      {isBooting && <IntroLoadingScreen onComplete={() => setIsBooting(false)} />}

      {/* Top Mission Control Bar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenNotifications={() => {
          setIsNotificationsOpen(true);
          setUnreadCount(0);
        }}
        onOpenSpaceData={() => setIsSpaceDataOpen(true)}
        onReplayBoot={() => setIsBooting(true)}
        unreadNotificationsCount={unreadCount}
      />

      {/* Main Mission Control Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Mission Control Sidebar */}
        <Sidebar
          activePage={activePage}
          onSelectPage={(page) => handleNavigate(page)}
          collapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Center Main Stage Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/40 via-slate-950 to-slate-950">
          {activePage === 'overview' && (
            <DashboardOverview
              onNavigate={handleNavigate}
              onNavigateToAssistant={(prompt) => {
                setPendingAssistantPrompt(prompt || null);
                setActivePage('ai-assistant');
              }}
            />
          )}

          {activePage === 'tracker' && (
            <OrbitalTrackerPage
              initialObjectId={selectedTargetId}
              onNavigateToSatellite={(id) => handleNavigate('satellites', id)}
              onNavigateToDebris={(id) => handleNavigate('debris', id)}
              onNavigateToAssistant={(prompt) => {
                setPendingAssistantPrompt(prompt || null);
                setActivePage('ai-assistant');
              }}
            />
          )}

          {activePage === 'debris' && (
            <DebrisExplorerPage
              initialObjectId={selectedTargetId}
              onNavigateToTracker={(id) => handleNavigate('tracker', id)}
              onNavigateToAssistant={(prompt) => {
                setPendingAssistantPrompt(prompt || null);
                setActivePage('ai-assistant');
              }}
            />
          )}

          {activePage === 'collision-risk' && (
            <CollisionRiskPage
              initialEventId={selectedTargetId}
              onNavigateToSatellite={(satId) => handleNavigate('satellites', satId)}
              onNavigateToTracker={(objId) => handleNavigate('tracker', objId)}
              onNavigateToAssistant={(prompt) => {
                setPendingAssistantPrompt(prompt || null);
                setActivePage('ai-assistant');
              }}
            />
          )}

          {activePage === 'satellites' && (
            <SatelliteMonitoringPage
              initialSatelliteId={selectedTargetId}
              onNavigateToTracker={(id) => handleNavigate('tracker', id)}
              onNavigateToCollision={(conjunctionId, satId) =>
                handleNavigate('collision-risk', conjunctionId || satId)
              }
              onNavigateToSustainability={() => handleNavigate('sustainability')}
              onNavigateToAssistant={(prompt) => {
                setPendingAssistantPrompt(prompt || null);
                setActivePage('ai-assistant');
              }}
            />
          )}

          {activePage === 'sustainability' && (
            <SustainabilityAnalyticsPage
              onNavigateToSatellite={(satId) => handleNavigate('satellites', satId)}
              onNavigateToTracker={(objId) => handleNavigate('tracker', objId)}
              onNavigateToAssistant={(prompt) => {
                setPendingAssistantPrompt(prompt || null);
                setActivePage('ai-assistant');
              }}
            />
          )}

          {activePage === 'ai-assistant' && (
            <AIAssistantPage
              initialPrompt={pendingAssistantPrompt}
              onNavigateToPage={handleNavigate}
            />
          )}
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectPage={handleNavigate}
      />

      {/* Real-time Notifications Flyout Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectEvent={handleSelectEvent}
      />

      {/* Space Data Provenance & Real-Time Pipeline Modal */}
      <SpaceDataModal
        isOpen={isSpaceDataOpen}
        onClose={() => setIsSpaceDataOpen(false)}
      />
    </div>
  );
}

export default App;
