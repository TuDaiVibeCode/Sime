module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/api-docs/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ApiDocsPage,
    "metadata",
    ()=>metadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ui.tsx [app-rsc] (ecmascript)");
;
;
const metadata = {
    title: 'API reference',
    description: 'REST API reference for the Sime backend: lessons, auth, progress, analysis, voice profiles, and worker endpoints.'
};
const ENDPOINTS = [
    {
        method: 'GET',
        path: '/health',
        auth: false,
        desc: 'Service health and uptime.',
        sample: '{ "status": "ok", "uptime": 1234.5, "timestamp": "2026-06-05T..." }'
    },
    {
        method: 'GET',
        path: '/api/lessons',
        auth: false,
        desc: 'List every curriculum track and its lessons. Public, all content is free.',
        sample: '{ "tracks": [ { "id": "foundations", "name": "Foundations", "lessons": [ ... ] } ] }'
    },
    {
        method: 'GET',
        path: '/api/lessons/:id',
        auth: false,
        desc: 'Fetch one lesson by id. Returns 404 if it does not exist.',
        sample: '{ "lesson": { "id": "belting", "title": "Belting without strain", "durationMin": 11, "trackId": "technique" } }'
    },
    {
        method: 'POST',
        path: '/api/auth/register',
        auth: false,
        desc: 'Create an account and set the signed httpOnly session cookie. Body validates email, password, and optional displayName.',
        sample: '201 { "user": { "id": "...", "email": "singer@example.com", "role": "learner" } }'
    },
    {
        method: 'POST',
        path: '/api/auth/login',
        auth: false,
        desc: 'Sign in with email and password and set the signed httpOnly session cookie.',
        sample: '200 { "user": { "id": "...", "email": "singer@example.com" } }'
    },
    {
        method: 'GET',
        path: '/api/auth/me',
        auth: true,
        desc: 'Return the current authenticated user from the session cookie.',
        sample: '{ "user": { "id": "...", "email": "singer@example.com", "role": "learner" } }'
    },
    {
        method: 'POST',
        path: '/api/auth/logout',
        auth: false,
        desc: 'Clear the session cookie.',
        sample: '204 No Content'
    },
    {
        method: 'GET',
        path: '/api/progress',
        auth: true,
        desc: 'List the signed-in user progress logs.',
        sample: '{ "progress": [ { "lessonId": "breath-control", "status": "completed" } ] }'
    },
    {
        method: 'POST',
        path: '/api/progress',
        auth: true,
        desc: 'Create a validated lesson progress log for the signed-in user.',
        sample: '201 { "progress": { "lessonId": "breath-control", "status": "completed" } }'
    },
    {
        method: 'POST',
        path: '/api/analysis/range',
        auth: false,
        desc: 'Analyze stable note samples into a safe vocal range.',
        sample: '{ "range": { "lowestNote": "A2", "highestNote": "E4", "rangeSemitones": 19 } }'
    },
    {
        method: 'POST',
        path: '/api/analysis/coach',
        auth: true,
        desc: 'Generate Gemini coaching from the validated compact coaching payload.',
        sample: '{ "coaching": { "text": "..." } }'
    },
    {
        method: 'GET',
        path: '/api/analysis/models',
        auth: false,
        desc: 'Describe analysis model routing, Redis queues, and live websocket contracts.',
        sample: '{ "realtimeDefault": "SwiftF0", "workerBridge": { "queue": "sime:analysis:jobs" } }'
    },
    {
        method: 'POST',
        path: '/api/analysis/jobs',
        auth: true,
        desc: 'Create a persisted analysis job and dispatch it to Redis when Redis is available.',
        sample: '202 { "job": { "id": "...", "status": "queued" }, "dispatch": { "queuedInRedis": true } }'
    },
    {
        method: 'GET',
        path: '/api/analysis/jobs/:id',
        auth: true,
        desc: 'Poll one analysis job owned by the signed-in user.',
        sample: '{ "job": { "id": "...", "status": "succeeded", "resultPayload": { } } }'
    },
    {
        method: 'GET',
        path: '/api/voice-profiles/latest',
        auth: true,
        desc: 'Return the latest voice profile for the signed-in user.',
        sample: '{ "profile": { "voiceType": "baritone", "lowestNote": "A2", "highestNote": "E4" } }'
    },
    {
        method: 'POST',
        path: '/api/voice-profiles/:id/embeddings',
        auth: true,
        desc: 'Attach a 1536-dimension pgvector embedding to a user-owned voice profile.',
        sample: '201 { "embedding": { "id": "...", "embeddingKind": "voice_profile" } }'
    },
    {
        method: 'PATCH',
        path: '/api/workers/analysis-jobs/:id',
        auth: true,
        desc: 'Worker-only callback secured by the shared worker bearer token.',
        sample: '{ "job": { "id": "...", "status": "succeeded" } }'
    },
    {
        method: 'WS',
        path: '/ws/live-analysis',
        auth: true,
        desc: 'Authenticated live audio-frame transport used by the practice page.',
        sample: '{ "type": "audio_frame", "sequence": 1, "model": "swiftf0", "audioBase64": "..." }'
    }
];
const methodColor = {
    GET: '#6FE0A6',
    POST: '#FFB84D',
    PATCH: '#80BFFF',
    WS: '#C8A8FF'
};
const FACTS = [
    {
        k: 'Base URL',
        v: 'http://localhost:4000 (development)'
    },
    {
        k: 'Format',
        v: 'JSON request and response bodies'
    },
    {
        k: 'Rate limits',
        v: '300 requests / 15 min globally, 20 / 15 min on auth'
    },
    {
        k: 'CORS',
        v: 'Restricted to the configured frontend origin, credentials allowed'
    }
];
function ApiDocsPage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PageHeader"], {
                eyebrow: "Developers",
                title: "API reference.",
                lead: "The REST and websocket contracts behind Sime. Public lessons stay open; account, progress, jobs, voice profiles, and live frames require the session cookie."
            }, void 0, false, {
                fileName: "[project]/app/api-docs/page.tsx",
                lineNumber: 165,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Container"], {
                className: "py-16",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mb-12 grid gap-4 sm:grid-cols-2",
                        children: FACTS.map((f)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Card"], {
                                className: "bg-surface2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-xs font-semibold uppercase text-faint",
                                        children: f.k
                                    }, void 0, false, {
                                        fileName: "[project]/app/api-docs/page.tsx",
                                        lineNumber: 174,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-1.5 font-mono text-sm text-text",
                                        children: f.v
                                    }, void 0, false, {
                                        fileName: "[project]/app/api-docs/page.tsx",
                                        lineNumber: 175,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, f.k, true, {
                                fileName: "[project]/app/api-docs/page.tsx",
                                lineNumber: 173,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/api-docs/page.tsx",
                        lineNumber: 171,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-4",
                        children: ENDPOINTS.map((e)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "rounded-2xl border border-white/10 bg-surface p-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-wrap items-center gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "rounded-md px-2.5 py-1 font-mono text-xs font-bold",
                                                style: {
                                                    background: `${methodColor[e.method]}1f`,
                                                    color: methodColor[e.method]
                                                },
                                                children: e.method
                                            }, void 0, false, {
                                                fileName: "[project]/app/api-docs/page.tsx",
                                                lineNumber: 184,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                className: "font-mono text-sm text-text",
                                                children: e.path
                                            }, void 0, false, {
                                                fileName: "[project]/app/api-docs/page.tsx",
                                                lineNumber: 190,
                                                columnNumber: 17
                                            }, this),
                                            e.auth ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "rounded-md border border-white/15 px-2 py-0.5 text-xs text-muted",
                                                children: "auth required"
                                            }, void 0, false, {
                                                fileName: "[project]/app/api-docs/page.tsx",
                                                lineNumber: 192,
                                                columnNumber: 19
                                            }, this) : null
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/api-docs/page.tsx",
                                        lineNumber: 183,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "mt-3 text-muted",
                                        children: e.desc
                                    }, void 0, false, {
                                        fileName: "[project]/app/api-docs/page.tsx",
                                        lineNumber: 197,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                        className: "mt-4 overflow-x-auto rounded-lg bg-black/40 p-4 font-mono text-xs leading-relaxed text-muted",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                            children: e.sample
                                        }, void 0, false, {
                                            fileName: "[project]/app/api-docs/page.tsx",
                                            lineNumber: 199,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/app/api-docs/page.tsx",
                                        lineNumber: 198,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, e.method + e.path, true, {
                                fileName: "[project]/app/api-docs/page.tsx",
                                lineNumber: 182,
                                columnNumber: 13
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/app/api-docs/page.tsx",
                        lineNumber: 180,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ui$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["Card"], {
                        className: "mt-12 bg-surface2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-lg font-bold",
                                children: "Error format"
                            }, void 0, false, {
                                fileName: "[project]/app/api-docs/page.tsx",
                                lineNumber: 206,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "mt-2 text-muted",
                                children: "Errors return the matching HTTP status with a JSON body. Validation failures return 400 with a flattened list of issues."
                            }, void 0, false, {
                                fileName: "[project]/app/api-docs/page.tsx",
                                lineNumber: 207,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                                className: "mt-4 overflow-x-auto rounded-lg bg-black/40 p-4 font-mono text-xs text-muted",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                    children: '400 { "error": "Validation failed", "issues": { "fieldErrors": { "email": ["Invalid email"] } } }'
                                }, void 0, false, {
                                    fileName: "[project]/app/api-docs/page.tsx",
                                    lineNumber: 212,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/app/api-docs/page.tsx",
                                lineNumber: 211,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/api-docs/page.tsx",
                        lineNumber: 205,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/api-docs/page.tsx",
                lineNumber: 170,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
"[project]/app/api-docs/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/app/api-docs/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0iiayin._.js.map