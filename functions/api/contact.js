// Cloudflare Pages Function: functions/api/contact.js
// Handles POST /api/contact
// 1. Verifies Cloudflare Turnstile token server-side
// 2. Proxies the validated form data to Web3Forms

const RATE_LIMIT = 3;
const RATE_WINDOW_MS = 60_000;

// In-memory rate limit map (per isolate lifetime)
const rateLimitMap = new Map();

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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function verifyTurnstile(token, ip, secret) {
  if (!secret) return false;
  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: ip });
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = await res.json();
    return data.success === true;
  } catch {
    return false;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '0.0.0.0';

  if (!checkRateLimit(ip)) {
    return json({ error: 'Too many requests. Please wait a moment and try again.' }, 429);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, 400);
  }

  const { name, email, subject, message, token } = body || {};

  // Basic field validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return json({ error: 'Name is required.' }, 400);
  }
  if (!email || !isValidEmail(email)) {
    return json({ error: 'Please enter a valid email address.' }, 400);
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return json({ error: 'Message is required.' }, 400);
  }
  if (!token) {
    return json({ error: 'Verification token missing.' }, 400);
  }

  // Verify Turnstile token
  const turnstileOk = await verifyTurnstile(token, ip, env.TURNSTILE_SECRET_KEY);
  if (!turnstileOk) {
    return json({ error: 'Bot verification failed. Please try again.' }, 403);
  }

  // Proxy to Web3Forms
  try {
    const web3Res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: 'd152ecf8-147d-4b5e-88fa-26856110c736',
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: (subject || 'Contact from ImagePine').trim(),
        message: message.trim(),
        from_name: 'ImagePine Contact Support',
      }),
    });

    const result = await web3Res.json();
    if (web3Res.status === 200 || result.success) {
      return json({ success: true, message: 'Message sent successfully!' });
    }
    return json({ error: result.message || 'Failed to send your message. Please try again.' }, 500);
  } catch {
    return json({ error: 'Could not deliver your message. Please try again.' }, 500);
  }
}

// Handle OPTIONS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
