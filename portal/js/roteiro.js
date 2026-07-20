(() => {
  const injectedStyle = `
    .content-button,.content-button:visited{background:#f47c20!important;color:#fff!important;border-color:#f47c20!important;box-shadow:none!important}
    .content-button:hover{filter:brightness(.96)}
    .content-button.has-platform{display:inline-flex!important;align-items:center;gap:.55rem}
    .button-brand-icon{width:1rem;height:1rem;display:inline-flex;flex:0 0 1rem}.button-brand-icon svg{width:100%;height:100%;display:block}

    .reservation-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.3rem!important}
    .reservation-card{display:grid;grid-template-columns:72px 1fr;gap:1rem;padding:1.45rem!important;border-radius:22px!important;align-items:start}
    .reservation-number{display:grid;place-items:center;width:58px;height:58px;border-radius:999px;font-size:1.25rem;font-weight:700;background:#f47c20;color:#fff;margin-top:.1rem}
    .reservation-card .eyebrow{display:inline-flex;margin:0 0 .65rem 0!important}
    .reservation-card h3{margin:.1rem 0 .75rem!important}.reservation-card p{line-height:1.7!important}.reservation-card .content-actions{margin-top:1rem!important}

    .day-badge{display:inline-flex!important;flex-direction:column;align-items:center;justify-content:center;line-height:1;min-width:88px;padding:.95rem .8rem!important}
    .day-badge-label{font-size:inherit;font-weight:600}.day-badge-number{font-size:1.95em;font-weight:700;margin-top:.12rem}

    .tag-row span,.option-card .tag-row span,.day-card .tag-row span{background:#f5d7c8!important;color:#003599!important;font-weight:400!important;border:none!important}
    .tag-row{margin:.55rem 0 .75rem!important}

    .price-legend{display:flex;flex-wrap:wrap;gap:.75rem;margin:0 0 1.25rem 0}
    .legend-pill{display:inline-flex;align-items:center;gap:.55rem;background:#fff3eb;border:1px solid #f0d8c8;border-radius:999px;padding:.72rem .95rem;min-width:unset}
    .legend-pill b{display:inline-grid;place-items:center;min-width:52px;height:52px;padding:0 .6rem;border-radius:999px;background:#fff;color:#f47c20;border:1.5px solid #f0d8c8;font-size:1rem;line-height:1}
    .legend-pill small{color:#5c5c5c;font-size:.82rem;line-height:1.35;max-width:160px}

    .option-card .price-pill{background:#fff3eb!important;color:#f47c20!important;border:1px solid #f3c6ab!important;font-weight:700!important;padding:.42rem .7rem!important;border-radius:999px!important;line-height:1}
    .option-top{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:.5rem}
    .option-title-wrap{display:flex;align-items:center;gap:.6rem;flex:1;min-width:0}.option-card h3{margin:0!important}.option-card .option-icon{font-size:1.2rem;line-height:1.1}.option-card .option-subtitle{font-size:.95rem;line-height:1.45;color:#6a6a6a;margin:0 0 .55rem}
    .option-card .tag-row{margin:.2rem 0 .6rem!important}.option-card p{margin-top:0!important}

    .modo-tip strong{font-weight:700!important;display:inline-block;margin-bottom:.4rem}.modo-tip p{font-weight:400!important;margin:0!important;line-height:1.7}

    .closing-card p{max-width:62ch;margin-left:auto;margin-right:auto}.closing-card p + p{margin-top:1rem}

    @media (max-width: 640px){.reservation-card{grid-template-columns:1fr}.reservation-number{margin-bottom:.25rem}.legend-pill{width:100%}.legend-pill small{max-width:none}}
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = injectedStyle;
  document.head.appendChild(styleEl);

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
      return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : value.startsWith('#') ? value : '';
    } catch {
      return value.startsWith('#') ? value : '';
    }
  };

  const paragraphs = (value = '') => {
    const blocks = String(value).split(/\n\s*\n/g).map(part => part.trim()).filter(Boolean);
    return blocks.map(block => `<p>${esc(block).replaceAll('\n', '<br>')}</p>`).join('');
  };

  const iconMarkup = (action) => {
    if (action?.platform === 'whatsapp') {
      return `<span class="button-brand-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.48 0 .12 5.36.12 11.95c0 2.1.55 4.15 1.58 5.96L0 24l6.28-1.65a11.9 11.9 0 0 0 5.79 1.48h.01c6.59 0 11.95-5.36 11.95-11.95 0-3.19-1.24-6.19-3.51-8.4Zm-8.45 18.3h-.01a9.92 9.92 0 0 1-5.05-1.38l-.36-.22-3.73.98 1-3.64-.24-.38a9.93 9.93 0 0 1-1.53-5.29c0-5.49 4.47-9.96 9.97-9.96 2.66 0 5.16 1.03 7.04 2.91a9.88 9.88 0 0 1 2.91 7.05c0 5.49-4.47 9.95-9.96 9.95Zm5.46-7.44c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15s-.77.97-.95 1.17c-.17.2-.35.22-.65.08-.3-.15-1.25-.46-2.39-1.46-.88-.79-1.48-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.57-.49-.49-.67-.5h-.57c-.2 0-.52.08-.79.37s-1.04 1.01-1.04 2.46 1.06 2.85 1.21 3.05c.15.2 2.08 3.18 5.03 4.46.7.3 1.25.48 1.68.61.71.22 1.36.19 1.87.12.57-.08 1.77-.72 2.02-1.41.25-.69.25-1.28.17-1.41-.07-.12-.27-.2-.57-.35Z"/></svg></span>`;
    }
    if (action?.platform === 'instagram') {
      return `<span class="button-brand-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.75 2h8.5A5.76 5.76 0 0 1 22 7.75v8.5A5.76 5.76 0 0 1 16.25 22h-8.5A5.76 5.76 0 0 1 2 16.25v-8.5A5.76 5.76 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95Zm8.86 1.36a1.09 1.09 0 1 1 0 2.18 1.09 1.09 0 0 1 0-2.18ZM12 6.86A5.14 5.14 0 1 1 6.86 12 5.15 5.15 0 0 1 12 6.86Zm0 1.8A3.34 3.34 0 1 0 15.34 12 3.34 3.34 0 0 0 12 8.66Z"/></svg></span>`;
    }
    return '';
  };

  const button = (action) => {
    const href = safeUrl(action?.url);
    return href ? `<a class="content-button ${action?.platform ? `has-platform platform-${esc(action.platform)}` : ''}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${iconMarkup(action)}<span>${esc(action.label || 'Abrir')}</span></a>` : '';
  };

  const renderLegend = (section) => {
    const legend = defaultLegend(section);
    if (!legend.length) return '';
    return `<div class="price-legend">${legend.map(item => `<span class="legend-pill"><b>${esc(item.label)}</b><small>${esc(item.value)}</small></span>`).join('')}</div>`;
  };

  const renderDayLabel = (label = '') => {
    const trimmed = String(label).trim();
    const match = trimmed.match(/^Dia\s+(\d{2})$/i);
    if (!match) return esc(trimmed);
    return `<span class="day-badge-label">Dia</span><span class="day-badge-number">${esc(match[1])}</span>`;
  };

  const stopIconMap = {
    'Como sair do aeroporto':'✈️','Lastarria ou Bellas Artes':'🚶','Jantar sem complicação':'🍽️','Plaza de Armas':'🏛️','Museo Histórico Nacional':'🏛️','Museo Nacional de Bellas Artes':'🖼️','Almoço':'🍽️','Cerro Santa Lucía':'⛰️','Teatro Municipal de Santiago':'🎭','Palacio de la Moneda':'🏰','Plaza de la Constitución':'📍','Museo de Arte Precolombino':'🗿','Jantar':'🍷','Se organizar cedo':'⏰','Saída para a montanha':'🚌','Estação de ski':'🎿','Retorno a Santiago':'🔁','Parque Arauco':'🛍️','Saída para a vinícola escolhida':'🍇','Cerro San Cristóbal':'🚠','Ida até o Safari Park Chile':'🚗','Safari Park':'🦁','Volta + malas':'🧳','Barrio Italia':'🛍️','Costanera Center + Sky Costanera':'🌇','MUT':'☕','Último almoço':'🍤','Organização':'✅','Ida ao aeroporto':'✈️','No aeroporto':'🛫'
  };

  const inferStopIcon = stop => stop?.icon || stopIconMap[stop?.title] || '📍';

  const inferOptionIcon = (section, item) => {
    if (section.id !== 'hospedagem') return item.icon || '📍';
    const title = String(item.title || '').toLowerCase();
    if (title.includes('airbnb')) return '🏠';
    if (title.includes('hostal') || title.includes('hostel')) return '🛏️';
    return '🏨';
  };

  const defaultLegend = section => {
    if (section.legend?.length) return section.legend;
    if (section.id === 'hospedagem') return [
      {label:'$',value:'até 90.000 CLP'},{label:'$$',value:'90.001 a 140.000 CLP'},{label:'$$$',value:'140.001 a 220.000 CLP'},{label:'$$$$',value:'220.001 a 320.000 CLP'},{label:'$$$$$',value:'acima de 320.000 CLP'}
    ];
    if (section.id === 'restaurantes') return [
      {label:'$',value:'até 8.000 CLP'},{label:'$$',value:'8.001 a 15.000 CLP'},{label:'$$$',value:'15.001 a 25.000 CLP'},{label:'$$$$',value:'25.001 a 40.000 CLP'},{label:'$$$$$',value:'acima de 40.000 CLP'}
    ];
    return [];
  };

  const normalizeClosingText = value => {
    let text = String(value || '').trim();
    if (!text) return '';
    text = text.replace(/\s+Quando você responde o formulário depois da viagem,/i, '\n\nQuando você responde o formulário depois da viagem,');
    text = text.replace(/\s+Esse retorno faz diferença de verdade nas próximas versões\.?/i, '\n\nEsse retorno faz diferença de verdade nas próximas versões.');
    return text;
  };

  function cover(route) {
    const overview = route.overview || {};
    return `<section class="itinerary-cover" id="inicio"><div class="cover-image" style="background-image:linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.45)),url('${esc(route.cover_image || '../images/destinos/santiago.jpg')}')"></div><div class="cover-content"><span class="eyebrow eyebrow-orange">Roteiro Pronto</span><div class="cover-emojis">${esc(route.emojis || '🗻 🇨🇱 ❄️')}</div><h1>${esc(route.title)}</h1><h2>${esc(route.subtitle || '')}</h2><p>${esc(route.intro || '')}</p><div class="overview-card"><h3>🗺️ Visão geral da viagem</h3><dl><div><dt>Destino</dt><dd>${esc(route.destination || '')}</dd></div><div><dt>Duração</dt><dd>${esc(route.duration || '')}</dd></div><div><dt>Estilo</dt><dd>${esc(overview.style || '')}</dd></div><div><dt>Perfil</dt><dd>${esc(overview.profile || '')}</dd></div></dl><strong>Tudo foi pensado pra ficar fácil de abrir no celular no meio da viagem.</strong></div></div></section>`;
  }

  function cards(section) {
    return `<div class="content-grid">${(section.items || []).map(item => `<article class="content-card"><h3>${esc(item.icon || '')} ${esc(item.title)}</h3>${item.text ? `<p>${esc(item.text)}</p>` : ''}${item.note ? `<p class="card-note">${esc(item.note)}</p>` : ''}${item.actions?.length ? `<div class="content-actions">${item.actions.map(button).join('')}</div>` : ''}</article>`).join('')}</div>`;
  }

  function budget(section) {
    return `<div class="budget-grid">${(section.items || []).map(item => `<article class="budget-card"><h3>${esc(item.icon || '')} ${esc(item.title)}</h3><ul>${(item.ranges || []).map(range => `<li><span>${esc(range.label)}</span><strong>${esc(range.value)}</strong></li>`).join('')}</ul>${item.note ? `<p>${esc(item.note)}</p>` : ''}</article>`).join('')}</div>${section.summary ? `<div class="highlight-box">${esc(section.summary)}</div>` : ''}`;
  }

  function reservations(section) {
    return `<div class="reservation-list">${(section.items || []).map((item, index) => `<article class="reservation-card"><span class="reservation-number">${String(index + 1).padStart(2, '0')}</span><div><span class="eyebrow">${esc(item.label || 'Antes de reservar')}</span><h3>${esc(item.icon || '')} ${esc(item.title)}</h3><p>${esc(item.text || '')}</p>${item.actions?.length ? `<div class="content-actions">${item.actions.map(button).join('')}</div>` : ''}</div></article>`).join('')}</div>`;
  }

  function days(section) {
    return `<div class="days-list">${(section.items || []).map(day => `<article class="day-card" id="${esc(day.id || '')}"><div class="day-head"><span class="day-number day-badge">${renderDayLabel(day.label || '')}</span><div><h3>${esc(day.title)}</h3><p>${esc(day.summary || '')}</p></div></div>${day.tags?.length ? `<div class="tag-row">${day.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div>` : ''}<div class="timeline">${(day.stops || []).map(stop => `<div class="timeline-item"><div class="timeline-time">${esc(stop.time || 'Ao longo do dia')}</div><div class="timeline-copy"><h4>${esc(inferStopIcon(stop))} ${esc(stop.title)}</h4><p>${esc(stop.text || '')}</p>${stop.note ? `<p class="card-note">${esc(stop.note)}</p>` : ''}${stop.actions?.length ? `<div class="content-actions">${stop.actions.map(button).join('')}</div>` : ''}</div></div>`).join('')}</div>${day.tip ? `<div class="modo-tip"><strong>💙 Dica Modo</strong><p>${esc(day.tip)}</p></div>` : ''}</article>`).join('')}</div>`;
  }

  function options(section) {
    return `${renderLegend(section)}<div class="options-grid">${(section.items || []).map(item => `<article class="option-card"><div class="option-top"><div class="option-title-wrap"><span class="option-icon">${esc(inferOptionIcon(section, item))}</span><h3>${esc(item.title)}</h3></div>${item.price ? `<span class="price-pill">${esc(item.price)}</span>` : ''}</div>${item.tags?.length ? `<div class="tag-row">${item.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div>` : ''}${item.subtitle ? `<div class="option-subtitle">${esc(item.subtitle)}</div>` : ''}<p>${esc(item.text || '')}</p>${item.actions?.length ? `<div class="content-actions">${item.actions.map(button).join('')}</div>` : ''}</article>`).join('')}</div>`;
  }

  function links(section) {
    return `<div class="links-grid">${(section.items || []).map(item => {const href = safeUrl(item.url); const tag = href ? 'a' : 'div'; const attributes = href ? `href="${esc(href)}" target="_blank" rel="noopener noreferrer"` : ''; return `<${tag} class="link-card ${href ? '' : 'is-disabled'}" ${attributes}><span>${esc(item.icon || '🔗')}</span><div><strong>${esc(item.title)}</strong><small>${esc(item.text || '')}</small></div><b>→</b></${tag}>`;}).join('')}</div>`;
  }

  function checklist(section, routeSlug) {
    const storageKey = `modo-checklist-${routeSlug}`;
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch {}
    setTimeout(() => document.querySelectorAll('[data-check-id]').forEach(input => input.addEventListener('change', () => { saved[input.dataset.checkId] = input.checked; localStorage.setItem(storageKey, JSON.stringify(saved)); })), 0);
    return `<div class="checklist-grid">${(section.groups || []).map((group, groupIndex) => `<article class="checklist-group"><h3>${esc(group.icon || '✅')} ${esc(group.title)}</h3><div>${(group.items || []).map((item, itemIndex) => { const id = `check-${groupIndex}-${itemIndex}`; return `<label class="check-item" for="${id}"><input id="${id}" type="checkbox" data-check-id="${id}" ${saved[id] ? 'checked' : ''}/><span>${esc(item)}</span></label>`; }).join('')}</div></article>`).join('')}</div>`;
  }

  function closing(section) {
    return `<div class="closing-card"><div class="closing-icon">${esc(section.icon || '✈️')}</div><h3>${esc(section.title || '')}</h3>${paragraphs(normalizeClosingText(section.text || ''))}${section.actions?.length ? `<div class="content-actions centered">${section.actions.map(button).join('')}</div>` : ''}</div>`;
  }

  function sectionMarkup(section, routeSlug) {
    const renderers = { cards, budget, reservations, days, options, links, checklist: current => checklist(current, routeSlug), closing };
    const renderer = renderers[section.type];
    if (!renderer) return '';
    return `<section class="itinerary-section" id="${esc(section.id)}"><div class="section-intro">${section.tag ? `<span class="eyebrow ${section.tagColor === 'orange' ? 'eyebrow-orange' : ''}">${esc(section.tag)}</span>` : ''}<h2>${esc(section.title || '')}</h2>${section.subtitle ? `<p>${esc(section.subtitle)}</p>` : ''}</div>${renderer(section)}</section>`;
  }

  function render(route) {
    document.title = `${route.title} | Modo Turistagem`;
    root.innerHTML = `${cover(route)}${(route.content?.sections || []).map(current => sectionMarkup(current, route.slug)).join('')}<footer class="itinerary-footer"><img src="../images/LOGOTIPO%20branco.png" alt="Modo Turistagem" /><p>Uso pessoal • Reprodução não autorizada • Versão ${esc(route.version || '')}</p></footer>`;
    nav.innerHTML = [{ id: 'inicio', title: 'Capa' }, ...(route.content?.sections || []).map(current => ({ id: current.id, title: current.navTitle || current.title }))].map(item => `<a href="#${esc(item.id)}">${esc(item.title)}</a>`).join('');
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeSidebar));
  }

  async function load() {
    if (draft) { const raw = sessionStorage.getItem('modoPortalDraft'); if (!raw) throw Error('Rascunho não encontrado.'); return render(JSON.parse(raw)); }
    if (demo) { if (!window.MODO_PREVIEW_ITINERARY) throw Error('Demonstração indisponível.'); return render(window.MODO_PREVIEW_ITINERARY); }
    if (!db) return location.replace('index.html');
    const { data: sessionData } = await db.auth.getSession();
    if (!sessionData.session) return location.replace('index.html');
    const userId = sessionData.session.user.id;
    const { data: profile } = await db.from('profiles').select('is_admin').eq('id', userId).maybeSingle();
    let query = db.from('itineraries').select('*').eq('slug', slug);
    if (!profile?.is_admin) query = query.eq('status', 'published');
    const { data, error } = await query.single();
    if (error || !data) throw Error(profile?.is_admin ? 'Esse roteiro ainda não foi salvo no Supabase.' : 'Esse roteiro não está liberado para esta conta.');
    render(data);
  }

  function openSidebar(){ side.classList.add('is-open'); backdrop.classList.add('is-open'); }
  function closeSidebar(){ side.classList.remove('is-open'); backdrop.classList.remove('is-open'); }
  document.querySelector('#summaryButton').onclick = openSidebar;
  document.querySelector('#floatingSummaryButton').onclick = openSidebar;
  document.querySelector('#closeSummaryButton').onclick = closeSidebar;
  backdrop.onclick = closeSidebar;
  document.querySelector('#printButton').onclick = () => print();
  load().catch(error => { root.innerHTML = `<div class="state-card itinerary-error"><strong>Não consegui abrir o roteiro.</strong><p>${esc(error.message)}</p><a class="btn btn-primary" href="dashboard.html">Voltar</a></div>`; });
})();
