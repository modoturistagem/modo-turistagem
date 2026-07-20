(() => {
  const config = window.MODO_PORTAL_CONFIG || {};
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug') || 'andes-na-janela';
  const demo = params.get('demo') === '1' || sessionStorage.getItem('modoPortalDemo') === '1';
  const draft = params.get('draft') === '1';
  const ready = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
  const db = ready ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;

  const root = document.querySelector('#itineraryRoot');
  const nav = document.querySelector('#summaryNav');
  const side = document.querySelector('#itinerarySidebar');
  const backdrop = document.querySelector('#sidebarBackdrop');

  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const safeUrl = (value = '') => {
    try {
      const parsed = new URL(value, location.href);
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
    } catch {
      return '';
    }
  };

  const paragraphs = (value = '') => {
    const blocks = String(value).split(/\n\s*\n/g).map(part => part.trim()).filter(Boolean);
    return blocks.map(block => `<p>${esc(block).replaceAll('\n', '<br>')}</p>`).join('');
  };

  const button = (action) => {
    const href = safeUrl(action?.url);
    return href
      ? `<a class="content-button" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(action.label || 'Abrir')}</a>`
      : '';
  };

  function cover(route) {
    const overview = route.overview || {};
    return `<section class="itinerary-cover" id="inicio">
      <div class="cover-image" style="background-image:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.45)),url('${esc(route.cover_image || '../images/destinos/santiago.jpg')}')"></div>
      <div class="cover-content">
        <span class="eyebrow eyebrow-orange">Roteiro Pronto</span>
        <div class="cover-emojis">${esc(route.emojis || '🗻 🇨🇱 ❄️')}</div>
        <h1>${esc(route.title)}</h1>
        <h2>${esc(route.subtitle || '')}</h2>
        <p>${esc(route.intro || '')}</p>
        <div class="overview-card">
          <h3>🗺️ Visão geral da viagem</h3>
          <dl>
            <div><dt>Destino</dt><dd>${esc(route.destination || '')}</dd></div>
            <div><dt>Duração</dt><dd>${esc(route.duration || '')}</dd></div>
            <div><dt>Estilo</dt><dd>${esc(overview.style || '')}</dd></div>
            <div><dt>Perfil</dt><dd>${esc(overview.profile || '')}</dd></div>
          </dl>
          <strong>Tudo foi pensado pra ficar fácil de abrir no celular no meio da viagem.</strong>
        </div>
      </div>
    </section>`;
  }

  function cards(section) {
    return `<div class="content-grid">${(section.items || []).map(item => `
      <article class="content-card">
        <h3>${esc(item.icon || '')} ${esc(item.title)}</h3>
        ${item.text ? `<p>${esc(item.text)}</p>` : ''}
        ${item.note ? `<p class="card-note">${esc(item.note)}</p>` : ''}
        ${item.actions?.length ? `<div class="content-actions">${item.actions.map(button).join('')}</div>` : ''}
      </article>`).join('')}</div>`;
  }

  function budget(section) {
    return `<div class="budget-grid">${(section.items || []).map(item => `
      <article class="budget-card">
        <h3>${esc(item.icon || '')} ${esc(item.title)}</h3>
        <ul>${(item.ranges || []).map(range => `<li><span>${esc(range.label)}</span><strong>${esc(range.value)}</strong></li>`).join('')}</ul>
        ${item.note ? `<p>${esc(item.note)}</p>` : ''}
      </article>`).join('')}</div>${section.summary ? `<div class="highlight-box">${esc(section.summary)}</div>` : ''}`;
  }

  function reservations(section) {
    return `<div class="reservation-list">${(section.items || []).map((item, index) => `
      <article class="reservation-card">
        <span class="reservation-number">${String(index + 1).padStart(2, '0')}</span>
        <div>
          <span class="eyebrow">${esc(item.label || 'Antes de reservar')}</span>
          <h3>${esc(item.icon || '')} ${esc(item.title)}</h3>
          <p>${esc(item.text || '')}</p>
          ${item.actions?.length ? `<div class="content-actions">${item.actions.map(button).join('')}</div>` : ''}
        </div>
      </article>`).join('')}</div>`;
  }

  function days(section) {
    return `<div class="days-list">${(section.items || []).map(day => `
      <article class="day-card" id="${esc(day.id || '')}">
        <div class="day-head"><span class="day-number">${esc(day.label || '')}</span><div><h3>${esc(day.title)}</h3><p>${esc(day.summary || '')}</p></div></div>
        ${day.tags?.length ? `<div class="tag-row">${day.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div>` : ''}
        <div class="timeline">${(day.stops || []).map(stop => `
          <div class="timeline-item"><div class="timeline-time">${esc(stop.time || 'Ao longo do dia')}</div><div class="timeline-copy"><h4>${esc(stop.icon || '')} ${esc(stop.title)}</h4><p>${esc(stop.text || '')}</p>${stop.actions?.length ? `<div class="content-actions">${stop.actions.map(button).join('')}</div>` : ''}</div></div>`).join('')}</div>
        ${day.tip ? `<div class="modo-tip"><strong>💙 Dica Modo</strong><p>${esc(day.tip)}</p></div>` : ''}
      </article>`).join('')}</div>`;
  }

  function options(section) {
    return `<div class="options-grid">${(section.items || []).map(item => `
      <article class="option-card">
        <div class="option-top"><span class="option-icon">${esc(item.icon || '📍')}</span>${item.price ? `<span class="price-pill">${esc(item.price)}</span>` : ''}</div>
        <h3>${esc(item.title)}</h3>
        ${item.subtitle ? `<strong>${esc(item.subtitle)}</strong>` : ''}
        <p>${esc(item.text || '')}</p>
        ${item.tags?.length ? `<div class="tag-row">${item.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div>` : ''}
        ${item.actions?.length ? `<div class="content-actions">${item.actions.map(button).join('')}</div>` : ''}
      </article>`).join('')}</div>`;
  }

  function links(section) {
    return `<div class="links-grid">${(section.items || []).map(item => {
      const href = safeUrl(item.url);
      const tag = href ? 'a' : 'div';
      const attributes = href ? `href="${esc(href)}" target="_blank" rel="noopener noreferrer"` : '';
      return `<${tag} class="link-card ${href ? '' : 'is-disabled'}" ${attributes}><span>${esc(item.icon || '🔗')}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.text || '')}</small></div><b>→</b></${tag}>`;
    }).join('')}</div>`;
  }

  function checklist(section, routeSlug) {
    const storageKey = `modo-checklist-${routeSlug}`;
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch {}
    setTimeout(() => document.querySelectorAll('[data-check-id]').forEach(input => input.addEventListener('change', () => {
      saved[input.dataset.checkId] = input.checked;
      localStorage.setItem(storageKey, JSON.stringify(saved));
    })), 0);
    return `<div class="checklist-grid">${(section.groups || []).map((group, groupIndex) => `
      <article class="checklist-group"><h3>${esc(group.icon || '✅')} ${esc(group.title)}</h3><div>${(group.items || []).map((item, itemIndex) => {
        const id = `check-${groupIndex}-${itemIndex}`;
        return `<label class="check-item" for="${id}"><input id="${id}" type="checkbox" data-check-id="${id}" ${saved[id] ? 'checked' : ''}/><span>${esc(item)}</span></label>`;
      }).join('')}</div></article>`).join('')}</div>`;
  }

  function closing(section) {
    return `<div class="closing-card"><div class="closing-icon">${esc(section.icon || '✈️')}</div><h3>${esc(section.title || '')}</h3><p>${esc(section.text || '')}</p>${section.actions?.length ? `<div class="content-actions centered">${section.actions.map(button).join('')}</div>` : ''}</div>`;
  }

  function pages(section) {
    return `<div class="source-page-stack">${(section.items || []).map(item => `
      <article class="source-page-card">
        <div class="source-page-head"><span>Página ${String(item.page || '').padStart(2, '0')}</span><h3>${esc(item.title || '')}</h3></div>
        <div class="source-page-body">${paragraphs(item.body || '')}</div>
      </article>`).join('')}</div>`;
  }

  function sectionMarkup(section, routeSlug) {
    const renderers = {
      cards,
      budget,
      reservations,
      days,
      options,
      links,
      checklist: current => checklist(current, routeSlug),
      closing,
      pages
    };
    const renderer = renderers[section.type];
    if (!renderer) return '';
    return `<section class="itinerary-section" id="${esc(section.id)}"><div class="section-intro">${section.tag ? `<span class="eyebrow ${section.tagColor === 'orange' ? 'eyebrow-orange' : ''}">${esc(section.tag)}</span>` : ''}<h2>${esc(section.title || '')}</h2>${section.subtitle ? `<p>${esc(section.subtitle)}</p>` : ''}</div>${renderer(section)}</section>`;
  }

  function render(route) {
    document.title = `${route.title} | Modo Turistagem`;
    root.innerHTML = `${cover(route)}${(route.content?.sections || []).map(current => sectionMarkup(current, route.slug)).join('')}<footer class="itinerary-footer"><img src="../images/LOGOTIPO%20branco.png" alt="Modo Turistagem" /><p>Uso pessoal • Reprodução não autorizada • Versão ${esc(route.version || '')}</p></footer>`;
    nav.innerHTML = [{ id: 'inicio', title: 'Capa' }, ...(route.content?.sections || []).map(current => ({ id: current.id, title: current.navTitle || current.title }))]
      .map(item => `<a href="#${esc(item.id)}">${esc(item.title)}</a>`).join('');
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeSidebar));
  }

  async function load() {
    if (draft) {
      const raw = sessionStorage.getItem('modoPortalDraft');
      if (!raw) throw Error('Rascunho não encontrado.');
      return render(JSON.parse(raw));
    }
    if (demo) {
      if (!window.MODO_PREVIEW_ITINERARY) throw Error('Demonstração indisponível.');
      return render(window.MODO_PREVIEW_ITINERARY);
    }
    if (!db) return location.replace('index.html');

    const { data: sessionData } = await db.auth.getSession();
    if (!sessionData.session) return location.replace('index.html');

    const userId = sessionData.session.user.id;
    const { data: profile } = await db
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle();

    let query = db.from('itineraries').select('*').eq('slug', slug);
    if (!profile?.is_admin) query = query.eq('status', 'published');

    const { data, error } = await query.single();
    if (error || !data) {
      throw Error(profile?.is_admin
        ? 'Esse roteiro ainda não foi salvo no Supabase.'
        : 'Esse roteiro não está liberado para esta conta.');
    }

    render(data);
  }

  function openSidebar() { side.classList.add('is-open'); backdrop.classList.add('is-open'); }
  function closeSidebar() { side.classList.remove('is-open'); backdrop.classList.remove('is-open'); }

  document.querySelector('#summaryButton').onclick = openSidebar;
  document.querySelector('#floatingSummaryButton').onclick = openSidebar;
  document.querySelector('#closeSummaryButton').onclick = closeSidebar;
  backdrop.onclick = closeSidebar;
  document.querySelector('#printButton').onclick = () => print();

  load().catch(error => {
    root.innerHTML = `<div class="state-card itinerary-error"><strong>Não consegui abrir o roteiro.</strong><p>${esc(error.message)}</p><a class="btn btn-primary" href="dashboard.html">Voltar</a></div>`;
  });
})();
