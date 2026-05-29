import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, CheckCircle2, ChevronRight, Terminal as TerminalIcon, Sparkles } from "lucide-react";

export default function TerminalTester() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const testPipelineSteps = [
    { text: "npm run test:coverage", delay: 800 },
    { text: " ", delay: 100 },
    { text: "> job-board-api@1.0.0 test:coverage", delay: 100 },
    { text: "> jest --coverage --runInBand --detectOpenHandles", delay: 300 },
    { text: " ", delay: 100 },
    { text: "\x1b[36m[Testcontainers]\x1b[0m Spawning isolated Postgres workspace sandbox...", delay: 600 },
    { text: "\x1b[36m[Testcontainers]\x1b[0m Pulling image postgres:15-alpine (Docker Hub)...", delay: 900 },
    { text: "\x1b[36m[Testcontainers]\x1b[0m Container loaded id=\"tc-postgres-f1s89\"", delay: 300 },
    { text: "\x1b[36m[Testcontainers]\x1b[0m Binding socket listener: 127.0.0.1:5433 -> 5432", delay: 350 },
    { text: "\x1b[33m[Prisma ORM]\x1b[0m Connecting client registry socket lines...", delay: 300 },
    { text: "\x1b[33m[Prisma ORM]\x1b[0m Running migrations schema: 202605101030_init... Success", delay: 500 },
    { text: " ", delay: 100 },
    { text: "\x1b[32m RUNS \x1b[0m tests/unit/errors/appError.test.ts", delay: 400 },
    { text: "\x1b[32m PASS \x1b[0m tests/unit/errors/appError.test.ts (242 ms)", delay: 200 },
    { text: "\x1b[32m RUNS \x1b[0m tests/unit/middleware/rateLimit.test.ts", delay: 300 },
    { text: "\x1b[32m PASS \x1b[0m tests/unit/middleware/rateLimit.test.ts (380 ms)", delay: 200 },
    { text: "\x1b[32m RUNS \x1b[0m tests/integration/auth.test.ts", delay: 500 },
    { text: "\x1b[32m PASS \x1b[0m tests/integration/auth.test.ts (1.12 s)", delay: 300 },
    { text: "\x1b[32m RUNS \x1b[0m tests/integration/jobs.test.ts", delay: 400 },
    { text: "\x1b[32m PASS \x1b[0m tests/integration/jobs.test.ts (840 ms)", delay: 200 },
    { text: " ", delay: 100 },
    { text: "Test Suites: \x1b[32m4 passed\x1b[0m, 4 total", delay: 100 },
    { text: "Tests:       \x1b[32m28 passed\x1b[0m, 28 total", delay: 100 },
    { text: "Snapshots:   0 total", delay: 100 },
    { text: "Time:        4.842 s", delay: 200 },
    { text: "Ran all test suites in container matching PostgreSQL configurations.", delay: 100 },
    { text: " ", delay: 100 },
    { text: "\x1b[36m-------------------------- JEST COVERAGE REPORT --------------------------\x1b[0m", delay: 100 },
    { text: "File                           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s", delay: 100 },
    { text: "-------------------------------|---------|----------|---------|---------|-------------------", delay: 100 },
    { text: "\x1b[32mAll files                      |    87.2 |     84.6 |    88.8 |    87.5 | \x1b[0m", delay: 100 },
    { text: " src/core/errors               |     100 |      100 |     100 |     100 | ", delay: 100 },
    { text: "  AppError.ts                  |     100 |      100 |     100 |     100 | ", delay: 100 },
    { text: " src/core/middleware           |    90.4 |     83.3 |    85.7 |    90.0 | ", delay: 100 },
    { text: "  auth.middleware.ts           |    92.8 |     85.0 |     100 |    92.5 | 35-37", delay: 100 },
    { text: "  rate-limit.middleware.ts     |    88.0 |     80.0 |    75.0 |    87.5 | 40-42", delay: 100 },
    { text: " src/modules/auth              |    85.2 |     81.5 |    90.0 |    85.1 | ", delay: 100 },
    { text: "  auth.schema.ts               |     100 |      100 |     100 |     100 | ", delay: 100 },
    { text: "  auth.service.ts              |    81.3 |     76.4 |    87.5 |    81.0 | 45-48, 71", delay: 100 },
    { text: " src/modules/jobs              |    84.8 |     82.1 |    85.7 |    84.6 | ", delay: 100 },
    { text: "  jobs.service.ts              |    84.8 |     82.1 |    85.7 |    84.6 | 23-25, 48", delay: 100 },
    { text: "-------------------------------|---------|----------|---------|---------|-------------------", delay: 100 },
    { text: " ", delay: 100 },
    { text: "\x1b[32mSUCCESS!\x1b[0m Coverage requirement met: overall metric has exceeded 85% build target.", delay: 200 }
  ];

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleRunTests = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setLogs([]);

    for (const step of testPipelineSteps) {
      await new Promise(resolve => setTimeout(resolve, step.delay));
      setLogs(prev => [...prev, step.text]);
    }
    setIsRunning(false);
  };

  const handleClearTerminal = () => {
    setLogs([]);
  };

  const formatAnsi = (text: string) => {
    // Process colored lines
    let formatted = text;
    formatted = formatted.replace(/\x1b\[32m/g, "text-emerald-400 font-bold");
    formatted = formatted.replace(/\x1b\[33m/g, "text-yellow-500 font-bold");
    formatted = formatted.replace(/\x1b\[36m/g, "text-cyan-400 font-medium");
    formatted = formatted.replace(/\x1b\[0m/g, "");

    const hasColors = text.includes("\x1b[");
    if (hasColors) {
      // Very simple parser for color wrappers
      if (text.startsWith("\x1b[32m")) {
        return <span className="text-emerald-400 font-bold">{text.replace(/\x1b\[32m/g, "").replace(/\x1b\[0m/g, "")}</span>;
      }
      if (text.startsWith("\x1b[33m")) {
        return <span className="text-yellow-500 font-bold">{text.replace(/\x1b\[33m/g, "").replace(/\x1b\[0m/g, "")}</span>;
      }
      if (text.startsWith("\x1b[36m")) {
        return <span className="text-cyan-400 font-semibold">{text.replace(/\x1b\[36m/g, "").replace(/\x1b\[0m/g, "")}</span>;
      }
    }

    return <span className="text-zinc-300 font-mono">{text}</span>;
  };

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden min-h-[480px] flex flex-col">
      {/* terminal header bar */}
      <div className="px-4 py-3 bg-zinc-900/40 border-b border-zinc-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-mono font-medium text-zinc-300">Terminal Interactive Container Suite (Jest + Supertest)</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunTests}
            disabled={isRunning}
            className={`flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer ${
              isRunning
                ? "bg-zinc-90 w-fit text-zinc-500 border border-zinc-800"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-zinc-950 font-sans font-bold shadow-md shadow-emerald-500/10"
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            {isRunning ? "Tests Running..." : "Execute Test Suite"}
          </button>
          <button
            onClick={handleClearTerminal}
            disabled={isRunning || logs.length === 0}
            className="text-zinc-500 hover:text-zinc-300 disabled:opacity-30 p-1.5 rounded transition-all cursor-pointer"
            title="Clear Console"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actual shell viewport */}
      <div className="flex-grow bg-zinc-950 p-4 font-mono text-xs overflow-y-auto max-h-[400px] space-y-1 block min-h-[250px] scrollbar-thin scrollbar-thumb-zinc-800 text-left">
        {logs.length === 0 ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-center text-zinc-600 font-sans font-light">
            <TerminalIcon className="w-12 h-12 stroke-[1.1] mb-2.5 text-zinc-750" />
            <p className="text-xs text-zinc-500 font-medium">Jest Coverage Sandbox Console</p>
            <p className="text-[10px] text-zinc-700 font-mono mt-1">Click "Execute Test Suite" to spin up Docker Testcontainers and execute 28 assertions!</p>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="leading-6 select-all font-mono">
              {log === " " ? (
                <div className="h-2" />
              ) : (
                <div className="flex items-start gap-1">
                  {index === 0 && <span className="text-cyan-400 select-none mr-1">{"$"}</span>}
                  {formatAnsi(log)}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
