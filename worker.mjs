const DEFAULT_FORMSPREE_ENDPOINT = 'https://formspree.io/f/xjkoebdb';
const REF_TTL_DAYS = 30;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (isBlockedAssetPath(url.pathname)) {
      return new Response('Not found', { status: 404 });
    }

    // Existing lead gate
    if (url.pathname === '/api/lead/create' && request.method === 'POST') {
      return handleLeadCreate(request, env);
    }

    if (url.pathname === '/api/lead/verify' && (request.method === 'GET' || request.method === 'POST')) {
      return handleLeadVerify(request, env, url);
    }

    if (url.pathname === '/api/websites/lead-create' && request.method === 'POST') {
      return handleWebsiteLeadCreate(request, env);
    }

    // Order workflow APIs
    if (url.pathname === '/api/orders/create' && request.method === 'POST') {
      return handleOrderCreate(request, env);
    }

    if (url.pathname === '/api/orders/provider-done' && request.method === 'POST') {
      return handleProviderDone(request, env);
    }

    if (url.pathname === '/api/orders/client-confirm' && request.method === 'POST') {
      return handleClientConfirm(request, env);
    }

    if (url.pathname === '/api/orders/payment-confirm' && request.method === 'POST') {
      return handlePaymentConfirm(request, env);
    }

    if (url.pathname === '/api/orders/status' && request.method === 'POST') {
      return handleOrderStatus(request, env);
    }

    if (url.pathname.startsWith('/o/') && request.method === 'GET') {
      return handleOrderPortalPage(url.pathname, env);
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not found', { status: 404 });
  }
};

