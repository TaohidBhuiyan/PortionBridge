import React, { useState, useEffect } from "react";
import axios from "axios";
import { useReveal } from "../components/hooks/useReveal";
import { useSocket } from "../context/SocketContext";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { HeroSection } from "../components/landing/HeroSection";
import { StatsSection } from "../components/landing/StatsSection";
import { ActivityTicker } from "../components/landing/ActivityTicker";
import { RoleSection } from "../components/landing/RoleSection";
import { ZoneSection } from "../components/landing/ZoneSection";
import { LeaderboardSection } from "../components/landing/LeaderboardSection";
import { ReviewSection } from "../components/landing/ReviewSection";

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * LandingPage component - Main landing page for PortionBridge
 * Combines all landing page sections with navigation and real-time updates
 */
export function LandingPage() {
  const [activeRole, setActiveRole] = useState("donor");
  const [statsRef, statsVisible] = useReveal();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const { socket, connected } = useSocket();

  const goToRole = (role) => {
    setActiveRole(role);
    document.getElementById("roles")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  // Initial stats fetch via API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        const res = await axios.get(`${API_BASE}/public/stats`);
        setStats(res.data.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setStatsError('Failed to load statistics');
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Real-time stats updates via socket
  useEffect(() => {
    if (!socket || !connected) return;

    // Listen for stats updates
    const handleStatsUpdate = (newStats) => {
      setStats(newStats);
    };

    socket.on('stats_updated', handleStatsUpdate);

    return () => {
      socket.off('stats_updated', handleStatsUpdate);
    };
  }, [socket, connected]);

  return (
    <div className="min-h-screen w-full bg-white text-[#1A1523]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        .font-serif { font-family: 'Fraunces', serif; }
        .font-mono { font-family: 'IBM Plex Mono', monospace; letter-spacing: 0.03em; }
        @keyframes scrollx-rtl { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        @keyframes scrollx-ltr-to-rtl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes float { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-14px) rotate(6deg); } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 0 0 oklch(60.6% 0.25 292.717)33; } 50% { box-shadow: 0 0 0 12px oklch(60.6% 0.25 292.717)00; } }
        @keyframes floatUp { 0% { opacity: 0; transform: translateY(4px) scale(0.9); } 20% { opacity: 1; transform: translateY(0) scale(1); } 80% { opacity: 1; } 100% { opacity: 0; transform: translateY(-16px) scale(0.95); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>

      <Navbar onGoToRole={goToRole} />

      <HeroSection onGoToRole={goToRole} stats={stats} loading={statsLoading} />

      <ActivityTicker />

      <div ref={statsRef}>
        <StatsSection visible={statsVisible} stats={stats} loading={statsLoading} />
      </div>

      <RoleSection activeRole={activeRole} onSetActiveRole={setActiveRole} />

      <ZoneSection />

      <section id="leaderboard" className="py-24 md:py-28 bg-gray-50/60">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="font-mono text-xs mb-4" style={{ color: "oklch(38% 0.19 292.717)" }}>LIVE LEADERBOARD</div>
          <h2 className="font-serif text-4xl md:text-5xl max-w-xl mb-4">Updating as you watch.</h2>
          <p className="text-black/55 max-w-lg mb-12">
            Numbers here refresh in real time as donations and pickups are confirmed — watch a row light up when it moves.
          </p>
          <LeaderboardSection />
        </div>
      </section>

      <ReviewSection />

      <Footer onGoToRole={goToRole} />
    </div>
  );
}
