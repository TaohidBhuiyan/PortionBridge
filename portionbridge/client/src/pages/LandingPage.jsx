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
    <div className="min-h-screen w-full bg-white text-[#1A1523] selection:bg-primary/20" style={{ fontFamily: "'Inter', sans-serif" }}>
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
          <div className="font-mono text-xs mb-4 text-primary-deep">LIVE LEADERBOARD</div>
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
