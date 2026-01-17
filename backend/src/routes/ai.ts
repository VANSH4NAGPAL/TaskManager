/**
 * AI Route - Production-Ready Task Description Generator with Streaming
 * 
 * STREAMING ARCHITECTURE:
 * ─────────────────────────────────────────────────────────────────────────────
 * Streaming improves PERCEIVED latency even if total generation time is the same.
 * 
 * Without streaming: User waits 3 seconds → sees full response
 * With streaming:    User waits 200ms → sees first words, then progressive updates
 * 
 * This creates a more responsive UX because users see immediate feedback.
 * 
 * LATENCY METRICS EXPLAINED:
 * ─────────────────────────────────────────────────────────────────────────────
 * 
 * Time to First Token (TTFT):
 *   - Time from sending request to receiving the first token from the LLM
 *   - This is the "perceived latency" - how long the user waits before seeing anything
 *   - TTFT < 500ms  → Excellent (feels instant)
 *   - TTFT 500-1500ms → Acceptable (noticeable but OK)
 *   - TTFT > 1500ms → Poor UX (user thinks it's broken)
 * 
 * Total Generation Time:
 *   - Time from request start to receiving the last token
 *   - < 3 seconds → Good performance
 *   - 3-5 seconds → Acceptable
 *   - > 5 seconds → Slow (consider timeout or optimization)
 * 
 * Security Features:
 * - Prompt injection protection via input sanitization
 * - Blocked content filtering (input AND output during stream)
 * - Scope restriction to task-management only
 * - Output sanitization (HTML whitelisting)
 * - Stream termination on unsafe content detection
 */

import { Router, Response } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { z } from "zod";
import Groq from "groq-sdk";

const router = Router();

// =============================================================================
// CONFIGURATION
// =============================================================================

const MAX_TITLE_LENGTH = 200;
const MAX_CONTEXT_LENGTH = 500;

/**
 * AI Model Configuration
 * 
 * PERFORMANCE TUNING NOTES:
 * - temperature: 0.3 for consistent, deterministic output (lower = more predictable)
 * - max_tokens: 250 limits response length for cost control and faster streaming
 * - timeout_ms: 10s allows for network latency + full generation
 * - stream_timeout_ms: 8s specifically for streaming (slightly less to account for cleanup)
 */
const AI_CONFIG = {
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,          // Low temp = deterministic output, fewer "creative" surprises
    max_tokens: 250,           // Hard limit on output length for cost + latency control
    timeout_ms: 10000,         // 10s total timeout for non-streaming requests
    stream_timeout_ms: 8000,   // 8s timeout for streaming (leaves room for cleanup)
} as const;

/**
 * Latency Thresholds for Monitoring
 * Used for structured logging and alerting
 */
const LATENCY_THRESHOLDS = {
    ttft_excellent: 500,       // < 500ms = excellent TTFT
    ttft_acceptable: 1500,     // 500-1500ms = acceptable
    total_good: 3000,          // < 3s total = good
    total_slow: 5000,          // > 5s = slow, needs investigation
} as const;

// =============================================================================
// INPUT VALIDATION
// =============================================================================

const generateSchema = z.object({
    title: z.string()
        .min(1, "Title is required")
        .max(MAX_TITLE_LENGTH, `Title must be under ${MAX_TITLE_LENGTH} characters`),
    description: z.string()
        .max(MAX_CONTEXT_LENGTH, `Context must be under ${MAX_CONTEXT_LENGTH} characters`)
        .optional(),
});

// =============================================================================
// SECURITY: BLOCKED CONTENT PATTERNS
// =============================================================================

