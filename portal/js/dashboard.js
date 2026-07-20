(() => {
  const config = window.MODO_PORTAL_CONFIG || {};
  const params = new URLSearchParams(location.search);
  const demo = params.get('demo') === '1' || sessionStorage.getItem('modoPortalDemo') === '1';
  const ready = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
  const db = ready ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;

  const grid = document.querySelector('#routesGrid');
  const loading = document.querySelector('#loadingState');
  const empty = document.querySelector('#emptyState');
  const count = document.querySelector('#routeCount');
  const libraryTitle = document.querySelector('#library-title');
  const libraryEyebrow = libraryTitle?.previousElementSibling;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const statusLabel = status => ({
    published: 'Publicado',
    draft: 'Rascunho',
    archived: 'Arquivado'
  }[status] || 'Liberado');

  function card(route, mode = 'client') {
    const isDemo = mode === 'demo';
    const isAdmin = mode === 'admin';
    const href = `roteiro.html?slug=${encodeURIComponent(route.slug)}${isDemo ? '&demo=1' : ''}`;
    const badge = isDemo ? 'Demonstração' : (isAdmin ? statusLabel(route.status) : 'Liberado');
    const buttonLabel = isAdmin ? 'Abrir roteiro →' : 'Abrir roteiro →';

    return `<article class="route-card">
      <div class="route-cover" style="background-image:url('${escapeHtml(route.cover_image || '../images/destinos/santiago.jpg')}')">
        <span class="route-status">${escapeHtml(badge)}</span>
      </div>
      <div class="route-card-body">
        <span class="eyebrow">${escapeHtml(route.destination || 'Roteiro Modo')}</span>
        <h3>${escapeHtml(route.title)}</h3>
        <p>${escapeHtml(route.subtitle || route.intro || '')}</p>
        <div class="route-meta">
          <span>🗓️ ${escapeHtml(route.duration || 'Consulte o roteiro')}</span>
          ${route.season ? `<span>🌤️ ${escapeHtml(route.season)}</span>` : ''}
        </div>
        <a class="btn btn-primary" href="${href}">${buttonLabel}</a>
      </div>
    </article>`;
  }

  function render(routes, mode = 'client') {
    loading.classList.add('is-hidden');
    grid.innerHTML = '';
    empty.classList.add('is-hidden');
    count.textContent = `${routes.length} ${routes.length === 1 ? 'roteiro' : 'roteiros'}`;

    if (!routes.length) {
      empty.classList.remove('is-hidden');
      return;
    }

    grid.innerHTML = routes.map(route => card(route, mode)).join('');
  }

  function configureAdminEmptyState() {
    libraryEyebrow.textContent = 'Biblioteca administrativa';
    libraryTitle.textContent = 'Todos os roteiros';
    empty.innerHTML = `
      <strong>Nenhum roteiro foi salvo no Supabase ainda.</strong>
      <p>O roteiro do Chile já está preparado, mas precisa ser importado e salvo no painel administrativo para aparecer aqui.</p>
      <a class="btn btn-primary" href="admin.html">Ir para o painel administrativo</a>`;
  }

  async function real() {
    if (!db) return location.replace('index.html');

    const { data: sessionData } = await db.auth.getSession();
    if (!sessionData.session) return location.replace('index.html');

    const user = sessionData.session.user;
    const { data: profile } = await db
      .from('profiles')
      .select('is_admin,username,full_name')
      .eq('id', user.id)
      .maybeSingle();

    const displayName = profile?.full_name || profile?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'viajante';
    document.querySelector('#userGreeting').textContent = `Oi, ${displayName}`;

    if (profile?.is_admin) {
      document.querySelector('#adminLink').classList.remove('is-hidden');
      configureAdminEmptyState();

      const { data, error } = await db
        .from('itineraries')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        loading.textContent = 'Não consegui carregar os roteiros do portal agora.';
        return;
      }

      render(data || [], 'admin');
      return;
    }

    const { data, error } = await db
      .from('itinerary_access')
      .select('access_expires_at,itineraries(*)')
      .or(`access_expires_at.is.null,access_expires_at.gt.${new Date().toISOString()}`)
      .order('created_at', { ascending: false });

    if (error) {
      loading.textContent = 'Não consegui carregar seus roteiros agora.';
      return;
    }

    render((data || []).map(item => item.itineraries).filter(Boolean), 'client');
  }

  document.querySelector('#signOutButton').addEventListener('click', async () => {
    sessionStorage.removeItem('modoPortalDemo');
    if (db) await db.auth.signOut();
    location.replace('index.html');
  });

  if (demo) {
    document.querySelector('#userGreeting').textContent = 'Modo demonstração';
    render([{
      slug: 'andes-na-janela',
      title: 'Andes na Janela',
      subtitle: '5 dias em Santiago (inverno)',
      destination: 'Santiago, Chile',
      duration: '5 dias',
      season: 'Inverno',
      cover_image: '../images/destinos/santiago.jpg'
    }], 'demo');
  } else {
    real();
  }
})();
