import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiter (resets on cold start)
const rateLimitMap = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) { console.error('TURNSTILE_SECRET_KEY not set'); return false; }
  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    const data = await res.json();
    return data.success === true;
  } catch { return false; }
}

async function addToBrevo(email) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) { console.error('BREVO_API_KEY not set'); return { ok: false, message: 'Server configuration error.' }; }
  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({ email: email.trim().toLowerCase(), updateEnabled: false }),
  });
  if (res.status === 201 || res.status === 204) return { ok: true, message: "You're on the list! Thanks for subscribing." };
  const data = await res.json().catch(() => ({}));
  if (data?.code === 'duplicate_parameter') return { ok: true, message: "You're already subscribed!" };
  console.error('Brevo error:', data);
  return { ok: false, message: 'Could not save your email. Please try again.' };
}

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip') || '0.0.0.0';
  if (!checkRateLimit(ip)) return NextResponse.json({ error: 'Too many requests. Please wait a moment and try again.' }, { status: 429 });
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 }); }
  const { email, token } = body;
  if (!email || !isValidEmail(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  if (!token) return NextResponse.json({ error: 'Verification token missing.' }, { status: 400 });
  const turnstileOk = await verifyTurnstile(token, ip);
  if (!turnstileOk) return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 403 });
  const result = await addToBrevo(email);
  if (!result.ok) return NextResponse.json({ error: result.message }, { status: 500 });
  return NextResponse.json({ success: true, message: result.message }, { status: 200 });
}