const BLOCKED_PATTERNS = [
    // Violence & harm
    /\bhack(ing|er)?\b/i, /\bexploit\b/i, /\bmalware\b/i, /\bvirus\b/i, /\billegal\b/i,
    /\bweapon(s)?\b/i, /\bbomb\b/i, /\bkill(ing)?\b/i, /\bmurder\b/i, /\battack\b/i,
    /\bsuicide\b/i, /\bself.?harm\b/i, /\bhurt\s?(my|your)?self\b/i,
    /\bterrorist\b/i, /\bviolence\b/i, /\babuse\b/i, /\btorture\b/i,

    // Adult content
    /\bporn\b/i, /\bnsfw\b/i, /\bnude\b/i, /\bsex(ual)?\b/i, /\berotic\b/i,

    // Illegal activities
    /\bdrug(s)?\b/i, /\bscam\b/i, /\bphishing\b/i, /\bfraud\b/i, /\bsteal\b/i, /\btheft\b/i,

    // Prompt injection attempts
    /\bignore\s*(previous|above|all)\b/i,
    /\bdisregard\s*(previous|above|all)\b/i,
    /\bforget\s*(previous|above|all)\b/i,
    /\bnew\s*instructions?\b/i,
    /\bsystem\s*prompt\b/i,
    /\byou\s*are\s*now\b/i,
    /\bpretend\s*(to\s*be|you\s*are)\b/i,
    /\bact\s*as\s*(if|a)\b/i,
    /\broleplay\b/i,
    /\bjailbreak\b/i,
    /\bbypass\b/i,
    /\boverride\b/i,
];

const OFF_TOPIC_PATTERNS = [
    /write\s*(me\s*)?(a\s*)?(code|script|program)/i,
    /explain\s*(how|what|why)/i,
    /what\s*is\s*(the|a)/i,
    /tell\s*me\s*(about|how)/i,
    /how\s*(do|does|can|to)/i,
    /translate/i,
    /summarize/i,
    /essay/i,
    /story/i,
    /poem/i,
    /joke/i,
];

function containsBlockedContent(text: string): boolean {
    const normalized = text.toLowerCase();
    return BLOCKED_PATTERNS.some(pattern => pattern.test(normalized));
}

function isOffTopic(title: string, context: string): boolean {
    const combined = `${title} ${context}`.toLowerCase();
    const taskKeywords = /task|todo|plan|goal|reminder|deadline|schedule|project|work|meeting|call|email|buy|clean|organize|exercise|read|learn|practice|finish|complete|start|prepare/i;
    if (taskKeywords.test(combined)) {
        return false;
    }
    return OFF_TOPIC_PATTERNS.some(pattern => pattern.test(combined));
}

// =============================================================================
// SECURITY: INPUT/OUTPUT SANITIZATION
// =============================================================================

