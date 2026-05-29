import React, { useState } from "react";
import { ENDPOINTS, Endpoint } from "../types";
import { executeRestRequest, mockDb } from "../data/mockServer";
import { Play, Copy, Check, ChevronDown, ChevronRight, HelpCircle, ShieldAlert, KeyRound, Server } from "lucide-react";

interface SwaggerPortalProps {
  onDatabaseUpdate: () => void;
  rateLimitWindow: number;
  rateLimitGuest: number;
  rateLimitAuthed: number;
}

export default function SwaggerPortal({
  onDatabaseUpdate,
  rateLimitWindow,
  rateLimitGuest,
  rateLimitAuthed
}: SwaggerPortalProps) {
  const [activeEndpointId, setActiveEndpointId] = useState<string>("/api/auth/register-POST");
  const [params, setParams] = useState<Record<string, string>>({});
  const [customHeaders, setCustomHeaders] = useState<string>(`{\n  "Authorization": "Bearer click_autologin_below"\n}`);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [apiOutputs, setApiOutputs] = useState<Record<string, { status: number; body: any; headers: any; pinoLogs: string[] }>>({});
  const [customTokenSeedUser, setCustomTokenSeedUser] = useState<"applicant" | "admin" | "none">("none");

  // Helper to create key
  const getEndpointKey = (ep: Endpoint) => `${ep.path}-${ep.method}`;

  const handleAutofillToken = (role: "applicant" | "admin" | "none") => {
    setCustomTokenSeedUser(role);
    if (role === "none") {
      setCustomHeaders(`{\n  "Authorization": ""\n}`);
      return;
    }

    const payload = role === "applicant" 
      ? { email: "candidate@gmail.com", name: "Sarah Jenkins", role: "USER" }
      : { email: "engineering@techjobs.com", name: "Alex Devmaster (Admin)", role: "ADMIN" };

    const encoded = btoa(JSON.stringify(payload));
    const headerObj = {
      "Authorization": `Bearer ${encoded}`
    };
    setCustomHeaders(JSON.stringify(headerObj, null, 2));
  };

  const handleRunEndpoint = (ep: Endpoint) => {
    const key = getEndpointKey(ep);
    
    // Aggregate values
    const payloadBody = ep.requestBody ? { ...ep.requestBody.defaultValues } : {};
    
    // Override manual textboxes
    if (ep.requestBody) {
      Object.keys(ep.requestBody.schema).forEach(field => {
        const inputKey = `${key}-${field}`;
        if (params[inputKey] !== undefined) {
          const rawVal = params[inputKey];
          // Try parse numbers or arrays
          if (!isNaN(Number(rawVal)) && rawVal.trim() !== "") {
            payloadBody[field] = Number(rawVal);
          } else if (rawVal.startsWith("[") && rawVal.endsWith("]")) {
            try { payloadBody[field] = JSON.parse(rawVal); } catch { payloadBody[field] = rawVal; }
          } else {
            payloadBody[field] = rawVal;
          }
        }
      });
    }

    // Dynamic Route String Replacement for paths like /api/jobs/:id or /api/applications/:id/status
    let actualPath = ep.path;
    if (actualPath.includes(":")) {
      // Find parameter values inside textbox or default
      const idParamKey = `${key}-id`;
      const idValue = params[idParamKey] || ep.requestBody?.defaultValues.id || "app-1";
      actualPath = actualPath.replace(":id", idValue);
    }

    // Process custom headers
    let headersParsed: Record<string, string> = { "x-forwarded-for": "127.0.0.1" };
    try {
      if (customHeaders.trim() !== "") {
        headersParsed = { ...headersParsed, ...JSON.parse(customHeaders) };
      }
    } catch {
      // fall back
    }

    // Execute Mock Endpoint
    const result = executeRestRequest(
      ep.method,
      actualPath,
      payloadBody,
      headersParsed,
      {
        windowMs: rateLimitWindow,
        maxGuest: rateLimitGuest,
        maxAuthed: rateLimitAuthed
      }
    );

    setApiOutputs(prev => ({
      ...prev,
      [key]: {
        status: result.status,
        body: result.body,
        headers: result.headers,
        pinoLogs: result.pinoLogs
      }
    }));

    // Trigger state changes up
    onDatabaseUpdate();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  // Convert pino json string strings to readable logs
  const renderLogMessage = (rawJson: string) => {
    try {
      const obj = JSON.parse(rawJson);
      let levelText = "INFO";
      let levelColor = "text-sky-400";
      if (obj.level === 40) { levelText = "WARN"; levelColor = "text-amber-500"; }
      if (obj.level === 45) { levelText = "WARN"; levelColor = "text-amber-500"; }
      if (obj.level === 50) { levelText = "ERROR"; levelColor = "text-rose-500"; }

      return (
        <div key={obj.time + Math.random()} className="font-mono text-xs select-text leading-5 py-0.5 border-b border-zinc-900">
          <span className="text-zinc-500">[{new Date(obj.time).toLocaleTimeString()}]</span>{" "}
          <span className={`font-semibold ${levelColor}`}>{levelText}</span>{" "}
          <span className="text-purple-400">({obj.reqId})</span>:{" "}
          <span className="text-zinc-200">{obj.msg}</span>
        </div>
      );
    } catch {
      return <div key={Math.random()} className="font-mono text-xs select-text text-zinc-400 py-0.5">{rawJson}</div>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
      {/* Endpoint List Left Panel */}
      <div className="lg:col-span-5 bg-zinc-950 border border-zinc-900 rounded-xl p-4 overflow-y-auto max-h-[700px]">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-900 pb-3">
          <span className="text-zinc-400 text-xs font-mono font-semibold tracking-wider uppercase">OpenAPI Specification Spec v3.0</span>
          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono font-medium border border-emerald-500/20">LIVE ACTIVE</span>
        </div>

        {/* Global Security / JWT Quick Injector helper */}
        <div className="bg-zinc-900/40 border border-zinc-900 rounded-lg p-3.5 mb-5 space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-semibold text-zinc-300 font-sans tracking-tight">JWT Authorization / Session Emulator</h4>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            The API enforces asymmetric <strong className="text-zinc-400 font-mono">RS256 signatures</strong>. Sign in below to auto-inject mock JWT payload tokens into the standard headers field!
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-900">
            <button
              onClick={() => handleAutofillToken("none")}
              className={`text-[10px] py-1.5 px-2 font-mono rounded border transition-all ${
                customTokenSeedUser === "none"
                  ? "bg-zinc-800 text-zinc-200 border-zinc-700 font-semibold"
                  : "bg-zinc-950/40 text-zinc-400 border-zinc-900 hover:text-zinc-300 hover:border-zinc-800"
              }`}
            >
              Guest (Anonym)
            </button>
            <button
              onClick={() => handleAutofillToken("applicant")}
              className={`text-[10px] py-1.5 px-2 font-mono rounded border transition-all ${
                customTokenSeedUser === "applicant"
                  ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 font-semibold"
                  : "bg-zinc-950/40 text-zinc-400 border-zinc-900 hover:text-cyan-400 hover:border-cyan-500/10"
              }`}
            >
              Sarah (Candidate)
            </button>
            <button
              onClick={() => handleAutofillToken("admin")}
              className={`text-[10px] py-1.5 px-2 font-mono rounded border transition-all ${
                customTokenSeedUser === "admin"
                  ? "bg-purple-500/15 text-purple-400 border-purple-500/30 font-semibold"
                  : "bg-zinc-950/40 text-zinc-400 border-zinc-900 hover:text-purple-400 hover:border-purple-500/10"
              }`}
            >
              Alex (Admin)
            </button>
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-2">
          {ENDPOINTS.map(ep => {
            const key = getEndpointKey(ep);
            const isActive = activeEndpointId === key;
            const methodColors = {
              GET: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
              POST: "bg-purple-500/15 text-purple-400 border-purple-500/30",
              PATCH: "bg-blue-500/15 text-blue-400 border-blue-500/30",
              DELETE: "bg-rose-500/15 text-rose-400 border-rose-500/30"
            };

            return (
              <div
                key={key}
                onClick={() => setActiveEndpointId(key)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? "bg-zinc-900 border-zinc-700/60 shadow-lg shadow-black/40"
                    : "bg-zinc-950 hover:bg-zinc-900/60 border-zinc-900 hover:border-zinc-800"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${methodColors[ep.method]}`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-semibold text-zinc-200 select-all truncate">
                    {ep.path}
                  </span>
                </div>
                <div className="mt-1.5 text-[11px] text-zinc-400 font-sans font-medium line-clamp-1">
                  {ep.summary}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Endpoint details Playground Right Panel */}
      <div className="lg:col-span-12 xl:col-span-7 flex flex-col space-y-6">
        {(() => {
          const ep = ENDPOINTS.find(e => getEndpointKey(e) === activeEndpointId);
          if (!ep) return <div className="p-4 text-center text-zinc-600">Select an endpoint payload to begin testing</div>;

          const key = getEndpointKey(ep);
          const lastOutput = apiOutputs[key];
          
          return (
            <div className="bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden flex flex-col">
              {/* Header block */}
              <div className="p-4 border-b border-zinc-900 bg-zinc-900/20">
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-bold px-2.5 py-0.7 rounded border ${
                    ep.method === "GET" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                    ep.method === "POST" ? "bg-purple-500/15 text-purple-400 border-purple-500/30" :
                    ep.method === "PATCH" ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
                    "bg-rose-500/15 text-rose-400 border-rose-500/30"
                  }`}>
                    {ep.method}
                  </span>
                  <h3 className="font-mono text-sm font-semibold text-zinc-100 select-all">{ep.path}</h3>
                </div>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed font-sans font-medium">
                  {ep.description}
                </p>
              </div>

              {/* Grid content and inputs */}
              <div className="p-5 space-y-5 border-b border-zinc-900">
                {/* Headers custom payload block */}
                <div>
                  <h4 className="text-xs font-medium text-zinc-300 font-mono mb-2">Request Headers (JSON)</h4>
                  <textarea
                    value={customHeaders}
                    onChange={(e) => setCustomHeaders(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-900 hover:border-zinc-800 focus:border-cyan-500 text-zinc-200 font-mono text-xs rounded-lg p-3 outline-none transition-all resize-none"
                  />
                </div>

                {/* Request Variables Input Fields */}
                {ep.requestBody && (
                  <div>
                    <h4 className="text-xs font-medium text-zinc-300 font-mono mb-2">Request Parameters / JSON Body Config</h4>
                    <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-4 space-y-4">
                      {Object.entries(ep.requestBody.schema).map(([field, desc]) => {
                        const inputKey = `${key}-${field}`;
                        const val = params[inputKey] === undefined ? ep.requestBody!.defaultValues[field] : params[inputKey];
                        
                        return (
                          <div key={field} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                            <label className="md:col-span-3 text-xs font-mono font-medium text-zinc-400">{field}</label>
                            <div className="md:col-span-9 flex flex-col space-y-1">
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => setParams({ ...params, [inputKey]: e.target.value })}
                                className="w-full bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 focus:border-cyan-500 text-zinc-200 font-mono text-xs rounded px-3 py-1.5 outline-none transition-all"
                              />
                              <span className="text-[10px] text-zinc-500 italic ml-1 font-sans font-light">{desc}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Trigger Action */}
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleRunEndpoint(ep)}
                    className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 active:from-cyan-700 active:to-teal-700 text-zinc-950 font-sans font-bold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Send Virtual Request
                  </button>
                </div>
              </div>

              {/* Dynamic Console outputs block */}
              <div className="bg-zinc-950 flex flex-col flex-1">
                {lastOutput ? (
                  <div className="flex flex-col flex-1 min-h-[350px]">
                    {/* Status header dashboard code */}
                    <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-2 bg-zinc-900/10 font-mono">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 text-[11px]">STATUS:</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          lastOutput.status < 300 ? "bg-emerald-500/15 text-emerald-400" :
                          lastOutput.status < 400 ? "bg-amber-500/15 text-amber-400" :
                          "bg-rose-500/15 text-rose-400"
                        }`}>
                          {lastOutput.status} {lastOutput.status === 200 ? "OK" : lastOutput.status === 201 ? "Created" : lastOutput.status === 401 ? "Unauthorized" : lastOutput.status === 409 ? "Conflict" : lastOutput.status === 429 ? "Too Many Requests" : "Failed"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-[10px]">RATE LIMIT HIT TYPE:</span>
                        <span className="text-[10px] text-zinc-300 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 font-mono">
                          {lastOutput.headers["X-RateLimit-Limit"] === rateLimitAuthed ? "Authenticated (1000/15m)" : "Guest IP (100/15m)"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 flex-1 divide-y md:divide-y-0 md:divide-x divide-zinc-900">
                      {/* JSON Response container */}
                      <div className="p-4 flex flex-col bg-zinc-950">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-zinc-400 font-mono text-[10px] tracking-wider uppercase">JSON Payload</span>
                          <button
                            onClick={() => copyToClipboard(JSON.stringify(lastOutput.body, null, 2))}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 text-[10px]"
                          >
                            {copiedResponse ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedResponse ? "Copied" : "Copy Payload"}
                          </button>
                        </div>
                        <pre className="w-full max-h-[250px] overflow-auto bg-zinc-950/40 border border-zinc-900 rounded p-3 text-emerald-400 font-mono text-[11px] select-all leading-4">
                          {JSON.stringify(lastOutput.body, null, 2)}
                        </pre>
                      </div>

                      {/* Log output stream console */}
                      <div className="p-4 flex flex-col bg-zinc-950 pino-terminal">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Server className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="text-zinc-400 font-mono text-[10px] tracking-wider uppercase">Pino Request Stream Tracing</span>
                        </div>
                        <div className="w-full max-h-[250px] overflow-y-auto bg-zinc-950/40 ring-1 ring-zinc-900 rounded p-3 space-y-1 block max-w-full text-zinc-300 overflow-x-hidden select-text text-left">
                          {lastOutput.pinoLogs.map(renderLogMessage)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-zinc-600 font-sans min-h-[300px]">
                    <HelpCircle className="w-10 h-10 stroke-[1.2] mb-3 text-zinc-700" />
                    <span className="text-xs text-zinc-500 font-medium">Click "Send Virtual Request" to test routes interactively</span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
