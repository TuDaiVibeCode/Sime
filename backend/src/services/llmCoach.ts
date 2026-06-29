import { env } from '../config/env';
import { HttpError } from '../middleware/error';
import type { CoachingPayloadInput } from '../schemas/vocal';
import { buildCoachingPayload } from './vocalAnalysis';

const GEMINI_MODEL = 'gemini-1.5-flash';

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

type OpenAITextContent = {
  type?: string;
  text?: string;
};

type OpenAIOutputItem = {
  type?: string;
  content?: OpenAITextContent[];
};

type OpenAIResponse = {
  output_text?: string;
  output?: OpenAIOutputItem[];
  error?: { message?: string; type?: string; code?: string };
};

function withTimeout(ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { controller, timeout };
}

function extractOpenAIText(data: OpenAIResponse) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts = data.output
    ?.flatMap((item) => item.content ?? [])
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .filter(Boolean);

  return parts?.join('\n').trim() ?? '';
}

async function callOpenAI(systemPrompt: string, payload: unknown) {
  if (!env.OPENAI_API_KEY) {
    throw new HttpError(
      503,
      'The AI coach is not configured. Add OPENAI_API_KEY or GEMINI_API_KEY to backend/.env and restart the backend.'
    );
  }

  const { controller, timeout } = withTimeout(env.OPENAI_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(`${env.OPENAI_BASE_URL}/responses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        instructions: systemPrompt,
        input: JSON.stringify(payload),
        max_output_tokens: env.OPENAI_MAX_OUTPUT_TOKENS,
      }),
    });
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError') {
      throw new HttpError(504, 'The coaching service timed out.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const data = (await response.json().catch(() => ({}))) as OpenAIResponse;
  if (!response.ok) {
    throw new HttpError(
      502,
      `The coaching service is unavailable (OpenAI status ${response.status}).`
    );
  }

  const text = extractOpenAIText(data);
  if (!text) {
    throw new HttpError(502, 'The coaching service returned an empty response.');
  }
  return text;
}

async function callGemini(systemPrompt: string, payload: unknown) {
  if (!env.GEMINI_API_KEY) {
    throw new HttpError(
      503,
      'The AI coach is not configured. Add OPENAI_API_KEY or GEMINI_API_KEY to backend/.env and restart the backend.'
    );
  }

  const { controller, timeout } = withTimeout(env.GEMINI_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
        env.GEMINI_API_KEY
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: JSON.stringify(payload) }],
            },
          ],
        }),
      }
    );
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError') {
      throw new HttpError(504, 'The coaching service timed out.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new HttpError(502, `The coaching service is unavailable (Gemini status ${response.status}).`);
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('\n').trim() ?? '';
  if (!text) {
    throw new HttpError(502, 'The coaching service returned an empty response.');
  }
  return text;
}

async function callCoachModel(systemPrompt: string, payload: unknown) {
  if (env.OPENAI_API_KEY) return callOpenAI(systemPrompt, payload);
  return callGemini(systemPrompt, payload);
}

export async function generateCoaching(input: CoachingPayloadInput) {
  const coaching = buildCoachingPayload(input);
  return callCoachModel(coaching.systemPrompt, {
    payload: coaching.payload,
    guardrails: coaching.guardrails,
  });
}

export async function generateAcousticCoaching(input: {
  exerciseName: string;
  jobType: string;
  lessonContext?: string;
  health?: unknown;
  technique?: unknown;
}) {
  const systemPrompt = `Role: You are an elite Virtual Vocal Coach at EduX Academy, specializing in vocal anatomy, Bel Canto, and contemporary techniques.
Task: Translate raw acoustic JSON metrics into supportive, pedagogical feedback.
Rules: Do not mechanically list raw numbers such as Jitter, HNR, Hz, dB, or cents. Use analogies: low HNR means breathy or leaking air; high Jitter can imply unstable tension. End with one actionable physical adjustment involving posture, breath, jaw, tongue, or mouth shape. Keep the feedback under 100 words.
Tone: Warm, professional, encouraging, and safety-first. If the data suggests strain risk, tell the learner to stop and reset gently.`;

  return callCoachModel(systemPrompt, {
    exercise: input.exerciseName,
    jobType: input.jobType,
    lessonContext: input.lessonContext ?? 'EduX vocal practice',
    acousticValidation: {
      health: input.health,
      technique: input.technique,
    },
  });
}
