import React, { useState } from "react";
import { mockDb, MockUser, MockCompany, MockJob, MockApplication } from "../data/mockServer";
import { Users, Building, Briefcase, FileText, CheckCircle2, Star, ShieldAlert, BadgeInfo, RotateCcw } from "lucide-react";

interface DatabaseVisualizerProps {
  onReset: () => void;
  updateTrigger: number;
}

export default function DatabaseVisualizer({ onReset, updateTrigger }: DatabaseVisualizerProps) {
  const [activeTab, setActiveTab] = useState<"users" | "companies" | "jobs" | "applications">("jobs");

  // Load the current rows
  const users = [...mockDb.users];
  const companies = [...mockDb.companies];
  const jobs = [...mockDb.jobs];
  const applications = [...mockDb.applications];

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden flex flex-col min-h-[480px]">
      {/* Visual Header */}
      <div className="p-4 bg-zinc-900/10 border-b border-zinc-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BadgeInfo className="w-4 h-4 text-cyan-400" />
          <h3 className="text-zinc-200 font-sans text-xs font-semibold tracking-wider font-mono uppercase">
            Active Relational PostgreSQL Mock State (Prisma Logs)
          </h3>
        </div>
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 bg-zinc-900/60 hover:bg-zinc-905 border border-zinc-805 hover:border-zinc-705 text-zinc-300 font-sans text-xs px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
          Reset Database State
        </button>
      </div>

      {/* Tabs list to toggle tables */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-zinc-900 bg-zinc-950 p-2 gap-1.5">
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-lg transition-all ${
            activeTab === "users"
              ? "bg-zinc-900 text-cyan-400 border border-zinc-800"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("companies")}
          className={`flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-lg transition-all ${
            activeTab === "companies"
              ? "bg-zinc-900 text-cyan-400 border border-zinc-800"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          companies ({companies.length})
        </button>
        <button
          onClick={() => setActiveTab("jobs")}
          className={`flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-lg transition-all ${
            activeTab === "jobs"
              ? "bg-zinc-900 text-cyan-400 border border-zinc-800"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          jobs ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          className={`flex items-center justify-center gap-2 text-xs font-semibold py-2 rounded-lg transition-all ${
            activeTab === "applications"
              ? "bg-zinc-900 text-cyan-400 border border-zinc-800"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          applications ({applications.length})
        </button>
      </div>

      {/* Table Data Viewport */}
      <div className="p-5 overflow-x-auto">
        {activeTab === "users" && (
          <table className="w-full text-left font-mono text-xs border-collapse divide-y divide-zinc-900 min-w-[600px]">
            <thead>
              <tr className="text-zinc-500 text-[10px] tracking-wider uppercase font-semibold">
                <th className="pb-3.5">ID</th>
                <th className="pb-3.5">EMAIL</th>
                <th className="pb-3.5">NAME</th>
                <th className="pb-3.5">ROLE TYPE</th>
                <th className="pb-3.5">VERIFIED BADGE</th>
                <th className="pb-3.5">CREATED AT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-zinc-900/20">
                  <td className="py-3 text-cyan-400 select-all font-medium pr-2">{u.id}</td>
                  <td className="py-3 select-all pr-4">{u.email}</td>
                  <td className="py-3 font-sans font-medium text-zinc-200 pr-4">{u.name}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      u.role === "ADMIN" ? "bg-purple-500/15 text-purple-400 border border-purple-500/20" :
                      u.role === "MODERATOR" ? "bg-amber-500/15 text-amber-500 border border-amber-500/20" :
                      "bg-zinc-800 text-zinc-400"
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3">
                    {u.isVerified ? (
                      <span className="text-emerald-400 flex items-center gap-1.5 text-[11px] font-sans">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        Active Primary
                      </span>
                    ) : (
                      <span className="text-zinc-500 italic">Unasserted</span>
                    )}
                  </td>
                  <td className="py-3 text-zinc-500 text-[11px]">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "companies" && (
          <table className="w-full text-left font-mono text-xs border-collapse divide-y divide-zinc-900 min-w-[600px]">
            <thead>
              <tr className="text-zinc-500 text-[10px] tracking-wider uppercase font-semibold">
                <th className="pb-3.5">ID</th>
                <th className="pb-3.5">NAME</th>
                <th className="pb-3.5">WEBSITE</th>
                <th className="pb-3.5">OWNER ID</th>
                <th className="pb-3.5">TRUST BADGE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
              {companies.map(c => (
                <tr key={c.id} className="hover:bg-zinc-900/20">
                  <td className="py-3 text-cyan-200 select-all pr-2">{c.id}</td>
                  <td className="py-3 text-zinc-100 font-sans font-semibold pr-4">
                    <div className="flex items-center gap-2">
                      {c.logoUrl && <img src={c.logoUrl} alt={c.name} className="w-5 h-5 rounded-md object-cover bg-zinc-900 border border-zinc-800" referrerPolicy="no-referrer" />}
                      <span>{c.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 select-all">
                    <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline">{c.website}</a>
                  </td>
                  <td className="py-3 text-zinc-400 select-all pr-4">{c.ownerId}</td>
                  <td className="py-3">
                    {c.isVerified ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded flex items-center gap-1.5 w-fit font-sans font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                        Enterprise Match Verified
                      </span>
                    ) : (
                      <span className="bg-zinc-900/50 text-zinc-500 border border-zinc-800 text-[10px] px-2 py-0.5 rounded w-fit block font-sans">
                        Pending Admin Audit
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "jobs" && (
          <table className="w-full text-left font-mono text-xs border-collapse divide-y divide-zinc-900 min-w-[650px]">
            <thead>
              <tr className="text-zinc-500 text-[10px] tracking-wider uppercase font-semibold">
                <th className="pb-3.5">ID</th>
                <th className="pb-3.5">JOB TITLE</th>
                <th className="pb-3.5">COMPANY ID</th>
                <th className="pb-3.5">LOCATION</th>
                <th className="pb-3.5">SALARY BOUNDS</th>
                <th className="pb-3.5">MODERATION STATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
              {jobs.map(j => (
                <tr key={j.id} className="hover:bg-zinc-900/20">
                  <td className="py-3 text-cyan-400 select-all font-medium pr-2">{j.id}</td>
                  <td className="py-3 font-sans font-bold text-zinc-100 pr-4">{j.title}</td>
                  <td className="py-3 text-zinc-400 select-all pr-4">{j.companyId}</td>
                  <td className="py-3 pr-4">{j.location}</td>
                  <td className="py-3 pr-4 font-semibold text-zinc-200">
                    ${j.salaryMin.toLocaleString()} - ${j.salaryMax.toLocaleString()}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-1.5">
                      {j.isFeatured && (
                        <span className="bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 font-sans font-bold shrink-0">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          FEATURED
                        </span>
                      )}
                      {j.isModerated ? (
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] px-1.5 py-0.5 rounded font-sans font-bold shrink-0">
                          APPROVED
                        </span>
                      ) : (
                        <span className="bg-zinc-900 text-zinc-500 border border-zinc-850 text-[9px] px-1.5 py-0.5 rounded font-sans font-bold shrink-0">
                          QUEUE MOD_P
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "applications" && (
          <table className="w-full text-left font-mono text-xs border-collapse divide-y divide-zinc-900 min-w-[600px]">
            <thead>
              <tr className="text-zinc-500 text-[10px] tracking-wider uppercase font-semibold">
                <th className="pb-3.5">ID</th>
                <th className="pb-3.5">USER CANDIDATE</th>
                <th className="pb-3.5">VACANCY JOB ID</th>
                <th className="pb-3.5">RESUME PDF</th>
                <th className="pb-3.5">APPLICATION PROCESS STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
              {applications.map(a => (
                <tr key={a.id} className="hover:bg-zinc-900/20 font-mono">
                  <td className="py-3 text-cyan-400 select-all font-medium pr-2">{a.id}</td>
                  <td className="py-3 text-zinc-400 select-all pr-4">{a.userId}</td>
                  <td className="py-3 text-zinc-400 select-all pr-4">{a.jobId}</td>
                  <td className="py-3 select-all text-cyan-500 hover:text-cyan-400 pr-4 truncate max-w-[150px]">
                    <a href={a.resumeUrl} target="_blank" rel="noopener noreferrer">{a.resumeUrl.split("/").pop()}</a>
                  </td>
                  <td className="py-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                      a.status === "APPLIED" ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/20" :
                      a.status === "REVIEWED" ? "bg-amber-500/15 text-amber-500 border border-amber-500/20" :
                      a.status === "INTERVIEWING" ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" :
                      a.status === "ACCEPTED" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" :
                      "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
