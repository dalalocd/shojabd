function track(event, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', event, params);
  }
}


function updateFormProgress(form) {
  const fields = Array.from(form.querySelectorAll('input[required], select[required], textarea[required]'));
  const filled = fields.filter((el) => String(el.value || '').trim().length > 0).length;
  const pct = Math.round((filled / Math.max(fields.length, 1)) * 100);
  const bar = document.getElementById('formProgressBar');
  const text = document.getElementById('formProgressText');
  const lang = localStorage.getItem('shojabd_lang') || 'bn';
  if (bar) bar.style.width = `${pct}%`;
  if (text) text.textContent = lang === 'bn' ? `অগ্রগতি: ${pct}%` : `Progress: ${pct}%`;
}

const i18n = {
  en: {
    nav_services: 'Services', nav_websites: 'Websites', nav_how: 'How it works', nav_partners: 'Providers', nav_book: 'Book Now',
    hero_title: 'Trusted local services, fast.',
    hero_sub: 'AC servicing and home cleaning in Dhaka, with quick response and verified providers.',
    hero_book: 'Book a Service', hero_website: 'Get a Business Website', hero_join: 'Join as Provider',
    services_title: 'Launch Services (V1)', ac_title: 'AC Servicing',
    ac_desc: 'General service, gas check/refill, cooling diagnosis, urgent repair.',
    clean_title: 'Home Cleaning', clean_desc: 'Deep cleaning, move-in/move-out cleanup, kitchen and bathroom intensive service.',
    how_title: 'How it works', how_1: 'Submit your service request.', how_2: 'We match you with a verified provider in your area.', how_3: 'Provider confirms timing and completes the job.',
    form_title: 'Book a Service', form_sub: 'Fill this quick form and we’ll route your request to the right provider.',
    label_name: 'Full Name', label_phone: 'Phone / WhatsApp', label_company: 'Company / Brand', label_service: 'Service Type', label_budget: 'Budget Range', label_timeline: 'Timeline', label_area: 'Area',
    label_time: 'Preferred Time', label_notes: 'Problem / Notes (min 30 chars)', btn_submit: 'Submit Request',
    form_note: 'By submitting, you agree to be contacted by ShojaBD or its service partners.', rights: 'All rights reserved.',
    area_ph: 'e.g. Dhanmondi', time_ph: 'Today evening / Tomorrow morning', notes_ph: 'Write your requirement...',
    p_title: 'Join as a Service Provider', p_sub: 'We send ready customer leads to service providers in Dhaka. Start with a trial.',
    p_earn_title: 'How partners earn', p_earn_1: 'Pay per qualified lead or monthly package', p_earn_2: 'Area and service filtered leads', p_earn_3: 'More leads for high performers',
    p_std_title: 'Provider standards', p_std_1: 'Fast response (5–10 min)', p_std_2: 'Transparent pricing', p_std_3: 'Professional behavior and quality work',
    p_apply: 'Apply Now', p_business: 'Business Name', p_contact: 'Contact Person', p_phone: 'Phone / WhatsApp', p_service: 'Primary Service', p_area: 'Coverage Areas', p_submit: 'Submit Application',
    opt_select: 'Select one',
    web_title: 'Get a Business Website in 48–72 Hours',
    web_sub: 'We build simple, high-converting websites for local businesses that need more calls and more trust.',
    web_cta: 'Get Website Quote', web_home_services: 'Need Home Service?', web_packages: 'Website Packages',
    web_form_title: 'Website Requirement Form', web_form_sub: 'Share your business details and we’ll send a proposal quickly.',
    web_name: 'Full Name', web_phone: 'Phone / WhatsApp', web_business: 'Business Name', web_type: 'Business Type',
    web_goal: 'Main Goal', web_budget: 'Budget Range', web_notes: 'Notes', web_submit: 'Submit Website Request'
  },
  bn: {
    nav_services: 'সার্ভিস', nav_websites: 'ওয়েবসাইট', nav_how: 'কীভাবে কাজ করে', nav_partners: 'প্রোভাইডার', nav_book: 'এখনই বুক করুন',
    hero_title: 'দ্রুত বিশ্বস্ত লোকাল সার্ভিস',
    hero_sub: 'ঢাকায় AC সার্ভিসিং এবং হোম ক্লিনিং—দ্রুত রেসপন্স, ভেরিফায়েড প্রোভাইডার, এবং ফেয়ার প্রাইস।',
    hero_book: 'সার্ভিস বুক করুন', hero_website: 'ব্যবসার ওয়েবসাইট করুন', hero_join: 'প্রোভাইডার হিসেবে যোগ দিন',
    services_title: 'শুরুতে যে সার্ভিসগুলো', ac_title: 'AC সার্ভিসিং',
    ac_desc: 'জেনারেল সার্ভিস, গ্যাস চেক/রিফিল, কুলিং সমস্যা ডায়াগনসিস, জরুরি রিপেয়ার।',
    clean_title: 'হোম ক্লিনিং', clean_desc: 'ডিপ ক্লিনিং, মুভ-ইন/মুভ-আউট ক্লিনআপ, কিচেন ও বাথরুম ইনটেনসিভ সার্ভিস।',
    how_title: 'কীভাবে কাজ করে', how_1: 'আপনি সার্ভিস রিকোয়েস্ট সাবমিট করেন।', how_2: 'আমরা আপনার এরিয়ার ভেরিফায়েড প্রোভাইডারের সাথে ম্যাচ করি।', how_3: 'প্রোভাইডার সময় কনফার্ম করে কাজ সম্পন্ন করে।',
    form_title: 'সার্ভিস বুকিং ফর্ম', form_sub: 'ফর্মটি পূরণ করুন, আমরা দ্রুত সঠিক প্রোভাইডারের কাছে রিকোয়েস্ট পাঠিয়ে দেব।',
    label_name: 'পূর্ণ নাম', label_phone: 'ফোন / WhatsApp', label_company: 'কোম্পানি / ব্র্যান্ড', label_service: 'সার্ভিস টাইপ', label_budget: 'বাজেট রেঞ্জ', label_timeline: 'কবে দরকার', label_area: 'এরিয়া',
    label_time: 'পছন্দের সময়', label_notes: 'সমস্যা / নোটস (কমপক্ষে ৩০ অক্ষর)', btn_submit: 'রিকোয়েস্ট সাবমিট করুন',
    form_note: 'সাবমিট করলে ShojaBD বা আমাদের পার্টনার আপনার সাথে যোগাযোগ করতে পারবে।', rights: 'সর্বস্বত্ব সংরক্ষিত।',
    area_ph: 'যেমন: ধানমন্ডি', time_ph: 'আজ সন্ধ্যা / কাল সকাল', notes_ph: 'আপনার প্রয়োজন লিখুন...',
    p_title: 'প্রোভাইডার হিসেবে যোগ দিন', p_sub: 'আমরা ঢাকায় সার্ভিস প্রোভাইডারদের জন্য রেডি কাস্টমার লিড পাঠাই। প্রথমে ট্রায়াল দিয়ে শুরু করুন।',
    p_earn_title: 'কীভাবে আয় হবে', p_earn_1: 'প্রতি কুয়ালিফায়েড লিড বা মাসিক প্যাকেজ', p_earn_2: 'এরিয়া ও সার্ভিসভিত্তিক লিড', p_earn_3: 'ভালো পারফরমেন্সে বেশি লিড',
    p_std_title: 'প্রোভাইডার স্ট্যান্ডার্ড', p_std_1: 'দ্রুত রেসপন্স (৫–১০ মিনিট)', p_std_2: 'স্বচ্ছ মূল্য', p_std_3: 'পেশাদার আচরণ ও মানসম্পন্ন কাজ',
    p_apply: 'এখনই আবেদন করুন', p_business: 'ব্যবসার নাম', p_contact: 'কন্টাক্ট পারসন', p_phone: 'ফোন / WhatsApp', p_service: 'প্রধান সার্ভিস', p_area: 'কভারেজ এরিয়া', p_submit: 'আবেদন সাবমিট করুন',
    opt_select: 'একটি বেছে নিন',
    web_title: '৪৮–৭২ ঘণ্টায় ব্যবসার ওয়েবসাইট',
    web_sub: 'লোকাল ব্যবসার জন্য সহজ, দ্রুত এবং কনভার্শন-ফোকাসড ওয়েবসাইট তৈরি করি।',
    web_cta: 'ওয়েবসাইট কোট নিন', web_home_services: 'হোম সার্ভিস দরকার?', web_packages: 'ওয়েবসাইট প্যাকেজ',
    web_form_title: 'ওয়েবসাইট রিকোয়ারমেন্ট ফর্ম', web_form_sub: 'ব্যবসার তথ্য দিন, আমরা দ্রুত প্রস্তাব পাঠাব।',
    web_name: 'পূর্ণ নাম', web_phone: 'ফোন / WhatsApp', web_business: 'ব্যবসার নাম', web_type: 'ব্যবসার ধরন',
    web_goal: 'মূল লক্ষ্য', web_budget: 'বাজেট রেঞ্জ', web_notes: 'নোটস', web_submit: 'ওয়েবসাইট রিকোয়েস্ট সাবমিট করুন'
  }
};

