import React, { useEffect, useState } from "react";
import { mockDb, QueueJob } from "../data/mockServer";
import { Play, Sparkles, AlertCircle, Clock, Loader2, RefreshCw, Layers } from "lucide-react";

interface BullMQQueueProps {
  updateTrigger: number;
}

export default function BullMQQueue({ updateTrigger }: BullMQQueueProps) {
  const [queues, setQueues] = useState<QueueJob[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "email" | "reports">("all");
  const [autoProcessor, setAutoProcessor] = useState(true);

  // Sync to internal database state
  useEffect(() => {
    setQueues([...mockDb.queueJobs]);
  }, [updateTrigger, mockDb.queueJobs.length]);

  // Simulated queue background processor
  useEffect(() => {
    if (!autoProcessor) return;

    const interval = setInterval(() => {
      let changed = false;
      const nextQueues = queues.map(job => {
        if (job.status === "waiting") {
          changed = true;
          return {
            ...job,
            status: "active" as const,
            progress: 15,
            logs: [...job.logs, `[Worker] Picked up by process_fork #1844`, `[Worker] Initializing queue context payload...`]
          };
        }
        if (job.status === "active") {
          changed = true;
          const nextProgress = job.progress + 25;
          if (nextProgress >= 100) {
            // Completed job
            let finalLogs = [...job.logs, `[Worker] Execution steps finished. Progress=100%`];
            if (job.name.includes("Welcome")) {
              finalLogs.push(`[SMTP Worker] Sent welcome email digest to candidate successfully via Nodemailer!`);
            } else if (job.name.includes("Employer")) {
              finalLogs.push(`[SMTP Worker] Sent vacancy application notification email to employer!`);
            } else if (job.name.includes("Status")) {
              finalLogs.push(`[SMTP Worker] Sent status path change notice to applicant user!`);
            } else {
              finalLogs.push(`[Cron Worker] Automated administrative reports compiled clean!`);
            }
            return {
              ...job,
              status: "completed" as const,
              progress: 100,
              logs: finalLogs
            };
          } else {
            // Update mid progress steps
            return {
              ...job,
              progress: nextProgress,
              logs: [...job.logs, `[Worker] Processing sequence steps... progress=${nextProgress}%`]
            };
          }
        }
        return job;
      });

      if (changed) {
        mockDb.queueJobs = nextQueues;
        setQueues(nextQueues);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [queues, autoProcessor]);

  const triggerMockReportJob = () => {
    mockDb.enqueue("reports-queue", "Weekly Administrative Job Application Report", {
      adminUser: "usr-admin-1",
      matchingThresholdPercentage: 85,
      compiledAt: new Date().toISOString()
    });
    setQueues([...mockDb.queueJobs]);
  };

  const filteredJobs = queues.filter(j => {
    if (activeTab === "email") return j.queue === "email-queue";
    if (activeTab === "reports") return j.queue === "reports-queue";
    return true;
  });

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden min-h-[480px] flex flex-col">
      {/* Visual HUD header */}
      <div className="p-4 bg-zinc-900/10 border-b border-zinc-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-zinc-200 font-sans text-xs font-semibold tracking-wider font-mono uppercase">
            BullMQ Redis Queue Worker Status Panel (IO-Redis connection)
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoProcessor(!autoProcessor)}
            className={`flex items-center justify-center gap-1.5 border px-3 py-1 text-xs font-medium rounded-lg transition-all active:scale-95 cursor-pointer ${
              autoProcessor
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-semibold"
                : "bg-zinc-900 border-zinc-800 text-zinc-500"
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${autoProcessor ? "animate-spin" : ""}`} />
            {autoProcessor ? "Workers Active" : "Workers Idle"}
          </button>
          <button
            onClick={triggerMockReportJob}
            className="flex items-center gap-1.5 bg-zinc-90 w-fit shrink-0 hover:bg-zinc-905 border border-zinc-805 text-zinc-300 font-sans text-xs px-3 py-1 rounded-lg transition-all active:scale-95 cursor pointer"
          >
            Enqueue Report Job
          </button>
        </div>
      </div>

      {/* Selector Filter Tabs */}
      <div className="flex border-b border-zinc-900 bg-zinc-950/40 p-2 gap-1.5">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-3 py-1 rounded text-xs font-semibold ${
            activeTab === "all" ? "bg-zinc-900 text-cyan-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          All Items ({queues.length})
        </button>
        <button
          onClick={() => setActiveTab("email")}
          className={`px-3 py-1 rounded text-xs font-semibold ${
            activeTab === "email" ? "bg-zinc-900 text-cyan-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          email-queue ({queues.filter(q => q.queue === "email-queue").length})
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-3 py-1 rounded text-xs font-semibold ${
            activeTab === "reports" ? "bg-zinc-900 text-cyan-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          reports-queue ({queues.filter(q => q.queue === "reports-queue").length})
        </button>
      </div>

      {/* Main Jobs Listing list */}
      <div className="flex-grow p-4 space-y-3 overflow-y-auto max-h-[380px] bg-zinc-950">
        {filteredJobs.length === 0 ? (
          <div className="h-[250px] flex flex-col items-center justify-center text-center text-zinc-600 font-sans font-light">
            <AlertCircle className="w-10 h-10 mb-2 stroke-[1.2]" />
            <p className="text-xs">No active bullmq queue transactions found.</p>
            <p className="text-[10px] text-zinc-700 font-mono mt-1">Register accounts or apply to jobs inside Swagger to queue emails!</p>
          </div>
        ) : (
          filteredJobs.map(job => (
            <div key={job.id} className="bg-zinc-900/40 border border-zinc-905 rounded-xl p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 font-mono text-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-cyan-400">{job.name}</span>
                    <span className="bg-zinc-800 text-[10px] text-zinc-400 px-1.5 py-0.2 rounded">{job.id}</span>
                  </div>
                  <div className="text-[10px] text-zinc-500 font-sans mt-0.5">QUEUE REFERENCE: <strong className="text-zinc-400 font-mono text-[10px]">{job.queue}</strong></div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                  {job.status === "waiting" && (
                    <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      WAITING IN REDIS
                    </span>
                  )}
                  {job.status === "active" && (
                    <span className="bg-yellow-500/10 text-yellow-400 text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                      <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />
                      ACTIVE WORKER
                    </span>
                  )}
                  {job.status === "completed" && (
                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-semibold">
                      COMPLETED SUCCESS
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar line */}
              <div className="flex items-center gap-3">
                <div className="flex-grow bg-zinc-950 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-teal-400 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${job.progress}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-zinc-400 w-8 text-right">{job.progress}%</span>
              </div>

              {/* Worker sub logs container terminal */}
              <div className="bg-zinc-950 p-2.5 rounded font-mono text-[11px] text-zinc-400 max-h-[80px] overflow-y-auto space-y-0.5 text-left border border-zinc-900">
                {job.logs.map((log, index) => (
                  <div key={index} className="truncate">
                    <span className="text-zinc-650 font-semibold select-none">{`>`}</span> {log}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
