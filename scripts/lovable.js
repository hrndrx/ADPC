// ADPC Professional Enhancements
// Features:
// - Contact modal with form validation and formspree integration
// - Membership application modal with formspree integration
// - Responsive button navigation with scroll functionality
// - Footer policy links properly configured
// - Clean contact section with email display
// - Asset URL rewriting for GitHub Pages compatibility
(function(){
  const ready = (fn) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  };
  
  // DOM helpers
  function $(sel, root=document){ return root.querySelector(sel); }
  function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }
  function make(tag, attrs={}, children=[]) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if (k === 'class') el.className = v; 
      else if (k === 'text') el.textContent = v; 
      else el.setAttribute(k, v);
    });
    children.forEach(c=> el.appendChild(c));
    return el;
  }

  // URL rewriting for GitHub Pages
  function projectBase(){
    const parts = (location.pathname || '/').split('/').filter(Boolean);
    return parts.length > 0 ? '/' + parts[0] : '';
  }
  
  function fixUrl(url){
    if (!url) return url;
    const base = projectBase();
    const origin = location.origin;
    try {
      if (url.startsWith(origin + '/assets/')) return origin + base + url.slice(origin.length);
      if (url.startsWith(origin + '/images/')) return origin + base + url.slice(origin.length);
    } catch {}
    if (url.startsWith('/assets/')) return base + url;
    if (url.startsWith('/images/')) return base + url;
    return url;
  }
  
  function rewriteSrcAttributes(root=document){
    const selectors = [['img','src'],['source','src'],['link[rel="preload" i][as="image" i], link[rel="image" i], link[rel="icon" i]','href'],['script','src']];
    selectors.forEach(([sel, attr])=>{
      $all(sel, root).forEach(el=>{
        const v = el.getAttribute(attr);
        const nv = fixUrl(v);
        if (nv && nv !== v) el.setAttribute(attr, nv);
      });
    });
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
            const nv = attr === 'srcset' ? (v||'').split(',').map(s=>s.trim()).filter(Boolean).map(item=>{ const [u,d] = item.split(/\s+/,2); return fixUrl(u) + (d ? ' ' + d : ''); }).join(', ') : fixUrl(v);
            if (nv && nv !== v) el.setAttribute(attr, nv);
          }
        } else if (m.type === 'childList') {
          m.addedNodes.forEach(node=>{ if (node.nodeType === 1) rewriteSrcAttributes(node); });
        }
      });
    });
    mo.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['src','href','srcset'] });
  }
  
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

  // Math captcha
  function createCaptcha(labelEl, inputEl){
    const a = 1 + Math.floor(Math.random()*9);
    const b = 1 + Math.floor(Math.random()*9);
    const expected = a + b;
    if (labelEl) labelEl.textContent = `Captcha: What is ${a} + ${b}?`;
    if (inputEl) inputEl.value = '';
    return expected;
  }

  // Contact Modal
  function buildContactModal(){
    const overlay = make('div', { class: 'modal-overlay', id: 'contact-modal', 'aria-hidden': 'true' });
    const modal = make('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'contact-modal-title' });
    const header = make('header', {}, [ make('span', { id: 'contact-modal-title', text: 'Contact Us' }), make('button', { type: 'button', 'data-close-contact': '', 'aria-label': 'Close', text: '×' }) ]);
    const form = make('form', { id: 'contact-form', action: 'https://formspree.io/f/mqayrjqb', method: 'POST', 'accept-charset': 'UTF-8' });
    const content = make('div', { class: 'content' });
    const row = make('div', { class: 'row' });
    
    const name = make('div', {}, [ make('label', { for: 'contact-name', text: 'Full Name' }), make('input', { id: 'contact-name', name: 'name', type: 'text', placeholder: 'Your name', required: '' }) ]);
    const email = make('div', {}, [ make('label', { for: 'contact-email', text: 'Email' }), make('input', { id: 'contact-email', name: 'email', type: 'email', placeholder: 'your@email.com', required: '' }) ]);
    const city = make('div', {}, [ make('label', { for: 'contact-city', text: 'City' }), make('input', { id: 'contact-city', name: 'city', type: 'text', placeholder: 'Your city', required: '' }) ]);
    const message = make('div', { style: 'grid-column: 1 / -1;' }, [ make('label', { for: 'contact-message', text: 'Message' }), make('textarea', { id: 'contact-message', name: 'message', placeholder: 'Your message', required: '', style: 'min-height: 100px; resize: vertical;' }) ]);
    const cap = make('div', { style: 'grid-column: 1 / -1;' }, [ make('label', { id: 'contact-captcha-label', for: 'contact-captcha', text: 'Captcha' }), make('input', { id: 'contact-captcha', name: 'captcha', type: 'text', inputmode: 'numeric', placeholder: 'Answer', required: '' }), make('div', { id: 'contact-captcha-error', class: 'error', text: 'Incorrect answer. Please try again.' }) ]);
    
    row.append(name, email, city, message, cap);
    content.appendChild(row);
    const hidden = make('input', { type: 'hidden', name: 'form_name', value: 'contact' });
    const actions = make('div', { class: 'actions' }, [ make('button', { type: 'button', class: 'btn secondary', 'data-close-contact': '', text: 'Cancel' }), make('button', { type: 'submit', class: 'btn', id: 'contact-submit', text: 'Send Message' }) ]);
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
      const err = $('#contact-captcha-error'); 
      err.style.display = 'none';
      
      if (!nameVal || !emailVal || !cityVal) { alert('Please fill out all required fields.'); return; }
      if (Number(capVal) !== Number(expected)) { err.style.display = 'block'; expected = createCaptcha($('#contact-captcha-label'), $('#contact-captcha')); return; }
      
      try {
        const res = await fetch(form.getAttribute('action'), { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) });
        if (res.ok) {
          alert('Thank you! Your message has been sent.');
          hide(overlay);
          form.reset();
          expected = createCaptcha($('#contact-captcha-label'), $('#contact-captcha'));
        } else {
          alert('There was a problem submitting the form. Please try again.');
        }
      } catch(e) {
        console.error('Contact form error:', e);
        alert('Network error. Please try again.');
      }
    });
    
    return { overlay, reset: () => { expected = createCaptcha($('#contact-captcha-label'), $('#contact-captcha')); form.reset(); } };
  }

  // Membership Modal
  function buildMembershipModal(){
    const overlay = make('div', { class: 'modal-overlay', id: 'membership-modal', 'aria-hidden': 'true' });
    const modal = make('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'membership-modal-title' });
    const header = make('header', {}, [ make('span', { id: 'membership-modal-title', text: 'Apply for Membership' }), make('button', { type: 'button', 'data-close-membership': '', 'aria-label': 'Close', text: '×' }) ]);
    const form = make('form', { id: 'membership-form', action: 'https://formspree.io/f/mqayrjqb', method: 'POST', 'accept-charset': 'UTF-8' });
    const content = make('div', { class: 'content' });
    const row = make('div', { class: 'row' });
    
    const name = make('div', {}, [ make('label', { for: 'member-name', text: 'Full Name' }), make('input', { id: 'member-name', name: 'name', type: 'text', placeholder: 'Your name', required: '' }) ]);
    const email = make('div', {}, [ make('label', { for: 'member-email', text: 'Email' }), make('input', { id: 'member-email', name: 'email', type: 'email', placeholder: 'your@email.com', required: '' }) ]);
    const org = make('div', {}, [ make('label', { for: 'member-organization', text: 'Organization (Optional)' }), make('input', { id: 'member-organization', name: 'organization', type: 'text', placeholder: 'Organization name' }) ]);
    const role = make('div', {}, [ make('label', { for: 'member-role', text: 'Role/Position' }), make('input', { id: 'member-role', name: 'role', type: 'text', placeholder: 'Your role', required: '' }) ]);
    const country = make('div', {}, [ make('label', { for: 'member-country', text: 'Country' }), make('input', { id: 'member-country', name: 'country', type: 'text', placeholder: 'Country', required: '' }) ]);
    const city = make('div', {}, [ make('label', { for: 'member-city', text: 'City' }), make('input', { id: 'member-city', name: 'city', type: 'text', placeholder: 'City', required: '' }) ]);
    const type = make('div', {}, [ make('label', { for: 'member-type', text: 'Membership Type' }), (function(){ const sel = make('select', { id: 'member-type', name: 'membership_type', required: '' }); sel.append(make('option', { value: '', text: 'Select type' }), make('option', { value: 'Individual', text: 'Individual' }), make('option', { value: 'Organization', text: 'Organization' })); return sel; })() ]);
    const cap = make('div', { style: 'grid-column: 1 / -1;' }, [ make('label', { id: 'member-captcha-label', for: 'member-captcha', text: 'Captcha' }), make('input', { id: 'member-captcha', name: 'captcha', type: 'text', inputmode: 'numeric', placeholder: 'Answer', required: '' }), make('div', { id: 'member-captcha-error', class: 'error', text: 'Incorrect answer. Please try again.' }) ]);
    const termsWrap = make('div', { style: 'grid-column:1/-1;display:flex;gap:8px;align-items:flex-start;margin-top:6px;' }, [ make('input', { id: 'member-terms', name: 'member_terms', type: 'checkbox', required: '' }), make('label', { for: 'member-terms', style: 'font-size:14px;margin-top:2px;', text: 'I agree to the terms and consent to being contacted about my application.' }) ]);
    
    row.append(name, email, org, role, country, city, type, cap, termsWrap);
    content.appendChild(row);
    const hidden = make('input', { type: 'hidden', name: 'form_name', value: 'membership' });
    const actions = make('div', { class: 'actions' }, [ make('button', { type: 'button', class: 'btn secondary', 'data-close-membership': '', text: 'Cancel' }), make('button', { type: 'submit', class: 'btn', id: 'membership-submit', text: 'Submit Application' }) ]);
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
      const roleVal = $('#member-role').value.trim();
      const countryVal = $('#member-country').value.trim();
      const cityVal = $('#member-city').value.trim();
      const typeVal = $('#member-type').value;
      const terms = $('#member-terms').checked;
      const capVal = $('#member-captcha').value.trim();
      const err = $('#member-captcha-error'); 
      err.style.display = 'none';
      
      if (!nameVal || !emailVal || !roleVal || !countryVal || !cityVal || !typeVal) { alert('Please fill out all required fields.'); return; }
      if (!terms) { alert('Please agree to the terms.'); return; }
      if (Number(capVal) !== Number(expected)) { err.style.display = 'block'; expected = createCaptcha($('#member-captcha-label'), $('#member-captcha')); return; }
      
      try {
        const res = await fetch(form.getAttribute('action'), { method: 'POST', headers: { 'Accept': 'application/json' }, body: new FormData(form) });
        if (res.ok) {
          alert('Thank you! Your membership application has been submitted.');
          hide(overlay);
          form.reset();
          expected = createCaptcha($('#member-captcha-label'), $('#member-captcha'));
        } else {
          alert('There was a problem submitting the application. Please try again.');
        }
      } catch(e) {
        console.error('Membership form error:', e);
        alert('Network error. Please try again.');
      }
    });
    
    return { overlay, reset: () => { expected = createCaptcha($('#member-captcha-label'), $('#member-captcha')); form.reset(); } };
  }

  function show(el){ el.style.display = 'flex'; el.setAttribute('aria-hidden','false'); }
  function hide(el){ el.style.display = 'none'; el.setAttribute('aria-hidden','true'); }

  // Add email to contact section
  function addContactEmail(root=document){
    // Find "Get in Touch" heading
    const getInTouchHeading = $all('h2, h3, h4', root).find(h => (h.textContent||'').trim().toLowerCase().includes('get in touch'));
    if (!getInTouchHeading) return;
    
    // Check if email already exists
    if (getInTouchHeading.parentElement?.textContent?.includes('aldnse@gmail.com')) return;
    
    // Find the parent container
    let container = getInTouchHeading.parentElement;
    while (container && !container.innerHTML.includes('Get in Touch')) {
      container = container.parentElement;
    }
    if (!container) container = getInTouchHeading.parentElement;
    
    // Check if we already added the email
    if (container.querySelector('[data-adpc-email]')) return;
    
    // Create and inject email element
    const emailDiv = make('div', { 'data-adpc-email': 'true', style: 'margin-top: 16px; font-size: 16px; color: #5D4037; font-weight: 600;' });
    const emailLink = make('a', { href: 'mailto:aldnse@gmail.com', style: 'color: #5D4037; text-decoration: none; border-bottom: 2px solid #5D4037; padding-bottom: 2px;', text: 'aldnse@gmail.com' });
    emailDiv.appendChild(document.createTextNode('Email Us: '));
    emailDiv.appendChild(emailLink);
    
    // Insert after heading or in container
    if (getInTouchHeading.nextElementSibling) {
      getInTouchHeading.nextElementSibling.before(emailDiv);
    } else {
      container.appendChild(emailDiv);
    }
  }

  ready(()=>{
    // Rewrite asset URLs
    rewriteSrcAttributes(document);
    observeRewrites();
    ensureFavicon();

    // Inject modal styles
    const css = document.createElement('style');
    css.textContent = `
      .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: none; align-items: center; justify-content: center; z-index: 10000; overflow-y: auto; }
      .modal { background: #fff; color: #111; max-width: 520px; width: 92%; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,.25); overflow: hidden; margin: auto; }
      .modal header { padding: 16px 20px; font-weight: 700; border-bottom: 1px solid #eee; display: flex; align-items: center; justify-content: space-between; }
      .modal header button { background: transparent; border: none; font-size: 24px; cursor: pointer; color: #666; padding: 0; }
      .modal header button:hover { color: #000; }
      .modal .content { padding: 20px; max-height: 60vh; overflow-y: auto; }
      .modal .row { display: grid; grid-template-columns: 1fr; gap: 12px; }
      .modal label { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 4px; display: block; }
      .modal input, .modal select, .modal textarea { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; font-family: inherit; }
      .modal input:focus, .modal select:focus, .modal textarea:focus { outline: none; border-color: #5D4037; box-shadow: 0 0 0 3px rgba(93, 64, 55, 0.1); }
      .modal .actions { display: flex; justify-content: flex-end; gap: 10px; padding: 16px 20px; border-top: 1px solid #eee; }
      .btn { padding: 10px 16px; border-radius: 8px; border: 1px solid #5D4037; background: #5D4037; color: #fff; cursor: pointer; font-weight: 600; font-size: 14px; transition: all 0.2s; }
      .btn:hover { background: #4a3330; border-color: #4a3330; }
      .btn:active { transform: scale(0.98); }
      .btn.secondary { background: #f5f5f5; color: #333; border-color: #ddd; }
      .btn.secondary:hover { background: #e5e5e5; }
      .error { color: #b91c1c; font-size: 13px; margin-top: 6px; display: none; font-weight: 600; }
      @media (min-width: 640px) { .modal .row { grid-template-columns: 1fr 1fr; } }

      /* ADPC Logo - Larger and centered */
      nav span.font-serif.text-4xl.font-bold { font-size: 4rem !important; text-align: center !important; }

      /* Hero section text - Unified brown color */
      h1.font-serif.font-bold { color: #5D4037 !important; }
      h1 span { color: #5D4037 !important; }

      /* Remove blue dot and clean contact section */
      .text-adpc-secondary { display: none !important; }
      .bg-adpc-secondary { display: none !important; }
    `;
    document.head.appendChild(css);
    
    // Add email to contact section
    addContactEmail(document);

    // Clean UI - minimal safe cleanup
    function sanitizeUI(){
      // Core cleanup only
    }
    
    sanitizeUI();

    // Build modals
    const contact = buildContactModal();
    const member = buildMembershipModal();

    // Wire all buttons and links
    function wireAllButtons(){
      // Contact buttons
      $all('button, a').forEach(el => {
        const txt = (el.textContent||'').trim().toLowerCase();
        if (!el.__adpcWired) {
          if (txt === 'contact' || txt === 'contact us') {
            el.__adpcWired = true;
            el.addEventListener('click', (e)=>{ e.preventDefault(); contact.reset(); show(contact.overlay); });
          }
          else if (txt === 'apply for membership') {
            el.__adpcWired = true;
            el.addEventListener('click', (e)=>{ e.preventDefault(); member.reset(); show(member.overlay); });
          }
          else if (txt === 'join now' || txt === 'join the consortium today' || txt === 'become a member' || txt === 'join the consortium') {
            el.__adpcWired = true;
            el.addEventListener('click', (e)=>{ 
              e.preventDefault(); 
              const btn = $all('button, a').find(b => (b.textContent||'').trim().toLowerCase() === 'apply for membership');
              if (btn) try { btn.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { btn.scrollIntoView(); }
            });
          }
          else if (txt === 'learn more') {
            el.__adpcWired = true;
            el.addEventListener('click', (e)=>{ 
              e.preventDefault(); 
              const mission = document.getElementById('mission') || $all('h2, h3').find(h => (h.textContent||'').includes('Mission'));
              if (mission) try { mission.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { mission.scrollIntoView(); }
            });
          }
        }
      });
      
      // Footer policy links
      $all('footer a, a').forEach(a => {
        const t = (a.textContent||'').trim().toLowerCase();
        const base = projectBase();
        if (t === 'privacy policy' && !a.href.includes('/privacy')) a.setAttribute('href', base + '/privacy.html');
        else if (t === 'terms of service' && !a.href.includes('/terms')) a.setAttribute('href', base + '/terms.html');
        else if (t === 'cookie policy' && !a.href.includes('/cookie')) a.setAttribute('href', base + '/cookies.html');
      });
    }
    
    wireAllButtons();

    // Modal controls
    document.addEventListener('keydown', (e)=>{ 
      if (e.key === 'Escape') { hide(contact.overlay); hide(member.overlay); } 
    });
    [contact.overlay, member.overlay].forEach(mod => 
      mod.addEventListener('click', (e)=>{ if (e.target === mod) hide(mod); })
    );

    // Watch for DOM changes and re-wire
    const observer = new MutationObserver(() => {
      try {
        sanitizeUI();
        if (typeof addContactEmail === 'function') addContactEmail(document);
        wireAllButtons();
      } catch(e) { console.error('Observer error:', e); }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