function setLang(lang) {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang][key]) {
      const hasInput = el.querySelector && el.querySelector('input,select,textarea');
      if (!hasInput) el.textContent = i18n[lang][key];
      else el.childNodes[0].nodeValue = i18n[lang][key] + '\n            ';
    }
  });

  const toggle = document.getElementById('langToggle');
  if (toggle) toggle.textContent = lang === 'bn' ? 'English' : 'বাংলা';

  const area = document.querySelector('input[name="area"]');
  const time = document.querySelector('input[name="time"]');
  const notes = document.querySelector('textarea[name="notes"]');
  if (area) area.placeholder = i18n[lang].area_ph;
  if (time) time.placeholder = i18n[lang].time_ph;
  if (notes) notes.placeholder = i18n[lang].notes_ph;

  localStorage.setItem('shojabd_lang', lang);
}

document.getElementById('year').textContent = new Date().getFullYear();
const saved = localStorage.getItem('shojabd_lang') || 'bn';
setLang(saved);

const toggle = document.getElementById('langToggle');
if (toggle) {
  toggle.addEventListener('click', () => {
    const current = localStorage.getItem('shojabd_lang') || 'bn';
    const next = current === 'bn' ? 'en' : 'bn';
    setLang(next);
    setupWhatsAppLinks(next);
  });
}

