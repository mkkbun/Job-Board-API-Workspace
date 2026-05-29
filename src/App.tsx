import React, { useState } from "react";
import SwaggerPortal from "./components/SwaggerPortal";
import CodeExplorer from "./components/CodeExplorer";
import DatabaseVisualizer from "./components/DatabaseVisualizer";
import BullMQQueue from "./components/BullMQQueue";
import TerminalTester from "./components/TerminalTester";
import { mockDb } from "./data/mockServer";
import { Braces, Server, BookOpen, Database, FolderCode, Layers, PlaySquare, Settings, Flame, ShieldAlert, BadgeInfo } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"docs" | "code" | "db" | "queue" | "test" | "ratelimit">("docs");
  const [dbUpdateTrigger, setDbUpdateTrigger] = useState(0);

  // Rate Limiting Config State
  const [rateLimitWindow, setRateLimitWindow] = useState(60000); // 1-minute window for testability
  const [rateLimitGuest, setRateLimitGuest] = useState(10);
  const [rateLimitAuthed, setRateLimitAuthed] = useState(25);
  
  // Custom rate limit hammer simulator states
  const [testingIp, setTestingIp] = useState("198.162.1.85");
  const [hammerClicks, setHammerClicks] = useState<number[]>([]);
  const [hammerLogs, setHammerLogs] = useState<string[]>([]);

  const handleUpdateDatabaseState = () => {
    setDbUpdateTrigger(prev => prev + 1);
  };

  const handleResetDatabase = () => {
    mockDb.reset();
    handleUpdateDatabaseState();
  };

  const handleHammerRateLimit = () => {
    const now = Date.now();
    const clearBefore = now - rateLimitWindow;
    
    // Check local sliding window
    const activeHits = hammerClicks.filter(ts => ts > clearBefore);
    const limit = rateLimitGuest;

    const remaining = Math.max(0, limit - activeHits.length - 1);
    
    if (activeHits.length >= limit) {
      const logLine = `[${new Date().toLocaleTimeString()}] ❌ BLOCKED (429 Too Many Requests) - sliding window full! Hits in last min: ${activeHits.length}. Remaining: ${remaining}`;
      setHammerLogs(prev => [logLine, ...prev]);
    } else {
      const nextClicks = [...activeHits, now];
      setHammerClicks(nextClicks);
      const logLine = `[${new Date().toLocaleTimeString()}] ✅ ALLOWED (200 OK) - request logged. Hits in last min: ${nextClicks.length}. Remaining: ${remaining}`;
      setHammerLogs(prev => [logLine, ...prev]);
    }
  };

  const handleResetHammer = () => {
    setHammerClicks([]);
    setHammerLogs([]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans flex flex-col antialiased">
      {/* Dynamic Header HUD Line */}
      <header className="border-b border-zinc-900 bg-zinc-950/20 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-tr from-cyan-500 to-teal-400 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/10 shrink-0">
              <Braces className="w-5.5 h-5.5 text-zinc-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-zinc-100 font-sans text-md font-bold tracking-tight">Job Board REST API Workspace</h1>
                <span className="bg-cyan-500/10 text-cyan-400 font-mono text-[9px] font-bold px-1.5 py-0.2 rounded border border-cyan-500/20">Fastify Pro</span>
              </div>
              <p className="text-zinc-500 text-[11px] leading-relaxed">Enterprise Node.js + TypeScript Backend Console Module</p>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono select-none">
            <div className="bg-zinc-900/40 border border-zinc-900 px-2.5 py-1.5 rounded-lg flex flex-col">
              <span className="text-zinc-500">DATABASE</span>
              <span className="text-zinc-300 font-semibold truncate">Postgres / Prisma</span>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-900 px-2.5 py-1.5 rounded-lg flex flex-col">
              <span className="text-zinc-500">CACHE ENGINE</span>
              <span className="text-zinc-350 font-semibold truncate">Redis Sliding RL</span>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-900 px-2.5 py-1.5 rounded-lg flex flex-col">
              <span className="text-zinc-500">DAEMON SERVICE</span>
              <span className="text-zinc-300 font-semibold truncate">BullMQ Workers</span>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-900 px-2.5 py-1.5 rounded-lg flex flex-col">
              <span className="text-zinc-500">ENCRYPTION</span>
              <span className="text-zinc-400 font-semibold truncate">JWT RS256 Auth</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Workspace layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex flex-col space-y-7">
        
        {/* Short introduction callout */}
        <section className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-900/80 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider font-mono">Backend Architecture Sandbox</h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Explore a production-grade backend design using <strong className="text-zinc-300">Fastify TypeScript</strong>, modular CRUD components, sliding-window rate limiters, fully asynchronous background queue workers, and integration tests with real-container bindings.
            </p>
          </div>
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-xl p-3 flex items-center gap-3 shrink-0">
            <span className="animate-ping h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-xs font-mono text-zinc-400">Mock Engine: HTTP/1.1 Active</span>
          </div>
        </section>

        {/* Workspace HUD Sidebar/Tab toggles */}
        <div className="flex flex-col space-y-5">
          <div className="flex border-b border-zinc-900 overflow-x-auto select-none no-scrollbar">
            <button
              onClick={() => setActiveTab("docs")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 select-none cursor-pointer ${
                activeTab === "docs"
                  ? "border-cyan-500 text-cyan-400 bg-cyan-500/5 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              API Swagger Sandbox
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 select-none cursor-pointer ${
                activeTab === "code"
                  ? "border-cyan-500 text-cyan-400 bg-cyan-500/5 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <FolderCode className="w-4 h-4" />
              Source Code Repository
            </button>
            <button
              onClick={() => setActiveTab("db")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 select-none cursor-pointer ${
                activeTab === "db"
                  ? "border-cyan-500 text-cyan-400 bg-cyan-500/5 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Database className="w-4 h-4" />
              PostgreSQL Explorer
            </button>
            <button
              onClick={() => setActiveTab("queue")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 select-none cursor-pointer ${
                activeTab === "queue"
                  ? "border-cyan-500 text-cyan-400 bg-cyan-500/5 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Layers className="w-4 h-4" />
              BullMQ Redis Queue
            </button>
            <button
              onClick={() => setActiveTab("test")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 select-none cursor-pointer ${
                activeTab === "test"
                  ? "border-cyan-500 text-cyan-400 bg-cyan-500/5 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <PlaySquare className="w-4 h-4" />
              Jest Container Testing
            </button>
            <button
              onClick={() => setActiveTab("ratelimit")}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 select-none cursor-pointer ${
                activeTab === "ratelimit"
                  ? "border-cyan-500 text-cyan-400 bg-cyan-500/5 font-bold"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Flame className="w-4 h-4 animate-pulse text-amber-500" />
              Redis Rate Limitter
            </button>
          </div>

          {/* Tab contents viewport */}
          <div className="py-2.5">
            {activeTab === "docs" && (
              <SwaggerPortal
                onDatabaseUpdate={handleUpdateDatabaseState}
                rateLimitWindow={rateLimitWindow}
                rateLimitGuest={rateLimitGuest}
                rateLimitAuthed={rateLimitAuthed}
              />
            )}

            {activeTab === "code" && (
              <CodeExplorer />
            )}

            {activeTab === "db" && (
              <DatabaseVisualizer
                onReset={handleResetDatabase}
                updateTrigger={dbUpdateTrigger}
              />
            )}

            {activeTab === "queue" && (
              <BullMQQueue
                updateTrigger={dbUpdateTrigger}
              />
            )}

            {activeTab === "test" && (
              <TerminalTester />
            )}

            {activeTab === "ratelimit" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Configuration side */}
                <div className="lg:col-span-5 bg-zinc-950 border border-zinc-900 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">Sliding Window Redis Settings</h3>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Sliding window rate limiters utilize a sorted set (ZSET) backend. Each request registers an epoch member. Expired items are discarded using <code className="text-amber-500">ZREMRANGEBYSCORE</code>.
                  </p>

                  <div className="space-y-3.5 pt-2">
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[11px] font-mono text-zinc-500 uppercase">Sliding Window Speed (ms)</label>
                      <input
                        type="number"
                        min="1000"
                        max="300000"
                        value={rateLimitWindow}
                        onChange={(e) => setRateLimitWindow(Number(e.target.value))}
                        className="bg-zinc-900 border border-zinc-800 focus:border-cyan-500 outline-none p-2 text-xs font-mono rounded text-zinc-200"
                      />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[11px] font-mono text-zinc-500 uppercase">Max Requests Bound (Guest IP)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={rateLimitGuest}
                        onChange={(e) => setRateLimitGuest(Number(e.target.value))}
                        className="bg-zinc-900 border border-zinc-800 focus:border-cyan-500 outline-none p-2 text-xs font-mono rounded text-zinc-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Practical sandbox hammer simulator */}
                <div className="lg:col-span-7 bg-zinc-950 border border-zinc-900 rounded-xl p-5 flex flex-col space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <span className="text-zinc-400 font-mono text-xs font-semibold uppercase tracking-wider">Sliding Window Interactive Stress Test</span>
                    <button
                      onClick={handleResetHammer}
                      className="text-[10px] bg-zinc-900 hover:bg-zinc-850 hover:text-zinc-200 transition-colors text-zinc-400 px-2 py-1 rounded"
                    >
                      Reset Counts
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 bg-zinc-900/10 border border-zinc-900/60 p-4 rounded-xl">
                    <div className="text-center space-y-1">
                      <div className="text-zinc-500 font-mono text-[10px] uppercase">Registered Hits in Active Window</div>
                      <div className="text-2xl font-mono font-black text-cyan-400">{hammerClicks.length}</div>
                    </div>
                    <div className="text-center space-y-1">
                      <div className="text-zinc-500 font-mono text-[10px] uppercase">Remaining Requests</div>
                      <div className="text-2xl font-mono font-black text-amber-500">
                        {Math.max(0, rateLimitGuest - hammerClicks.length)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleHammerRateLimit}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-zinc-950 font-sans font-bold text-xs py-2.5 rounded-lg transition-transform active:scale-95 cursor-pointer"
                    >
                      Hammer Server (Simulate Request)
                    </button>
                  </div>

                  {/* Simulator real time streaming terminal */}
                  <div className="bg-zinc-950/40 border border-zinc-900 rounded p-3 h-[180px] overflow-y-auto font-mono text-[11px] text-zinc-400 text-left space-y-1">
                    {hammerLogs.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-zinc-600 text-xs italic font-sans">
                        Click "Hammer Server" rapidly to test the sliding window block!
                      </div>
                    ) : (
                      hammerLogs.map((log, i) => (
                        <div key={i} className={`truncate ${log.includes("BLOCKED") ? "text-rose-450 font-medium" : "text-zinc-350"}`}>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer footer hud */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 mt-auto text-center text-zinc-650 font-mono text-[11px] uppercase">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>Job platform Backend spec v1.0.0</span>
          <span className="text-zinc-550 select-none">senior back-end engineer workspace dashboard</span>
        </div>
      </footer>
    </div>
  );
}