function sanitizeInput(text: string): string {
    return text
        .replace(/[`'"]/g, "")
        .replace(/[#*_~]/g, "")
        .replace(/\s+/g, " ")
        .replace(/[\x00-\x1F\x7F]/g, "")
        .trim()
        .slice(0, MAX_CONTEXT_LENGTH);
}

const ALLOWED_TAGS = ["p", "ul", "li", "ol", "br", "strong", "em"];

function sanitizeOutput(html: string): string {
    let clean = html
        .replace(/```html?/gi, "")
        .replace(/```/g, "")
        .replace(/\[.\]/g, "");

    clean = clean
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "")
        .replace(/javascript:/gi, "");

    const tagPattern = /<\/?([a-z][a-z0-9]*)[^>]*>/gi;
    clean = clean.replace(tagPattern, (match, tagName) => {
        if (ALLOWED_TAGS.includes(tagName.toLowerCase())) {
            if (match.startsWith("</")) {
                return `</${tagName.toLowerCase()}>`;
            }
            return `<${tagName.toLowerCase()}>`;
        }
        return "";
    });

    clean = clean
        .replace(/>\s+</g, "><")
        .replace(/<p>\s+/g, "<p>")
        .replace(/\s+<\/p>/g, "</p>")
        .replace(/<li>\s+/g, "<li>")
        .replace(/\s+<\/li>/g, "</li>")
        .replace(/\s{2,}/g, " ")
        .replace(/<p><\/p>/g, "")
        .replace(/<p>\s*<\/p>/g, "")
        .trim();

    if (clean && !clean.startsWith("<")) {
        clean = `<p>${clean}</p>`;
    }

    return clean;
}

// =============================================================================
// AI CLIENT
// =============================================================================

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

const SYSTEM_PROMPT = `You are a task description writer for a to-do app.

ROLE: Write task descriptions as if the USER wrote them. First-person, declarative.

STRICT RULES:
1. Write in FIRST PERSON ("I will...", "My plan is...", "Need to...")
2. NO suggestions ("Consider...", "You should...", "Try to...")
3. NO questions or follow-ups
4. NO advice or recommendations
5. NO inventing details not mentioned by user
6. Output ONLY clean HTML: <p>, <ul>, <li>
7. Maximum 2-4 bullet points
8. Stay focused on the specific task

FORMAT:
- Start with <p> for overview (optional, keep short)
- Use <ul><li> for action items
- Each bullet is a concrete, actionable item

NEVER:
- Suggest alternatives or options
- Ask clarifying questions
- Give advice or tips
- Mention things not in the user's input
- Use second person ("you")
- Output markdown or code blocks`;

// =============================================================================
// LATENCY LOGGING HELPERS
// =============================================================================

/**
 * Structured latency log for monitoring and alerting
 * These logs can be parsed by monitoring tools (Datadog, CloudWatch, etc.)
 */
interface LatencyMetrics {
    userId: string;
    requestId: string;
    ttft_ms: number;           // Time to first token
    total_ms: number;          // Total request time
    tokens_generated: number;  // Approximate token count
    ttft_rating: "excellent" | "acceptable" | "poor";
    total_rating: "good" | "acceptable" | "slow";
}

function logLatencyMetrics(metrics: LatencyMetrics): void {
    // Structured log for easy parsing
    console.log(JSON.stringify({
        type: "ai_latency",
        ...metrics,
        timestamp: new Date().toISOString(),
    }));

    // Human-readable warning for poor performance
    if (metrics.ttft_rating === "poor") {
        console.warn(`[SLOW TTFT] User ${metrics.userId}: ${metrics.ttft_ms}ms to first token`);
    }
    if (metrics.total_rating === "slow") {
        console.warn(`[SLOW TOTAL] User ${metrics.userId}: ${metrics.total_ms}ms total generation`);
    }
}

function rateTTFT(ms: number): "excellent" | "acceptable" | "poor" {
    if (ms < LATENCY_THRESHOLDS.ttft_excellent) return "excellent";
    if (ms < LATENCY_THRESHOLDS.ttft_acceptable) return "acceptable";
    return "poor";
}

function rateTotal(ms: number): "good" | "acceptable" | "slow" {
    if (ms < LATENCY_THRESHOLDS.total_good) return "good";
    if (ms < LATENCY_THRESHOLDS.total_slow) return "acceptable";
    return "slow";
}

// =============================================================================
// STREAMING ENDPOINT
// =============================================================================

/**
 * Streaming endpoint for real-time AI response
 * 
 * WHY STREAMING?
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Perceived Latency: Users see content immediately instead of waiting
 * 2. Time to First Byte: Feedback in ~200-500ms instead of 2-3 seconds
 * 3. Progressive Enhancement: Even if total time is same, UX feels faster
 * 4. Cancelability: Users can cancel mid-stream if they see wrong direction
 * 
 * PROTOCOL: Server-Sent Events (SSE)
 * - Uses text/event-stream content type
 * - Each chunk sent as `data: {...}\n\n`
 * - Final message is `data: [DONE]\n\n`
 */
router.post("/generate-subtasks-stream", requireAuth, async (req: AuthRequest, res: Response) => {
    // =========================================================================
    // LATENCY TRACKING SETUP
    // =========================================================================
    const requestStart = Date.now();      // When request was received
    let groqRequestSent = 0;              // When we send to Groq
    let firstTokenReceived = 0;           // When first token arrives (TTFT)
    let tokensGenerated = 0;              // Count of tokens received
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Track if stream is still active (for cleanup)
    let streamActive = true;
    let abortController: AbortController | null = null;

    try {
        // -----------------------------------------------------------------
        // 1. VALIDATE INPUT (same as non-streaming)
        // -----------------------------------------------------------------
        const parsed = generateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Invalid input. Please provide a valid task title."
            });
        }

        const { title: rawTitle, description: rawContext } = parsed.data;

        // -----------------------------------------------------------------
        // 2. CHECK API KEY
        // -----------------------------------------------------------------
        if (!process.env.GROQ_API_KEY) {
            console.error("GROQ_API_KEY not configured");
            return res.status(500).json({
                error: "AI service not configured."
            });
        }

        // -----------------------------------------------------------------
        // 3. SANITIZE & VALIDATE INPUTS
        // -----------------------------------------------------------------
        const title = sanitizeInput(rawTitle);
        const context = sanitizeInput(rawContext || "");

        if (!title) {
            return res.status(400).json({ error: "Title is required." });
        }

        if (containsBlockedContent(`${title} ${context}`)) {
            console.warn(`Blocked content attempt from user ${req.userId}`);
            return res.status(400).json({
                error: "Please keep your request appropriate and task-related."
            });
        }

        if (isOffTopic(title, context)) {
            return res.status(400).json({
                error: "I can only help with task descriptions."
            });
        }

        // -----------------------------------------------------------------
        // 4. SET UP SSE HEADERS
        // -----------------------------------------------------------------
        /**
         * SSE Headers Explained:
         * - Content-Type: text/event-stream - tells browser this is SSE
         * - Cache-Control: no-cache - prevents caching of streamed data
         * - Connection: keep-alive - maintains persistent connection
         * - X-Accel-Buffering: no - disables nginx buffering (important!)
         */
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.setHeader("X-Accel-Buffering", "no");
        // Flush headers immediately to establish SSE connection
        res.flushHeaders();

        console.log(`[Stream] SSE headers sent for request: ${requestId}`);

        // -----------------------------------------------------------------
        // 5. HANDLE CLIENT DISCONNECT
        // -----------------------------------------------------------------
        // DISABLE DISCONNECT HANDLING TEMPORARILY - False positives causing stream abortion
        /*
        req.on("close", () => {
             // Only treat as disconnect if the request was destroyed (client actually disconnected)
             if (req.destroyed) {
                 streamActive = false;
                 // DON'T abort Groq - just mark inactive and skip sending remaining data
                 console.log(`[Stream] Client disconnected, skipping further writes: ${requestId}`);
             }
        });
        */

        // -----------------------------------------------------------------
        // 6. BUILD PROMPT
        // -----------------------------------------------------------------
        const userPrompt = context
            ? `Task: ${title}\nDetails: ${context}`
            : `Task: ${title}`;

        // -----------------------------------------------------------------
        // 7. CALL GROQ WITH STREAMING
        // -----------------------------------------------------------------
        /**
         * LATENCY MEASUREMENT POINT 1: Request sent to Groq
         * This measures our preprocessing time (validation, sanitization)
         * Typical preprocessing should be < 10ms
         */
        groqRequestSent = Date.now();
        const preprocessTime = groqRequestSent - requestStart;
        console.log(`[Stream] Preprocessing took ${preprocessTime}ms`);

        // Create abort controller for timeout handling
        abortController = new AbortController();
        const timeoutId = setTimeout(() => {
            abortController?.abort();
            console.warn(`[Stream] Timeout after ${AI_CONFIG.stream_timeout_ms}ms`);
        }, AI_CONFIG.stream_timeout_ms);

        const stream = await groq.chat.completions.create({
            model: AI_CONFIG.model,
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
            ],
            temperature: AI_CONFIG.temperature,
            max_tokens: AI_CONFIG.max_tokens,
            stream: true, // Enable streaming
        });

        // -----------------------------------------------------------------
        // 8. PROCESS STREAM
        // -----------------------------------------------------------------
        let fullContent = "";
        let unsafeContentDetected = false;

        for await (const chunk of stream) {
            // Check if stream was aborted
            if (!streamActive || abortController?.signal.aborted) {
                console.log(`[Stream] Aborted: ${requestId}`);
                break;
            }

            const content = chunk.choices[0]?.delta?.content;
            if (!content) continue;

            /**
             * LATENCY MEASUREMENT POINT 2: First token received (TTFT)
             * 
             * This is the most important UX metric for streaming.
             * Users perceive responsiveness based on TTFT, not total time.
             * 
             * Good TTFT (< 500ms) makes the app feel snappy.
             * Poor TTFT (> 1500ms) makes users think something is broken.
             */
            if (firstTokenReceived === 0) {
                firstTokenReceived = Date.now();
                const ttft = firstTokenReceived - groqRequestSent;
                console.log(`[Stream] TTFT: ${ttft}ms (${rateTTFT(ttft)})`);
            }

            tokensGenerated++;
            fullContent += content;

            // -----------------------------------------------------------------
            // 9. SAFETY CHECK DURING STREAMING
            // -----------------------------------------------------------------
            /**
             * SECURITY: Check content as it streams
             * 
             * We check periodically (every ~100 chars) to catch problems early
             * without the overhead of checking every single token.
             * 
             * If unsafe content is detected, we immediately terminate the stream.
             */
            if (fullContent.length % 100 < content.length) {
                if (containsBlockedContent(fullContent)) {
                    unsafeContentDetected = true;
                    console.warn(`[Stream] Unsafe content detected, terminating: ${requestId}`);
                    break;
                }
            }

            // -----------------------------------------------------------------
            // 10. SEND CHUNK TO CLIENT
            // -----------------------------------------------------------------
            /**
             * SSE Format: data: {json}\n\n
             * The double newline is required by the SSE spec
             */
            if (streamActive) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
        }

        // Clear timeout
        clearTimeout(timeoutId);

        // -----------------------------------------------------------------
        // 11. HANDLE UNSAFE CONTENT
        // -----------------------------------------------------------------
        if (unsafeContentDetected) {
            res.write(`data: ${JSON.stringify({
                error: "Unable to generate description. Please try rephrasing."
            })}\n\n`);
            res.write("data: [DONE]\n\n");
            res.end();
            return;
        }

        // -----------------------------------------------------------------
        // 12. FINAL OUTPUT SANITIZATION
        // -----------------------------------------------------------------
        /**
         * Even with streaming, we do a final sanitization pass
         * This catches any HTML issues that weren't visible in chunks
         */
        const sanitized = sanitizeOutput(fullContent);

        // Send sanitized final content (client can use this to replace streamed content)
        res.write(`data: ${JSON.stringify({
            final: sanitized,
            done: true
        })}\n\n`);
        res.write("data: [DONE]\n\n");

        // -----------------------------------------------------------------
        // 13. LOG LATENCY METRICS
        // -----------------------------------------------------------------
        const totalTime = Date.now() - requestStart;
        const ttft = firstTokenReceived > 0 ? firstTokenReceived - groqRequestSent : totalTime;

        logLatencyMetrics({
            userId: req.userId || "unknown",
            requestId,
            ttft_ms: ttft,
            total_ms: totalTime,
            tokens_generated: tokensGenerated,
            ttft_rating: rateTTFT(ttft),
            total_rating: rateTotal(totalTime),
        });

        res.end();

    } catch (error: any) {
        const totalTime = Date.now() - requestStart;
        console.error(`[Stream Error] ${requestId} (${totalTime}ms):`, error.message);

        // Try to send error to client if stream is still active
        if (streamActive && !res.headersSent) {
            return res.status(500).json({
                error: "Unable to generate description."
            });
        }

        // If headers already sent, send SSE error
        if (streamActive) {
            try {
                res.write(`data: ${JSON.stringify({
                    error: error.message === "AI request timeout"
                        ? "Request timed out. Please try again."
                        : "Generation failed. Please try again."
                })}\n\n`);
                res.write("data: [DONE]\n\n");
            } catch {
                // Client already disconnected
            }
        }

        res.end();
    }
});

// =============================================================================
// NON-STREAMING ENDPOINT (ORIGINAL - KEPT FOR BACKWARDS COMPATIBILITY)
// =============================================================================

router.post("/generate-subtasks", requireAuth, async (req: AuthRequest, res) => {
    const startTime = Date.now();

    try {
        const parsed = generateSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Invalid input. Please provide a valid task title."
            });
        }

        const { title: rawTitle, description: rawContext } = parsed.data;

        if (!process.env.GROQ_API_KEY) {
            console.error("GROQ_API_KEY not configured");
            return res.status(500).json({
                error: "AI service not configured. Please contact support."
            });
        }

        const title = sanitizeInput(rawTitle);
        const context = sanitizeInput(rawContext || "");

        if (!title) {
            return res.status(400).json({ error: "Title is required." });
        }

        if (containsBlockedContent(`${title} ${context}`)) {
            console.warn(`Blocked content attempt from user ${req.userId}`);
            return res.status(400).json({
                error: "Please keep your request appropriate and task-related."
            });
        }

        if (isOffTopic(title, context)) {
            return res.status(400).json({
                error: "I can only help with task descriptions. Please describe a task or goal."
            });
        }

        const userPrompt = context
            ? `Task: ${title}\nDetails: ${context}`
            : `Task: ${title}`;

        const groqStart = Date.now();

        const completion = await Promise.race([
            groq.chat.completions.create({
                model: AI_CONFIG.model,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userPrompt },
                ],
                temperature: AI_CONFIG.temperature,
                max_tokens: AI_CONFIG.max_tokens,
            }),
            new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error("AI request timeout")), AI_CONFIG.timeout_ms)
            ),
        ]);

        const groqTime = Date.now() - groqStart;

        const rawOutput = completion.choices[0]?.message?.content;

        if (!rawOutput) {
            throw new Error("Empty AI response");
        }

        if (containsBlockedContent(rawOutput)) {
            console.warn(`Blocked AI output for user ${req.userId}`);
            return res.json({
                subtasks: "<p>Unable to generate description. Please try rephrasing.</p>",
                tags: []
            });
        }

        const sanitized = sanitizeOutput(rawOutput);

        if (!sanitized || sanitized === "<p></p>") {
            return res.json({
                subtasks: "<p>Unable to generate description. Please try rephrasing.</p>",
                tags: []
            });
        }

        const totalTime = Date.now() - startTime;
        console.log(`[Non-Stream] User ${req.userId}: ${groqTime}ms Groq, ${totalTime}ms total (${rateTotal(totalTime)})`);

        if (totalTime > LATENCY_THRESHOLDS.total_slow) {
            console.warn(`[SLOW] Non-streaming request took ${totalTime}ms`);
        }

        res.json({ subtasks: sanitized, tags: [] });

    } catch (error: any) {
        const latency = Date.now() - startTime;
        console.error(`AI Error (${latency}ms):`, error.message);

        if (error.status === 429) {
            return res.status(429).json({
                error: "Too many requests. Please wait a moment and try again."
            });
        }

        if (error.message === "AI request timeout") {
            return res.status(504).json({
                error: "Request took too long. Please try again."
            });
        }

        if (error.name === "ZodError") {
            return res.status(400).json({
                error: "Invalid input format."
            });
        }

        res.status(500).json({
            error: "Unable to generate description. Please try again."
        });
    }
});

export default router;
