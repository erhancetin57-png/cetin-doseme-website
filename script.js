/* =========================================================
   Çetin Döşeme — script.js
   Vanilla JS, framework yok.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initLightbox();
  initWorkFilter();
  initFaqAccordion();
  initCounters();
  initContactForm();
});

/* ---------------------------------------------------------
   1) Mobil Hamburger Menü
   --------------------------------------------------------- */
function initMobileNav(){
  const hamburger = document.querySelector('.hamburger');
  const panel = document.querySelector('.mobile-panel');
  const overlay = document.querySelector('.nav-overlay');
  if (!hamburger || !panel || !overlay) return;

  const openMenu = () => {
    hamburger.classList.add('is-open');
    panel.classList.add('is-open');
    overlay.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const closeMenu = () => {
    hamburger.classList.remove('is-open');
    panel.classList.remove('is-open');
    overlay.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  hamburger.addEventListener('click', () => {
    panel.classList.contains('is-open') ? closeMenu() : openMenu();
  });
  overlay.addEventListener('click', closeMenu);
  panel.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
}

/* ---------------------------------------------------------
   2) Lightbox (Modal) — [data-lightbox] tetikleyicileri
   --------------------------------------------------------- */
function initLightbox(){
  const triggers = document.querySelectorAll('[data-lightbox]');
  if (!triggers.length) return;

  const lightbox = document.createElement('div');
  lightbox.className = 'lightbox';
  lightbox.setAttribute('role', 'dialog');
  lightbox.setAttribute('aria-modal', 'true');
  lightbox.setAttribute('aria-hidden', 'true');
  lightbox.innerHTML = `
    <button class="lightbox-close" aria-label="Kapat">&times;</button>
    <img src="" alt="">
    <div class="lightbox-caption"></div>
  `;
  document.body.appendChild(lightbox);

  const imgEl = lightbox.querySelector('img');
  const captionEl = lightbox.querySelector('.lightbox-caption');
  const closeBtn = lightbox.querySelector('.lightbox-close');

  const openLightbox = (src, alt, caption) => {
    imgEl.src = src;
    imgEl.alt = alt || '';
    captionEl.textContent = caption || alt || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  const closeLightbox = () => {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    setTimeout(() => { if (!lightbox.classList.contains('is-open')) imgEl.src = ''; }, 300);
  };

  triggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const img = trigger.tagName === 'IMG' ? trigger : trigger.querySelector('img');
      if (!img) return;
      const fullSrc = trigger.getAttribute('data-full') || img.src;
      const caption = trigger.getAttribute('data-caption') || img.alt;
      openLightbox(fullSrc, img.alt, caption);
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
  });
}

/* ---------------------------------------------------------
   3) İşlerimiz sayfası: kategori filtreleme
   --------------------------------------------------------- */
function initWorkFilter(){
  const filterButtons = document.querySelectorAll('.filter-tags button');
  const cards = document.querySelectorAll('[data-work-card]');
  const noResults = document.querySelector('.no-results');
  if (!cards.length || !filterButtons.length) return;

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const category = btn.getAttribute('data-filter') || 'all';
      let visibleCount = 0;

      cards.forEach(card => {
        const cardCategory = card.getAttribute('data-category') || '';
        const visible = category === 'all' || cardCategory === category;
        card.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
      });

      if (noResults) noResults.classList.toggle('show', visibleCount === 0);
    });
  });
}

/* ---------------------------------------------------------
   4) SSS Akordeon
   --------------------------------------------------------- */
function initFaqAccordion(){
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (!question) return;
    question.addEventListener('click', () => {
      const wasOpen = item.classList.contains('is-open');
      items.forEach(i => i.classList.remove('is-open'));
      if (!wasOpen) item.classList.add('is-open');
    });
  });
}

/* ---------------------------------------------------------
   5) Sayaç animasyonu (hero istatistikleri)
   --------------------------------------------------------- */
function initCounters(){
  const counters = document.querySelectorAll('[data-count-to]');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
    const suffix = el.getAttribute('data-count-suffix') || '';
    const duration = 1200;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!('IntersectionObserver' in window)){
    counters.forEach(animate);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

/* ---------------------------------------------------------
   6) İletişim Formu — doğrulama + Formspree'ye AJAX gönderim
   Form, sayfadan ayrılmadan https://formspree.io/f/mjyvdqvo
   adresine POST edilir ve gelen mesaj kayıtlı e-postaya düşer.
   --------------------------------------------------------- */
function initContactForm(){
  const form = document.querySelector('#contact-form');
  if (!form) return;

  const status = form.querySelector('.form-status');
  const submitBtn = form.querySelector('button[type="submit"]');
  const endpoint = form.getAttribute('action');

  const setError = (group, message) => {
    group.classList.add('has-error');
    const errEl = group.querySelector('.form-error');
    if (errEl) errEl.textContent = message;
  };
  const clearError = (group) => group.classList.remove('has-error');
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const showStatus = (message, isError) => {
    if (!status) return;
    status.textContent = message;
    status.classList.add('show');
    status.style.background = isError ? 'rgba(156,74,52,0.12)' : 'rgba(63,92,74,0.12)';
    status.style.borderColor = isError ? 'var(--brick)' : 'var(--forest)';
    status.style.color = isError ? 'var(--brick)' : 'var(--forest-deep)';
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let hasError = false;

    const fields = [
      { name: 'name', validate: (v) => v.trim().length >= 2, message: 'Lütfen adınızı girin (en az 2 karakter).' },
      { name: 'phone', validate: (v) => v.trim().length >= 10, message: 'Lütfen geçerli bir telefon numarası girin.' },
      { name: 'email', validate: (v) => v.trim() === '' || isValidEmail(v), message: 'Lütfen geçerli bir e-posta adresi girin.' },
      { name: 'message', validate: (v) => v.trim().length >= 10, message: 'Mesajınız en az 10 karakter olmalı.' },
    ];

    fields.forEach(field => {
      const input = form.querySelector(`[name="${field.name}"]`);
      if (!input) return;
      const group = input.closest('.form-group');
      if (!field.validate(input.value)){
        setError(group, field.message);
        hasError = true;
      } else {
        clearError(group);
      }
    });

    if (hasError){
      if (status) status.classList.remove('show');
      return;
    }

    if (!endpoint){
      showStatus('Form şu anda gönderilemiyor, lütfen bizi doğrudan arayın.', true);
      return;
    }

    if (submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Gönderiliyor...'; }

    const formData = new FormData(form);

    fetch(endpoint, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    })
      .then((response) => {
        if (response.ok){
          showStatus('Mesajınız için teşekkürler! En kısa sürede size geri döneceğiz.', false);
          form.reset();
        } else {
          showStatus('Mesajınız gönderilemedi. Lütfen bizi doğrudan arayın: 0535 835 15 67.', true);
        }
      })
      .catch(() => {
        showStatus('Bağlantı hatası oluştu. Lütfen bizi doğrudan arayın: 0535 835 15 67.', true);
      })
      .finally(() => {
        if (submitBtn){ submitBtn.disabled = false; submitBtn.textContent = 'Mesajı Gönder'; }
      });
  });

  form.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', () => {
      const group = input.closest('.form-group');
      if (group) clearError(group);
    });
  });
}