// -----------------------------
// Lead gate
// -----------------------------
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

  try {
    await fetch(formspreeEndpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
  } catch {}

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

async function handleWebsiteLeadCreate(request, env) {
  if (!env.LEAD_SIGNING_SECRET) {
    return json({ ok: false, error: 'missing_signing_secret' }, 500);
  }

  const body = await safeJson(request);
  if (!body.ok) return json({ ok: false, error: 'invalid_json' }, 400);

  const lead = {
    name: String(body.data?.name || '').trim(),
    phone: String(body.data?.phone || '').trim(),
    business_name: String(body.data?.business_name || '').trim(),
    business_type: String(body.data?.business_type || '').trim(),
    goal: String(body.data?.goal || '').trim(),
    budget: String(body.data?.budget || '').trim(),
    notes: String(body.data?.notes || '').trim()
  };

  if (!lead.name || !lead.phone || !lead.business_name || !lead.business_type || !lead.goal || !lead.budget || !lead.notes) {
    return json({ ok: false, error: 'missing_fields' }, 400);
  }

  const ref = await createSignedRef('WEB', env.LEAD_SIGNING_SECRET);

  try {
    const formspreeEndpoint = env.FORMSPREE_ENDPOINT || DEFAULT_FORMSPREE_ENDPOINT;
    const formData = new URLSearchParams({
      website_ref: ref,
      source: 'website_builder_form',
      ...lead
    });
    await fetch(formspreeEndpoint, {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString()
    });
  } catch {}

  return json({ ok: true, ref });
}

// -----------------------------
// Order workflow
// -----------------------------

async function handleOrderCreate(request, env) {
  const cfgErr = requireSupabase(env);
  if (cfgErr) return cfgErr;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  const ref = String(body?.ref || '').trim();
  if (!ref) return json({ ok: false, error: 'missing_ref' }, 400);

  const orderInsert = {
    ref,
    status: 'provider_assigned',
    client_name: String(body?.client_name || '').trim() || null,
    client_phone: String(body?.client_phone || '').trim() || null,
    provider_name: String(body?.provider_name || '').trim() || null,
    provider_phone: String(body?.provider_phone || '').trim() || null,
    service_area: String(body?.service_area || '').trim() || null,
    notes: String(body?.notes || '').trim() || null
  };

  const inserted = await supabaseInsertOne(env, 'orders', orderInsert);
  if (!inserted.ok) return json({ ok: false, error: inserted.error }, 500);

  const providerToken = await rpc(env, 'create_order_access_token', { p_order_ref: ref, p_role: 'provider', p_ttl_minutes: 10080 });
  const clientToken = await rpc(env, 'create_order_access_token', { p_order_ref: ref, p_role: 'client', p_ttl_minutes: 10080 });

  if (!providerToken.ok || !clientToken.ok) {
    return json({ ok: false, error: 'token_generation_failed', details: [providerToken.error, clientToken.error] }, 500);
  }

  const base = env.PUBLIC_BASE_URL || 'https://shojabd.com';
  return json({
    ok: true,
    ref,
    provider_link: `${base}/o/${providerToken.data}`,
    client_link: `${base}/o/${clientToken.data}`
  });
}

async function handleProviderDone(request, env) {
  const cfgErr = requireSupabase(env);
  if (cfgErr) return cfgErr;

  const body = await safeJson(request);
  if (!body.ok) return json({ ok: false, error: 'invalid_json' }, 400);

  const token = String(body.data?.token || '').trim();
  const items = body.data?.items;
  const note = String(body.data?.note || '').trim() || null;

  if (!token) return json({ ok: false, error: 'missing_token' }, 400);
  if (!Array.isArray(items) || items.length === 0) return json({ ok: false, error: 'missing_items' }, 400);

  const access = await validateToken(env, token, 'provider');
  if (!access.ok) return json({ ok: false, error: access.error }, access.status || 403);

  const result = await rpc(env, 'provider_mark_done', {
    p_order_ref: access.data.order_ref,
    p_items: items,
    p_provider_note: note
  });

  if (!result.ok) return json({ ok: false, error: result.error }, 400);
  return json({ ok: true, ref: access.data.order_ref, status: 'work_submitted' });
}

async function handleClientConfirm(request, env) {
  const cfgErr = requireSupabase(env);
  if (cfgErr) return cfgErr;

  const body = await safeJson(request);
  if (!body.ok) return json({ ok: false, error: 'invalid_json' }, 400);

  const token = String(body.data?.token || '').trim();
  const note = String(body.data?.note || '').trim() || null;
  if (!token) return json({ ok: false, error: 'missing_token' }, 400);

  const access = await validateToken(env, token, 'client');
  if (!access.ok) return json({ ok: false, error: access.error }, access.status || 403);

  const confirm = await rpc(env, 'client_confirm_done', {
    p_order_ref: access.data.order_ref,
    p_client_note: note
  });

  if (!confirm.ok) return json({ ok: false, error: confirm.error }, 400);

  const inv = await rpc(env, 'issue_invoice', { p_order_ref: access.data.order_ref });
  if (!inv.ok) return json({ ok: false, error: inv.error }, 400);

  return json({ ok: true, ref: access.data.order_ref, status: 'invoiced', invoice_no: inv.data });
}

async function handlePaymentConfirm(request, env) {
  const cfgErr = requireSupabase(env);
  if (cfgErr) return cfgErr;

  const body = await safeJson(request);
  if (!body.ok) return json({ ok: false, error: 'invalid_json' }, 400);

  const token = String(body.data?.token || '').trim();
  const amount = Number(body.data?.amount || 0);
  const method = String(body.data?.method || 'bkash').trim();
  const txnId = String(body.data?.txn_id || '').trim() || null;
  const proofUrl = String(body.data?.proof_url || '').trim() || null;

  if (!token) return json({ ok: false, error: 'missing_token' }, 400);
  if (!Number.isFinite(amount) || amount <= 0) return json({ ok: false, error: 'invalid_amount' }, 400);

  const clientTry = await validateToken(env, token, 'client');
  const providerTry = clientTry.ok ? null : await validateToken(env, token, 'provider');
  const access = clientTry.ok ? clientTry : providerTry;

  if (!access?.ok) return json({ ok: false, error: 'invalid_or_expired_token' }, 403);

  const actor = access.data.role;
  const ref = access.data.order_ref;

  const save = await rpc(env, 'record_payment_confirmation', {
    p_order_ref: ref,
    p_actor: actor,
    p_amount: amount,
    p_method: method,
    p_txn_id: txnId,
    p_proof_url: proofUrl
  });

  if (!save.ok) return json({ ok: false, error: save.error }, 400);

  const receiptAttempt = await rpc(env, 'issue_receipt_if_dual_confirmed', { p_order_ref: ref });

  if (receiptAttempt.ok) {
    return json({ ok: true, ref, status: 'receipt_issued', receipt_no: receiptAttempt.data });
  }

  return json({ ok: true, ref, status: 'payment_confirmed_waiting_other_party' });
}

async function handleOrderStatus(request, env) {
  const cfgErr = requireSupabase(env);
  if (cfgErr) return cfgErr;

  const body = await safeJson(request);
  if (!body.ok) return json({ ok: false, error: 'invalid_json' }, 400);

  const token = String(body.data?.token || '').trim();
  if (!token) return json({ ok: false, error: 'missing_token' }, 400);

  const clientTry = await validateToken(env, token, 'client');
  const providerTry = clientTry.ok ? null : await validateToken(env, token, 'provider');
  const access = clientTry.ok ? clientTry : providerTry;
  if (!access?.ok) return json({ ok: false, error: 'invalid_or_expired_token' }, 403);

  const order = await supabaseSelectOne(env, 'orders', `ref=eq.${encodeURIComponent(access.data.order_ref)}`);
  if (!order.ok) return json({ ok: false, error: order.error }, 500);

  return json({ ok: true, order: order.data, role: access.data.role });
}

async function handleOrderPortalPage(pathname, env) {
  const token = pathname.split('/').pop() || '';

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>ShojaBD Order Portal</title>
  <style>
    body{font-family:Inter,system-ui,Arial,sans-serif;background:#081024;color:#e6edf7;padding:20px;max-width:760px;margin:auto}
    .card{background:#0e1a32;border:1px solid #1f2b46;border-radius:12px;padding:16px;margin:12px 0}
    input,textarea,button,select{width:100%;padding:10px;margin:6px 0;border-radius:8px;border:1px solid #2b3d63;background:#0b1222;color:#fff}
    button{background:#2e8cff;border:none;font-weight:700;cursor:pointer}
    .muted{color:#9fb2d4;font-size:13px}
    .row{display:grid;grid-template-columns:1fr 120px 140px;gap:8px}
  </style>
</head>
<body>
  <h1>ShojaBD Order Portal</h1>
  <div id="status" class="card">Loading...</div>

  <div id="providerBox" class="card" style="display:none">
    <h3>Provider: Submit completed work</h3>
    <div id="items"></div>
    <button id="addItem">+ Add item</button>
    <textarea id="providerNote" placeholder="Completion note (optional)"></textarea>
    <button id="submitDone">Submit Work Done</button>
  </div>

  <div id="clientBox" class="card" style="display:none">
    <h3>Client: Confirm completion</h3>
    <textarea id="clientNote" placeholder="Comment (optional)"></textarea>
    <button id="confirmDone">Confirm Work Done</button>
  </div>

  <div id="paymentBox" class="card" style="display:none">
    <h3>Payment Confirmation</h3>
    <input id="amount" type="number" step="0.01" placeholder="Amount" />
    <select id="method"><option value="bkash">bKash</option><option value="cash">Cash</option><option value="bank">Bank</option></select>
    <input id="txn" placeholder="Txn ID (optional)" />
    <button id="confirmPayment">Confirm Payment</button>
  </div>

<script>
const token = ${JSON.stringify(token)};
const statusEl = document.getElementById('status');
const providerBox = document.getElementById('providerBox');
const clientBox = document.getElementById('clientBox');
const paymentBox = document.getElementById('paymentBox');
const itemsEl = document.getElementById('items');

function lineItem(){
  const div = document.createElement('div');
  div.className='row';
  div.innerHTML = '<input placeholder="Item name" /><input type="number" step="0.01" placeholder="Qty" value="1"/><input type="number" step="0.01" placeholder="Unit price" />';
  itemsEl.appendChild(div);
}
lineItem();

document.getElementById('addItem').onclick = lineItem;

async function post(path, body){
  const res = await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  return res.json();
}

async function refresh(){
  const r = await post('/api/orders/status',{token});
  if(!r.ok){ statusEl.textContent='Access invalid or expired.'; return; }
  const o = r.order;
  statusEl.innerHTML = '<b>Ref:</b> '+o.ref+'<br><b>Status:</b> '+o.status+'<br><b>Total:</b> '+(o.total??0)+' BDT';

  providerBox.style.display = (r.role==='provider' && ['provider_assigned','created','on_hold'].includes(o.status)) ? 'block':'none';
  clientBox.style.display = (r.role==='client' && o.status==='work_submitted') ? 'block':'none';
  paymentBox.style.display = ['invoiced','payment_confirmed_waiting_other_party'].includes(o.status) ? 'block':'none';
}

window.submitDone.onclick = async ()=>{
  const rows = [...itemsEl.querySelectorAll('.row')];
  const items = rows.map(r=>{
    const [n,q,p]=r.querySelectorAll('input');
    return {item_name:n.value.trim(), qty:Number(q.value||1), unit_price:Number(p.value||0)};
  }).filter(x=>x.item_name && x.qty>0);
  const note = document.getElementById('providerNote').value;
  const r = await post('/api/orders/provider-done',{token,items,note});
  alert(r.ok ? 'Submitted.' : ('Error: '+(r.error||'failed')));
  refresh();
};

window.confirmDone.onclick = async ()=>{
  const note = document.getElementById('clientNote').value;
  const r = await post('/api/orders/client-confirm',{token,note});
  alert(r.ok ? ('Invoice issued: '+r.invoice_no) : ('Error: '+(r.error||'failed')));
  refresh();
};

window.confirmPayment.onclick = async ()=>{
  const amount = Number(document.getElementById('amount').value||0);
  const method = document.getElementById('method').value;
  const txn_id = document.getElementById('txn').value;
  const r = await post('/api/orders/payment-confirm',{token,amount,method,txn_id});
  alert(r.ok ? (r.receipt_no ? ('Receipt issued: '+r.receipt_no) : 'Payment confirmation saved.') : ('Error: '+(r.error||'failed')));
  refresh();
};

refresh();
</script>
</body></html>`;

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

// -----------------------------
// Supabase helpers
// -----------------------------

function requireSupabase(env) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ ok: false, error: 'missing_supabase_config' }, 500);
  }
  return null;
}

async function validateToken(env, token, role) {
  const r = await rpc(env, 'validate_order_access_token', { p_token: token, p_role: role });
  if (!r.ok) return { ok: false, error: r.error, status: 403 };
  if (!Array.isArray(r.data) || !r.data[0]) return { ok: false, error: 'invalid_or_expired_token', status: 403 };
  return { ok: true, data: r.data[0] };
}

async function rpc(env, fn, payload) {
  const url = `${env.SUPABASE_URL}/rest/v1/rpc/${fn}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify(payload || {})
  });

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    return { ok: false, error: data?.message || data?.hint || String(data || 'rpc_failed') };
  }

  return { ok: true, data };
}

async function supabaseInsertOne(env, table, row) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'prefer': 'return=representation',
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    },
    body: JSON.stringify(row)
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: data?.message || 'insert_failed' };
  return { ok: true, data: data?.[0] || null };
}

