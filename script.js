(function () {
  'use strict';

  // 1. CONTENT PARSER
  function parseContent(raw) {
    const sections = {};
    let currentSection = null;
    const lines = raw.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const sectionMatch = trimmed.match(/^\[(\w+)\]$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1];
        sections[currentSection] = {};
        continue;
      }
      if (currentSection) {
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex).trim();
          const value = trimmed.substring(eqIndex + 1).trim();
          sections[currentSection][key] = value;
        }
      }
    }
    return sections;
  }

  // DOM Helpers
  function setText(id, value) {
    if (!value) return;
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // 2. INJECT CONTENT
  function injectContent(data) {
    if (data.HERO) {
      setText('heroName', data.HERO.name);
      setText('heroTitle', data.HERO.title);
      setText('heroDescription', data.HERO.description);
      setText('footerName', data.HERO.name);
    }

    if (data.ABOUT) {
      setText('aboutText', data.ABOUT.text);
      if (data.ABOUT.highlights) {
        const container = document.getElementById('aboutHighlights');
        if (container) {
          container.innerHTML = '';
          data.ABOUT.highlights.split(',').forEach(tag => {
            const span = document.createElement('span');
            span.textContent = tag.trim();
            container.appendChild(span);
          });
        }
      }
    }

    const projectsGrid = document.getElementById('projectsGrid');
    if (projectsGrid) {
      projectsGrid.innerHTML = '';
      let i = 1;
      const gradients = [
        'linear-gradient(135deg, #1aa37a, #0d5ea6)',
        'linear-gradient(135deg, #a31a53, #5a0da6)',
        'linear-gradient(135deg, #e68e22, #b81f1f)',
        'linear-gradient(135deg, #22cae6, #1f61b8)'
      ];
      while (data[`PROJECT_${i}`]) {
        const p = data[`PROJECT_${i}`];
        const card = document.createElement('div');
        card.className = 'project-card fade-in';
        
        const grad = gradients[(i - 1) % gradients.length];
        
        let linksHTML = '';
        if (p.link) linksHTML += `<a href="${escapeHTML(p.link)}" target="_blank" class="project-link"><i data-lucide="external-link" style="width:14px;height:14px;"></i> Live</a>`;
        if (p.github) linksHTML += `<a href="${escapeHTML(p.github)}" target="_blank" class="project-link"><i data-lucide="github" style="width:14px;height:14px;"></i> Code</a>`;
        
        let tagsHTML = '';
        if (p.tags) {
          tagsHTML = '<div class="project-tags">' + p.tags.split(',').map(t => `<span class="project-tag">${escapeHTML(t.trim())}</span>`).join('') + '</div>';
        }

        card.innerHTML = `
          <div class="project-icon-placeholder" style="background: ${grad}">
            <i data-lucide="box" style="color:white; width:28px; height:28px;"></i>
          </div>
          <h3 class="project-card-title">${escapeHTML(p.title || '')}</h3>
          <p class="project-card-description">${escapeHTML(p.description || '')}</p>
          ${tagsHTML}
          <div class="project-links">${linksHTML}</div>
        `;
        projectsGrid.appendChild(card);
        i++;
      }
    }

    if (data.TECHSTACK) {
      const grid = document.getElementById('techstackGrid');
      if (grid) {
        grid.innerHTML = '';
        const cats = { languages: 'Languages', frameworks: 'Frameworks', tools: 'Tools', databases: 'Databases' };
        for (const [key, label] of Object.entries(cats)) {
          if (data.TECHSTACK[key]) {
            const itemsHTML = data.TECHSTACK[key].split(',').map(i => `<span class="techstack-item">${escapeHTML(i.trim())}</span>`).join('');
            const card = document.createElement('div');
            card.className = 'techstack-card fade-in';
            card.innerHTML = `<h4 class="techstack-card-title">${label}</h4><div class="techstack-items">${itemsHTML}</div>`;
            grid.appendChild(card);
          }
        }
      }
    }

    if (data.SOCIAL) {
      const grid = document.getElementById('socialGrid');
      if (grid) {
        grid.innerHTML = '';
        const icons = { github: 'github', linkedin: 'linkedin', twitter: 'twitter', email: 'mail' };
        for (const [key, icon] of Object.entries(icons)) {
          if (data.SOCIAL[key]) {
            const href = key === 'email' ? `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(data.SOCIAL[key])}` : data.SOCIAL[key];
            const a = document.createElement('a');
            a.className = 'social-card fade-in';
            a.href = href;
            a.target = '_blank';
            a.innerHTML = `<i data-lucide="${icon}"></i>`;
            a.setAttribute('aria-label', key);
            grid.appendChild(a);
          }
        }
      }
    }

    if (data.CONTACT) {
      setText('contactText', data.CONTACT.text);
    }

    if (window.lucide) lucide.createIcons();
    initAnimations();
  }

  async function loadContent() {
    try {
      const response = await fetch('content.txt');
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const raw = await response.text();
      injectContent(parseContent(raw));
    } catch (err) {
      console.warn('Failed to load content.txt. Animation triggers fallback.', err);
      initAnimations();
    }
  }

  // 3. UI LOGIC
  function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  }

  function initNav() {
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
          const act = document.querySelector(`.nav-link[data-section="${entry.target.id}"]`);
          if (act) act.classList.add('active');
        }
      });
    }, { threshold: 0.3 });
    document.querySelectorAll('section').forEach(s => observer.observe(s));
  }

  function initForm() {
    const form = document.getElementById('contactForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('.btn-submit');
        const orig = btn.innerHTML;
        btn.innerHTML = 'Sent!';
        setTimeout(() => { btn.innerHTML = orig; form.reset(); }, 2000);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();
    initNav();
    initForm();
    loadContent();
  });
})();
