const DEFAULT_FORMSPREE_ENDPOINT = 'https://formspree.io/f/xjkoebdb';
const REF_TTL_DAYS = 30;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/lead/create' && request.method === 'POST') {
      return handleLeadCreate(request, env);
    }

    if (url.pathname === '/api/lead/verify' && (request.method === 'GET' || request.method === 'POST')) {
      return handleLeadVerify(request, env, url);
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not found', { status: 404 });
  }
};

async function handleLeadCreate(request, env) {
  if (!env.LEAD_SIGNING_SECRET) {
    return json({ ok: false, error: 'missing_signing_secret' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  const lead = sanitizeLead(body);
  const validationError = validateLead(lead);
  if (validationError) return json({ ok: false, error: validationError }, 400);

  const ref = await createLeadRef(env.LEAD_SIGNING_SECRET);

  const formspreeEndpoint = env.FORMSPREE_ENDPOINT || DEFAULT_FORMSPREE_ENDPOINT;
  const formData = new URLSearchParams({
    lead_ref: ref,
    name: lead.name,
    phone: lead.phone,
    company: lead.company,
    service: lead.service,
    budget: lead.budget,
    timeline: lead.timeline,
    area: lead.area,
    time: lead.time,
    notes: lead.notes,
    source: 'website_form'
  });

  // Fire-and-forget behavior: keep lead flow alive even if Formspree is temporarily down.
  try {
    await fetch(formspreeEndpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
  } catch {
    // noop
  }

  return json({ ok: true, ref });
}

async function handleLeadVerify(request, env, url) {
  if (!env.LEAD_SIGNING_SECRET) {
    return json({ ok: false, error: 'missing_signing_secret' }, 500);
  }

  let ref = '';
  if (request.method === 'GET') {
    ref = String(url.searchParams.get('ref') || '').trim();
  } else {
    try {
      const body = await request.json();
      ref = String(body?.ref || '').trim();
    } catch {
      return json({ ok: false, error: 'invalid_json' }, 400);
    }
  }

  if (!ref) return json({ ok: false, error: 'missing_ref' }, 400);

  const verified = await verifyLeadRef(ref, env.LEAD_SIGNING_SECRET);
  return json({ ok: true, qualified: verified.ok, reason: verified.reason, ref });
}

function sanitizeLead(raw) {
  return {
    name: String(raw?.name || '').trim(),
    phone: String(raw?.phone || '').trim(),
    company: String(raw?.company || '').trim(),
    service: String(raw?.service || '').trim(),
    budget: String(raw?.budget || '').trim(),
    timeline: String(raw?.timeline || '').trim(),
    area: String(raw?.area || '').trim(),
    time: String(raw?.time || '').trim(),
    notes: String(raw?.notes || '').trim()
  };
}

function validateLead(lead) {
  const required = ['name', 'phone', 'company', 'service', 'budget', 'timeline', 'area', 'time', 'notes'];
  for (const key of required) {
    if (!lead[key]) return `missing_${key}`;
  }
  if (lead.notes.length < 30) return 'notes_too_short';
  return null;
}

async function createLeadRef(secret) {
  const now = Date.now();
  const date = new Date(now).toISOString().slice(0, 10).replace(/-/g, '');
  const nonce = randomToken(6);
  const ts = String(now);
  const payload = `${ts}.${nonce}`;
  const sig = await signPayload(payload, secret);
  return `SHJ-${date}-${ts}-${nonce}-${sig.slice(0, 12).toUpperCase()}`;
}

async function verifyLeadRef(ref, secret) {
  const m = /^SHJ-(\d{8})-(\d{13})-([A-Z0-9]{6})-([A-Z0-9]{12})$/i.exec(ref);
  if (!m) return { ok: false, reason: 'invalid_format' };

  const ts = m[2];
  const nonce = m[3].toUpperCase();
  const providedSig = m[4].toUpperCase();

  const payload = `${ts}.${nonce}`;
  const expectedSig = (await signPayload(payload, secret)).slice(0, 12).toUpperCase();
  if (!safeEqual(providedSig, expectedSig)) return { ok: false, reason: 'invalid_signature' };

  const ageMs = Date.now() - Number(ts);
  if (!Number.isFinite(ageMs) || ageMs < 0) return { ok: false, reason: 'invalid_timestamp' };
  if (ageMs > REF_TTL_DAYS * 24 * 60 * 60 * 1000) return { ok: false, reason: 'expired' };

  return { ok: true, reason: 'verified' };
}

function randomToken(len) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}

async function signPayload(payload, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return base64Url(signature);
}

function base64Url(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}