const WA_NUMBER = '8801313399918';

function setupWhatsAppLinks(lang = localStorage.getItem('shojabd_lang') || 'bn') {
  const hasBookingForm = !!document.getElementById('leadForm');
  const targetUrl = hasBookingForm ? '#book' : 'index.html#book';

  const waFloat = document.getElementById('whatsappFloat');
  const waHeader = document.getElementById('whatsappHeader');

  if (waFloat) {
    waFloat.href = targetUrl;
    waFloat.textContent = lang === 'bn' ? 'ফর্ম পূরণ করে WhatsApp' : 'Fill Form → WhatsApp';
    waFloat.onclick = () => track('click_whatsapp_cta', { location: 'float', target: targetUrl });
  }
  if (waHeader) {
    waHeader.href = targetUrl;
    waHeader.textContent = lang === 'bn' ? 'ফর্ম দিয়ে শুরু করুন' : 'Start with Form';
    waHeader.onclick = () => track('click_whatsapp_cta', { location: 'header', target: targetUrl });
  }
}

setupWhatsAppLinks(saved);
track('view_page', { path: location.pathname, lang: saved });

const leadForm = document.getElementById('leadForm');
if (leadForm) {
  let started = false;
  updateFormProgress(leadForm);

  leadForm.addEventListener('input', () => {
    if (!started) {
      started = true;
      track('lead_form_started', { path: location.pathname });
    }
    updateFormProgress(leadForm);
  });

  const serviceSelect = document.getElementById('serviceSelect');
  document.querySelectorAll('.chip[data-service]').forEach((chip) => {
    chip.addEventListener('click', () => {
      if (serviceSelect) {
        serviceSelect.value = chip.getAttribute('data-service') || '';
        serviceSelect.dispatchEvent(new Event('input', { bubbles: true }));
      }
      document.querySelectorAll('.chip[data-service]').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      track('quick_service_tapped', { service: serviceSelect?.value || '' });
    });
  });

  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(leadForm);

    const payload = {
      name: String(data.get('name') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      company: String(data.get('company') || '').trim(),
      service: String(data.get('service') || '').trim(),
      budget: String(data.get('budget') || '').trim(),
      timeline: String(data.get('timeline') || '').trim(),
      area: String(data.get('area') || '').trim(),
      time: String(data.get('time') || '').trim(),
      notes: String(data.get('notes') || '').trim()
    };

    let leadRef = '';
    try {
      const res = await fetch('/api/lead/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('lead_create_failed');
      const json = await res.json();
      if (!json?.ok || !json?.ref) throw new Error('lead_create_invalid');
      leadRef = json.ref;
      track('lead_form_submitted', { service: payload.service, area: payload.area });
    } catch (_) {
      track('lead_submit_error', { reason: 'api_unavailable' });
      const lang = localStorage.getItem('shojabd_lang') || 'bn';
      alert(lang === 'bn'
        ? 'দুঃখিত, এখন লিড ভেরিফিকেশন সার্ভিস কাজ করছে না। অনুগ্রহ করে একটু পরে আবার চেষ্টা করুন।'
        : 'Sorry, lead verification is unavailable right now. Please try again shortly.');
      return;
    }

    const lang = localStorage.getItem('shojabd_lang') || 'bn';
    const messageText = lang === 'bn'
      ? `Lead Intake (ShojaBD)\nRef: ${leadRef}\nনাম: ${payload.name}\nকোম্পানি: ${payload.company}\nফোন: ${payload.phone}\nসার্ভিস: ${payload.service}\nবাজেট: ${payload.budget}\nটাইমলাইন: ${payload.timeline}\nএরিয়া: ${payload.area}\nপছন্দের সময়: ${payload.time}\nপ্রয়োজন: ${payload.notes}`
      : `Lead Intake (ShojaBD)\nRef: ${leadRef}\nName: ${payload.name}\nCompany: ${payload.company}\nPhone: ${payload.phone}\nService: ${payload.service}\nBudget: ${payload.budget}\nTimeline: ${payload.timeline}\nArea: ${payload.area}\nPreferred Time: ${payload.time}\nNeed: ${payload.notes}`;

    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(messageText)}`, '_blank');
    track('whatsapp_opened_with_ref', { ref: leadRef, service: payload.service });
    alert(lang === 'bn' ? 'ধন্যবাদ। আপনার তথ্য ভেরিফাই হয়েছে এবং WhatsApp-এ রেডি মেসেজ খোলা হয়েছে।' : 'Thanks. Your lead details were verified and WhatsApp opened with a ready message.');
    leadForm.reset();
    document.querySelectorAll('.chip[data-service]').forEach((c) => c.classList.remove('active'));
    updateFormProgress(leadForm);
  });
}

const websiteLeadForm = document.getElementById('websiteLeadForm');
if (websiteLeadForm) {
  websiteLeadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(websiteLeadForm);

    const payload = {
      name: String(data.get('name') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      business_name: String(data.get('business_name') || '').trim(),
      business_type: String(data.get('business_type') || '').trim(),
      goal: String(data.get('goal') || '').trim(),
      budget: String(data.get('budget') || '').trim(),
      notes: String(data.get('notes') || '').trim()
    };

    let ref = '';
    try {
      const res = await fetch('/api/websites/lead-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('web_lead_failed');
      const json = await res.json();
      if (!json?.ok || !json?.ref) throw new Error('web_lead_invalid');
      ref = json.ref;
      track('website_lead_submitted', { business_type: payload.business_type, budget: payload.budget });
    } catch {
      alert('Sorry, website lead system is temporarily unavailable. Please try again.');
      return;
    }

    const msg = `Website Lead (ShojaBD)\nRef: ${ref}\nName: ${payload.name}\nPhone: ${payload.phone}\nBusiness: ${payload.business_name}\nType: ${payload.business_type}\nGoal: ${payload.goal}\nBudget: ${payload.budget}\nNotes: ${payload.notes}`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    alert(`Thanks! Your website request is recorded. Ref: ${ref}`);
    websiteLeadForm.reset();
  });
}
