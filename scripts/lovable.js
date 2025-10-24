// Enhancements injected for GitHub Pages build
// - Remove public email and Follow Us sections
// - Show Contact modal (name, email, city + captcha)
// - Remove Partner/Volunteer buttons
// - Show Membership application modal on "Apply for Membership"
(function(){
  const ready = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };
  function $(sel, root=document){ return root.querySelector(sel); }
  function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
  function make(tag, attrs={}, children=[]) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if (k === 'class') el.className = v; else if (k === 'text') el.textContent = v; else el.setAttribute(k, v);
    });
    children.forEach(c=> el.appendChild(c));
    return el;
  }
  function eqText(el, txt){ return (el?.textContent||'').trim().toLowerCase() === String(txt).trim().toLowerCase(); }
  function hasText(el, txt){ return (el?.textContent||'').toLowerCase().includes(String(txt).toLowerCase()); }
  function injectCSS(css){ const s = make('style', { id: 'adpc-custom-injected' }); s.textContent = css; document.head.appendChild(s); }
  // Compute project base path (e.g., /ADPC) for GitHub Pages project sites
  function projectBase(){
    // pathname like /ADPC/..., we want "/ADPC"
    const parts = (location.pathname || '/').split('/').filter(Boolean);
    // If hosted at project path, first segment is repo name
    if (parts.length > 0) return '/' + parts[0];
    return '';
  }
  function fixUrl(url){
    if (!url) return url;
    const base = projectBase();
    const origin = location.origin;
    // Normalize
    try {
      // Absolute URL case
      if (url.startsWith(origin + '/assets/')) return origin + base + url.slice(origin.length);
      if (url.startsWith(origin + '/images/')) return origin + base + url.slice(origin.length);
    } catch {}
    // Root-relative case
    if (url.startsWith('/assets/')) return base + url;
    if (url.startsWith('/images/')) return base + url;
    return url;
  }
  function rewriteSrcAttributes(root=document){
    const selectors = [
      ['img','src'],
      ['source','src'],
      ['link[rel="preload" i][as="image" i], link[rel="image" i], link[rel="icon" i]','href'],
      ['script','src'],
    ];
    selectors.forEach(([sel, attr])=>{
      $all(sel, root).forEach(el=>{
        const v = el.getAttribute(attr);
        const nv = fixUrl(v);
        if (nv && nv !== v) el.setAttribute(attr, nv);
      });
    });
    // srcset
    $all('img[srcset], source[srcset]', root).forEach(el=>{
      const v = el.getAttribute('srcset')||'';
      if (!v) return;
      const parts = v.split(',').map(s=>s.trim()).filter(Boolean).map(item=>{
        const [u, d] = item.split(/\s+/,2);
        const fu = fixUrl(u);
        return d ? `${fu} ${d}` : fu;
      });
      const nv = parts.join(', ');
      if (nv !== v) el.setAttribute('srcset', nv);
    });
  }
  function observeRewrites(){
    const mo = new MutationObserver(muts=>{
      muts.forEach(m=>{
        if (m.type === 'attributes' && (m.attributeName === 'src' || m.attributeName === 'href' || m.attributeName === 'srcset')){
          const el = m.target;
          if (el && el.getAttribute){
            const attr = m.attributeName;
            const v = el.getAttribute(attr);
            const nv = attr === 'srcset' ? (function(v){
              const parts = (v||'').split(',').map(s=>s.trim()).filter(Boolean).map(item=>{ const [u,d] = item.split(/\s+/,2); const fu = fixUrl(u); return d ? `${fu} ${d}` : fu; });
              return parts.join(', ');
            })(v) : fixUrl(v);
            if (nv && nv !== v) el.setAttribute(attr, nv);
          }
        } else if (m.type === 'childList') {
          m.addedNodes.forEach(node=>{ if (node.nodeType === 1) rewriteSrcAttributes(node); });
        }
      });
    });
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['src','href','srcset'] });
  }
  // Ensure a favicon is present and points to the ADPC logo
  function ensureFavicon(){
    try {
      const href = fixUrl('/assets/adpc-logo-CAdYi-Xb.jpg');
      let link = document.querySelector('link[rel~="icon"]');
      if (!link) {
        link = make('link', { rel: 'icon', type: 'image/jpeg', href });
        document.head.appendChild(link);
      } else {
        link.setAttribute('href', href);
        link.setAttribute('type', 'image/jpeg');
      }
      let apple = document.querySelector('link[rel="apple-touch-icon"]');
      if (!apple) {
        apple = make('link', { rel: 'apple-touch-icon', href });
        document.head.appendChild(apple);
      } else {
        apple.setAttribute('href', href);
      }
    } catch {}
  }

  // Disabled: avoid injecting duplicate legal links (handled in page footers)
  function ensureLegalLinks(){}

  // Ensure footer policy links point to the correct pages
  function fixFooterPolicyLinks(root=document){
    const base = projectBase();
    $all('footer a', root).forEach(a=>{
      const t = (a.textContent||'').trim().toLowerCase();
      if (t === 'privacy policy') a.setAttribute('href', base + '/privacy.html');
      else if (t === 'terms of service') a.setAttribute('href', base + '/terms.html');
      else if (t === 'cookie policy') a.setAttribute('href', base + '/cookies.html');
    });
  }
  // Simple math captcha
  function createCaptcha(labelEl, inputEl){
    const a = 1 + Math.floor(Math.random()*9);
    const b = 1 + Math.floor(Math.random()*9);
    const expected = a + b;
    if (labelEl) labelEl.textContent = `Captcha: What is ${a} + ${b}?`;
    if (inputEl) inputEl.value = '';
    return expected;
  }
  function buildContactModal(){
    const overlay = make('div', { class: 'modal-overlay', id: 'contact-modal', 'aria-hidden': 'true' });
    const modal = make('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'contact-modal-title' });
    const header = make('header', {}, [ make('span', { id: 'contact-modal-title', text: 'Contact Us' }), make('button', { type: 'button', 'data-close-contact': '', 'aria-label': 'Close', text: '×' }) ]);
    const content = make('div', { class: 'content' });
    const form = make('form', { id: 'contact-form', action: 'https://formspree.io/f/mqayrjqb', method: 'POST', 'accept-charset': 'UTF-8' });
    const row = make('div', { class: 'row' });
    const name = make('div', {}, [ make('label', { for: 'contact-name', text: 'Full name' }), make('input', { id: 'contact-name', name: 'contact_full_name', type: 'text', placeholder: 'Your name', required: '' }) ]);
    const email = make('div', {}, [ make('label', { for: 'contact-email', text: 'Email' }), make('input', { id: 'contact-email', name: 'contact_email', type: 'email', placeholder: 'you@example.com', required: '' }) ]);
    const city = make('div', {}, [ make('label', { for: 'contact-city', text: 'City' }), make('input', { id: 'contact-city', name: 'contact_city', type: 'text', placeholder: 'Your city', required: '' }) ]);
    const cap = make('div', {}, [ make('label', { id: 'contact-captcha-label', for: 'contact-captcha', text: 'Captcha' }), make('input', { id: 'contact-captcha', name: 'contact_captcha', type: 'text', inputmode: 'numeric', placeholder: 'Answer', required: '' }), make('div', { id: 'contact-captcha-error', class: 'error', text: 'Incorrect answer. Please try again.' }) ]);
    row.append(name, email, city, cap);
    content.appendChild(row);
    const hidden = make('input', { type: 'hidden', name: 'form_name', value: 'contact' });
    const actions = make('div', { class: 'actions' }, [ make('button', { type: 'button', class: 'btn secondary', 'data-close-contact': '', text: 'Cancel' }), make('button', { type: 'submit', class: 'btn', id: 'contact-submit', text: 'Send' }) ]);
    form.append(content, hidden, actions);
    modal.append(header, form);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    let expected = createCaptcha($('#contact-captcha-label'), $('#contact-captcha'));
    $all('[data-close-contact]', overlay).forEach(el => el.addEventListener('click', () => hide(overlay)));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameVal = $('#contact-name').value.trim();
      const emailVal = $('#contact-email').value.trim();
      const cityVal = $('#contact-city').value.trim();
      const capVal = $('#contact-captcha').value.trim();
      const err = $('#contact-captcha-error'); err.style.display = 'none';
      if (!nameVal || !emailVal || !cityVal) { alert('Please fill out all fields.'); return; }
      if (Number(capVal) !== Number(expected)) { err.style.display = 'block'; expected = createCaptcha($('#contact-captcha-label'), $('#contact-captcha')); return; }
      try {
        const res = await fetch(form.getAttribute('action'), { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) });
        if (res.ok) {
          alert('Thanks! We\'ll be in touch.');
          hide(overlay);
          form.reset();
          expected = createCaptcha($('#contact-captcha-label'), $('#contact-captcha'));
        } else {
          alert('There was a problem submitting the form. Please try again.');
        }
      } catch(e) {
        alert('Network error. Please try again.');
      }
    });
    return { overlay, reset: () => { expected = createCaptcha($('#contact-captcha-label'), $('#contact-captcha')); form.reset(); } };
  }
  function buildMembershipModal(){
    const overlay = make('div', { class: 'modal-overlay', id: 'membership-modal', 'aria-hidden': 'true' });
    const modal = make('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'membership-modal-title' });
    const header = make('header', {}, [ make('span', { id: 'membership-modal-title', text: 'Apply for Membership' }), make('button', { type: 'button', 'data-close-membership': '', 'aria-label': 'Close', text: '×' }) ]);
    const content = make('div', { class: 'content' });
    const form = make('form', { id: 'membership-form', action: 'https://formspree.io/f/mqayrjqb', method: 'POST', 'accept-charset': 'UTF-8' });
    const row = make('div', { class: 'row' });
    const name = make('div', {}, [ make('label', { for: 'member-name', text: 'Full name' }), make('input', { id: 'member-name', name: 'member_full_name', type: 'text', placeholder: 'Your name', required: '' }) ]);
    const email = make('div', {}, [ make('label', { for: 'member-email', text: 'Email' }), make('input', { id: 'member-email', name: 'member_email', type: 'email', placeholder: 'you@example.com', required: '' }) ]);
    const org = make('div', {}, [ make('label', { for: 'member-organization', text: 'Organization (optional)' }), make('input', { id: 'member-organization', name: 'member_organization', type: 'text', placeholder: 'Organization' }) ]);
    const role = make('div', {}, [ make('label', { for: 'member-role', text: 'Role' }), make('input', { id: 'member-role', name: 'member_role', type: 'text', placeholder: 'Your role' }) ]);
    const country = make('div', {}, [ make('label', { for: 'member-country', text: 'Country' }), make('input', { id: 'member-country', name: 'member_country', type: 'text', placeholder: 'Country' }) ]);
    const city = make('div', {}, [ make('label', { for: 'member-city', text: 'City' }), make('input', { id: 'member-city', name: 'member_city', type: 'text', placeholder: 'City' }) ]);
    const type = make('div', {}, [ make('label', { for: 'member-type', text: 'Membership type' }), (function(){ const sel = make('select', { id: 'member-type', name: 'member_type' }); sel.append(make('option', { value: 'Individual', text: 'Individual' }), make('option', { value: 'Organization', text: 'Organization' })); return sel; })() ]);
    const cap = make('div', {}, [ make('label', { id: 'member-captcha-label', for: 'member-captcha', text: 'Captcha' }), make('input', { id: 'member-captcha', name: 'member_captcha', type: 'text', inputmode: 'numeric', placeholder: 'Answer', required: '' }), make('div', { id: 'member-captcha-error', class: 'error', text: 'Incorrect answer. Please try again.' }) ]);
    const termsWrap = make('div', { style: 'grid-column:1/-1;display:flex;gap:8px;align-items:center;margin-top:6px;' }, [ make('input', { id: 'member-terms', name: 'member_terms', type: 'checkbox' }), make('label', { for: 'member-terms', style: 'font-size:14px;', text: 'I agree to be contacted about my application.' }) ]);
    row.append(name,email,org,role,country,city,type,cap,termsWrap);
    content.appendChild(row);
    const hidden = make('input', { type: 'hidden', name: 'form_name', value: 'membership' });
    const actions = make('div', { class: 'actions' }, [ make('button', { type: 'button', class: 'btn secondary', 'data-close-membership': '', text: 'Cancel' }), make('button', { type: 'submit', class: 'btn', id: 'membership-submit', text: 'Submit' }) ]);
    form.append(content, hidden, actions);
    modal.append(header, form);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    let expected = createCaptcha($('#member-captcha-label'), $('#member-captcha'));
    $all('[data-close-membership]', overlay).forEach(el => el.addEventListener('click', () => hide(overlay)));
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nameVal = $('#member-name').value.trim();
      const emailVal = $('#member-email').value.trim();
      const terms = $('#member-terms').checked;
      const capVal = $('#member-captcha').value.trim();
      const err = $('#member-captcha-error'); err.style.display = 'none';
      if (!nameVal || !emailVal || !terms) { alert('Please complete name, email, and agree to terms.'); return; }
      if (Number(capVal) !== Number(expected)) { err.style.display = 'block'; expected = createCaptcha($('#member-captcha-label'), $('#member-captcha')); return; }
      try {
        const res = await fetch(form.getAttribute('action'), { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) });
        if (res.ok) {
          alert('Membership application submitted. Thank you!');
          hide(overlay);
          form.reset();
          expected = createCaptcha($('#member-captcha-label'), $('#member-captcha'));
        } else {
          alert('There was a problem submitting the form. Please try again.');
        }
      } catch(e) {
        alert('Network error. Please try again.');
      }
    });
    return { overlay, reset: () => { expected = createCaptcha($('#member-captcha-label'), $('#member-captcha')); form.reset(); } };
  }
  function show(el){ el.style.display = 'flex'; el.setAttribute('aria-hidden','false'); }
  function hide(el){ el.style.display = 'none'; el.setAttribute('aria-hidden','true'); }

  ready(()=>{
    // Rewrite any root-relative asset URLs to project-relative
    rewriteSrcAttributes(document);
    observeRewrites();
    ensureFavicon();
    ensureFavicon();

    // Inject minimal styles for modals
    injectCSS(`
      .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: none; align-items: center; justify-content: center; z-index: 10000; }
      .modal { background: #fff; color: #111; max-width: 520px; width: 92%; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.25); overflow: hidden; }
      .modal header { padding: 16px 20px; font-weight: 700; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; }
      .modal header button { background: transparent; border: none; font-size: 20px; cursor: pointer; }
      .modal .content { padding: 20px; }
      .modal .row { display: grid; grid-template-columns: 1fr; gap: 12px; }
      .modal label { font-size: 14px; color: #333; }
      .modal input, .modal select { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
      .modal .actions { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #eee; }
      .btn { padding: 10px 14px; border-radius: 9999px; border: 1px solid #0f172a; background: #0f172a; color: #fff; cursor: pointer; font-weight: 600; }
      .btn.secondary { background: #fff; color: #0f172a; }
      .error { color: #b91c1c; font-size: 13px; margin-top: 6px; display: none; }
      @media (min-width: 640px) { .modal .row { grid-template-columns: 1fr 1fr; } }

      /* Legal links */
      #adpc-legal-links a:hover { text-decoration: none; }
    `);

    // UI sanitization that is resilient to SPA re-renders
    function sanitizeUI(root=document){
      // Remove email address texts broadly (contact card + footer)
      $all('span, p, a, li', root).forEach(el => { if (/@/.test(el.textContent||'')) el.remove(); });
      // Contact card: remove p under "Email Us"
      $all('h4', root).forEach(h=>{
        const label = (h.textContent||'').trim();
        if (label === 'Email Us') {
          const card = h.closest('div');
          if (card) { const emailP = card.querySelector('p'); if (emailP && /@/.test(emailP.textContent||'')) emailP.remove(); }
        }
        if (label === 'Follow Us') {
          const col = h.closest('div');
          if (col) col.remove();
        }
      });
      // Remove Partner/Volunteer buttons
      $all('button', root).forEach(btn => {
        const t = (btn.textContent||'').trim().toLowerCase();
        if (t === 'partner with us' || t === 'volunteer') btn.remove();
      });
    }
    sanitizeUI(document);

    // Build modals once
    const contact = buildContactModal();
    const member = buildMembershipModal();

    // Hook Contact / Contact Us triggers (idempotent)
    function wireContact(root=document){
      $all('button, a', root).forEach(el => {
        if (el.__adpcContactWired) return;
        const txt = (el.textContent||'').trim().toLowerCase();
        if (txt === 'contact' || txt === 'contact us') {
          el.__adpcContactWired = true;
          el.addEventListener('click', (e)=>{ e.preventDefault(); contact.reset(); show(contact.overlay); });
        }
      });
    }
    wireContact(document);
    // Hook Apply for Membership triggers
    function wireMembership(root=document){
      $all('button, a', root).forEach(el => {
        if (el.__adpcMemberWired) return;
        const txt = (el.textContent||'').trim().toLowerCase();
        if (txt === 'apply for membership') {
          el.__adpcMemberWired = true;
          el.addEventListener('click', (e)=>{ e.preventDefault(); member.reset(); show(member.overlay); });
        }
      });
    }
    wireMembership(document);

    // Smooth scroll helpers
    function smoothScrollToEl(target){
      if (!target) return;
      try { target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      catch { target.scrollIntoView(); }
    }
    function findApplyButton(){
      let btn = $all('button, a').find(b => (b.textContent||'').trim().toLowerCase() === 'apply for membership');
      if (btn) return btn;
      const sec = document.getElementById('membership');
      return sec || null;
    }

    // Map these triggers to scroll to the Apply for Membership button
    function wireJoinScroll(root=document){
      ['join now','join the consortium today','become a member'].forEach(label => {
        $all('button, a', root).forEach(el => {
          if (el.__adpcJoinWired) return;
          const txt = (el.textContent||'').trim().toLowerCase();
          if (txt === label) {
            el.__adpcJoinWired = true;
            el.addEventListener('click', (e)=>{
              e.preventDefault();
              smoothScrollToEl(findApplyButton());
            });
          }
        });
      });
    }
    wireJoinScroll(document);

    // Learn More: scroll down to the mission section
    function wireLearnMore(root=document){
      $all('button, a', root).forEach(el => {
        if (el.__adpcLearnWired) return;
        const txt = (el.textContent||'').trim().toLowerCase();
        if (txt === 'learn more') {
          el.__adpcLearnWired = true;
          el.addEventListener('click', (e)=>{
            e.preventDefault();
            const mission = document.getElementById('mission');
            if (mission) smoothScrollToEl(mission);
          });
        }
      });
    }
    wireLearnMore(document);
    // Ensure footer links point to policy pages
    ensureLegalLinks();
    fixFooterPolicyLinks();

    // Close on ESC & click outside
    document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') { hide(contact.overlay); hide(member.overlay); } });
    ;[contact.overlay, member.overlay].forEach(mod => mod.addEventListener('click', (e)=>{ if (e.target === mod) { hide(mod); } }));

    // Observe SPA updates and re-apply wiring and sanitization
    const uiMO = new MutationObserver(muts => {
      let touched = false;
      muts.forEach(m => {
        if (m.type === 'childList' && (m.addedNodes && m.addedNodes.length)) touched = true;
      });
      if (touched) {
        sanitizeUI(document);
        wireContact(document);
        wireMembership(document);
        wireJoinScroll(document);
        wireLearnMore(document);
        ensureLegalLinks();
        fixFooterPolicyLinks();
      }
    });
    uiMO.observe(document.getElementById('root') || document.body, { childList: true, subtree: true });
    // Ensure footer links once content exists
    ensureLegalLinks();
    fixFooterPolicyLinks();
  });
})();
