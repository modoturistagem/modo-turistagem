(() => {
  const config = window.MODO_PORTAL_CONFIG || {};
  const ready = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
  const db = ready ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;
  const message = document.querySelector('#editorMessage');
  const grantMessage = document.querySelector('#grantMessage');
  const importInput = document.querySelector('#routeImportFile');

  const say = (element, text, type = '') => {
    element.textContent = text;
    element.className = `form-message ${type}`.trim();
  };

  function getRoute() {
    let content;
    try {
      content = JSON.parse(document.querySelector('#routeContent').value || '{"sections":[]}');
    } catch (error) {
      throw Error(`O conteúdo não está em JSON válido: ${error.message}`);
    }
    return {
      slug: document.querySelector('#routeSlug').value.trim(),
      status: document.querySelector('#routeStatus').value,
      title: document.querySelector('#routeTitle').value.trim(),
      subtitle: document.querySelector('#routeSubtitle').value.trim(),
      destination: document.querySelector('#routeDestination').value.trim(),
      duration: document.querySelector('#routeDuration').value.trim(),
      season: document.querySelector('#routeSeason').value.trim(),
      version: document.querySelector('#routeVersion').value.trim(),
      intro: document.querySelector('#routeIntro').value.trim(),
      cover_image: document.querySelector('#routeCover').value.trim(),
      overview: window.__modoImportedOverview || { style: 'equilibrado', profile: 'primeira viagem / casal / amigas / família / solo' },
      content
    };
  }

  function fill(route) {
    window.__modoImportedOverview = route.overview || null;
    document.querySelector('#routeSlug').value = route.slug || '';
    document.querySelector('#routeStatus').value = route.status || 'draft';
    document.querySelector('#routeTitle').value = route.title || '';
    document.querySelector('#routeSubtitle').value = route.subtitle || '';
    document.querySelector('#routeDestination').value = route.destination || '';
    document.querySelector('#routeDuration').value = route.duration || '';
    document.querySelector('#routeSeason').value = route.season || '';
    document.querySelector('#routeVersion').value = route.version || '';
    document.querySelector('#routeIntro').value = route.intro || '';
    document.querySelector('#routeCover').value = route.cover_image || '';
    document.querySelector('#routeContent').value = JSON.stringify(route.content || { sections: [] }, null, 2);
  }

  async function verify() {
    if (!db) {
      say(message, 'Modo demonstração: importar e pré-visualizar já funciona. Para salvar e liberar clientes, conecte o Supabase.', 'warning');
      return;
    }
    const { data: sessionData } = await db.auth.getSession();
    if (!sessionData.session) return location.replace('index.html');
    const { data } = await db.from('profiles').select('is_admin').eq('id', sessionData.session.user.id).single();
    if (!data?.is_admin) location.replace('dashboard.html');
  }

  document.querySelector('#loadExampleButton').onclick = () => fill(window.MODO_PREVIEW_ITINERARY);

  document.querySelector('#importRouteButton').onclick = () => importInput.click();
  importInput.addEventListener('change', async () => {
    const [file] = importInput.files || [];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!parsed.slug || !parsed.title || !parsed.content?.sections) throw Error('O arquivo não parece ser um roteiro válido.');
      fill(parsed);
      say(message, `Roteiro privado importado: ${parsed.title}. Confira a prévia antes de salvar.`, 'success');
    } catch (error) {
      say(message, `Não consegui importar o arquivo: ${error.message}`, 'error');
    } finally {
      importInput.value = '';
    }
  });

  document.querySelector('#exportRouteButton').onclick = () => {
    try {
      const route = getRoute();
      const blob = new Blob([JSON.stringify(route, null, 2)], { type: 'application/json;charset=utf-8' });
      const href = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = href;
      anchor.download = `${route.slug || 'roteiro'}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
      say(message, 'Backup privado baixado.', 'success');
    } catch (error) {
      say(message, error.message, 'error');
    }
  };

  document.querySelector('#previewButton').onclick = () => {
    try {
      sessionStorage.setItem('modoPortalDraft', JSON.stringify(getRoute()));
      window.open('roteiro.html?draft=1', '_blank', 'noopener');
      say(message, 'Prévia aberta em uma nova aba.', 'success');
    } catch (error) {
      say(message, error.message, 'error');
    }
  };

  document.querySelector('#itineraryForm').addEventListener('submit', async event => {
    event.preventDefault();
    try {
      if (!db) throw Error('Conecte o Supabase para salvar. A importação e a prévia já funcionam sem ele.');
      const { error } = await db.from('itineraries').upsert(getRoute(), { onConflict: 'slug' });
      if (error) throw error;
      say(message, 'Roteiro completo salvo no banco protegido ✨', 'success');
    } catch (error) {
      say(message, error.message, 'error');
    }
  });

  document.querySelector('#grantForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!db) return say(grantMessage, 'Conecte o Supabase para liberar acessos reais.', 'warning');
    const expiry = document.querySelector('#grantExpiry').value || null;
    const { data, error } = await db.rpc('grant_itinerary_access_by_email', {
      customer_email: document.querySelector('#grantEmail').value.trim(),
      itinerary_slug: document.querySelector('#grantSlug').value.trim(),
      expires_at_value: expiry ? new Date(`${expiry}T23:59:59`).toISOString() : null
    });
    say(grantMessage, error ? error.message : (data || 'Acesso liberado.'), error ? 'error' : 'success');
  });

  document.querySelector('#adminSignOutButton').onclick = async () => {
    if (db) await db.auth.signOut();
    location.replace('index.html');
  };

  fill(window.MODO_PREVIEW_ITINERARY);
  verify();
})();