async function supabaseSelectOne(env, table, filterQuery) {
  const url = `${env.SUPABASE_URL}/rest/v1/${table}?select=*&${filterQuery}&limit=1`;
  const res = await fetch(url, {
    headers: {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, error: data?.message || 'select_failed' };
  return { ok: true, data: data?.[0] || null };
}

async function safeJson(request) {
  try {
    return { ok: true, data: await request.json() };
  } catch {
    return { ok: false };
  }
}

// -----------------------------
// Shared utils
// -----------------------------
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
  return createSignedRef('SHJ', secret);
}

async function createSignedRef(prefix, secret) {
  const now = Date.now();
  const date = new Date(now).toISOString().slice(0, 10).replace(/-/g, '');
  const nonce = randomToken(6);
  const ts = String(now);
  const payload = `${ts}.${nonce}`;
  const sig = await signPayload(payload, secret);
  return `${prefix}-${date}-${ts}-${nonce}-${sig.slice(0, 12).toUpperCase()}`;
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
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
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

function isBlockedAssetPath(pathname) {
  return /^(\/\.git|\/\.wrangler|\/worker\.mjs$|\/wrangler\.jsonc$|\/package\.json$|\/package-lock\.json$|\/pnpm-lock\.yaml$|\/yarn\.lock$)/i.test(pathname);
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
