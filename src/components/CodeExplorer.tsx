import React, { useState } from "react";
import { SOURCE_FILES, SourceFile } from "../data/sourceFiles";
import { FolderCode, FileText, Copy, Check, Info, FileStack, Cpu, CheckSquare } from "lucide-react";

export default function CodeExplorer() {
  const [activeFilePath, setActiveFilePath] = useState(SOURCE_FILES[0].path);
  const [copiedCode, setCopiedCode] = useState(false);

  const activeFile = SOURCE_FILES.find(f => f.path === activeFilePath) || SOURCE_FILES[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Group files by category titles
  const categories: Record<string, { title: string; icon: any; files: SourceFile[] }> = {
    prisma: {
      title: "Prisma Modeling",
      icon: FileStack,
      files: SOURCE_FILES.filter(f => f.category === "prisma")
    },
    "core-errors": {
      title: "Core Responders",
      icon: Info,
      files: SOURCE_FILES.filter(f => f.category === "core-errors")
    },
    "core-middleware": {
      title: "Gatekeepers/RL middleware",
      icon: Cpu,
      files: SOURCE_FILES.filter(f => f.category === "core-middleware")
    },
    "modules-auth": {
      title: "Auth Module Module",
      icon: FolderCode,
      files: SOURCE_FILES.filter(f => f.category === "modules-auth")
    },
    "modules-jobs": {
      title: "Jobs Module Module",
      icon: FolderCode,
      files: SOURCE_FILES.filter(f => f.category === "modules-jobs")
    },
    tests: {
      title: "Test Pipelines",
      icon: CheckSquare,
      files: SOURCE_FILES.filter(f => f.category === "tests")
    },
    infra: {
      title: "Operations (Docker/CI)",
      icon: FileStack,
      files: SOURCE_FILES.filter(f => f.category === "infra")
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Sidebar Explorer */}
      <div className="lg:col-span-4 bg-zinc-950 border border-zinc-900 rounded-xl p-4 flex flex-col space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
          <span className="text-zinc-400 text-xs font-mono font-semibold tracking-wider uppercase">Workspace Repository Tree</span>
          <span className="text-[10px] text-zinc-500 font-mono">10 complete templates</span>
        </div>

        <div className="space-y-4 flex-1 overflow-y-auto max-h-[600px] pr-1">
          {Object.entries(categories).map(([key, data]) => {
            if (data.files.length === 0) return null;
            const CategoryIcon = data.icon;

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-semibold text-zinc-400 font-mono tracking-wider uppercase bg-zinc-900/40 rounded">
                  <CategoryIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span>{data.title}</span>
                </div>
                <div className="mt-1.5 pl-2 space-y-0.5 border-l border-zinc-900 ml-3">
                  {data.files.map(f => {
                    const isSelected = activeFilePath === f.path;
                    return (
                      <button
                        key={f.path}
                        onClick={() => setActiveFilePath(f.path)}
                        className={`w-full flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                          isSelected
                            ? "bg-gradient-to-r from-cyan-500/10 to-teal-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className={`w-3.5 h-3.5 ${isSelected ? "text-cyan-400" : "text-zinc-500"}`} />
                          <span className="truncate">{f.name}</span>
                        </div>
                        <span className="text-[9px] scale-95 opacity-50 bg-zinc-900 px-1 rounded uppercase">
                          {f.language}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Code viewer container */}
      <div className="lg:col-span-8 bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden flex flex-col min-h-[500px]">
        {/* Editor controls info bar */}
        <div className="px-5 py-3.5 border-b border-zinc-900 bg-zinc-900/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider">Active Workspace File Path</div>
            <div className="text-zinc-200 font-mono text-xs font-semibold select-all pt-0.5">{activeFile.path}</div>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-sans text-xs px-4 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? "Copy Success" : "Copy Code"}
          </button>
        </div>

        {/* Short description banner */}
        <div className="bg-zinc-900/30 px-5 py-2.5 border-b border-zinc-900 flex items-center gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="text-xs text-zinc-400 font-sans font-medium select-text leading-tight sm:line-clamp-1">
            {activeFile.description}
          </span>
        </div>

        {/* Code code editor block */}
        <div className="flex-1 p-5 overflow-auto bg-zinc-950">
          <pre className="font-mono text-xs text-zinc-300 leading-relaxed outline-none select-all min-w-full block scrollbar-thin text-left">
            <code>{activeFile.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
