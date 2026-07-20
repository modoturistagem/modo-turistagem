(() => {
  const config = window.MODO_PORTAL_CONFIG || {};
  const ready = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
  const db = ready ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;
  const message = document.querySelector('#editorMessage');
  const clientMessage = document.querySelector('#clientMessage');
  const importInput = document.querySelector('#routeImportFile');
  const credentialResult = document.querySelector('#credentialResult');

  const say = (element, text, type = '') => {
    element.textContent = text;
    element.className = `form-message ${type}`.trim();
  };

  const normalizeUsername = value => value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/^[._-]+|[._-]+$/g, '');

  const makePassword = (length = 14) => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    return Array.from(values, value => alphabet[value % alphabet.length]).join('');
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

  async function loadItineraryOptions() {
    if (!db) return;
    const select = document.querySelector('#clientItinerarySlug');
    const { data, error } = await db.from('itineraries').select('slug,title').order('title');
    if (error || !data?.length) return;
    select.innerHTML = data.map(route => `<option value="${route.slug.replaceAll('"', '&quot;')}">${route.title}</option>`).join('');
  }

  async function verify() {
    if (!db) {
      say(message, 'Modo demonstração: importar e pré-visualizar funciona. Para salvar e criar acessos, conecte o Supabase.', 'warning');
      return;
    }
    const { data: sessionData } = await db.auth.getSession();
    if (!sessionData.session) return location.replace('index.html');
    const { data, error } = await db.from('profiles').select('is_admin').eq('id', sessionData.session.user.id).single();
    if (error || !data?.is_admin) return location.replace('dashboard.html');
    await loadItineraryOptions();
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
      await loadItineraryOptions();
    } catch (error) {
      say(message, error.message, 'error');
    }
  });

  document.querySelector('#clientFullName').addEventListener('blur', event => {
    const usernameField = document.querySelector('#clientUsername');
    if (usernameField.value) return;
    usernameField.value = normalizeUsername(event.target.value.replace(/\s+/g, '.'));
  });

  document.querySelector('#clientUsername').addEventListener('input', event => {
    const caret = event.target.selectionStart;
    event.target.value = normalizeUsername(event.target.value);
    event.target.setSelectionRange(caret, caret);
  });

  document.querySelector('#generatePasswordButton').onclick = () => {
    document.querySelector('#clientPassword').value = makePassword();
  };

  document.querySelector('#createClientForm').addEventListener('submit', async event => {
    event.preventDefault();
    credentialResult.classList.add('is-hidden');
    if (!db) return say(clientMessage, 'Conecte o Supabase para criar acessos.', 'warning');

    const username = normalizeUsername(document.querySelector('#clientUsername').value);
    const password = document.querySelector('#clientPassword').value;
    const button = document.querySelector('#createClientButton');

    if (username.length < 3) return say(clientMessage, 'O usuário precisa ter pelo menos 3 caracteres.', 'error');
    if (password.length < 8) return say(clientMessage, 'A senha precisa ter pelo menos 8 caracteres.', 'error');

    button.disabled = true;
    button.textContent = 'Criando…';
    say(clientMessage, '');

    const expiry = document.querySelector('#clientExpiry').value || null;
    const { data, error } = await db.functions.invoke('create-client', {
      body: {
        full_name: document.querySelector('#clientFullName').value.trim(),
        username,
        password,
        itinerary_slug: document.querySelector('#clientItinerarySlug').value,
        access_expires_at: expiry ? new Date(`${expiry}T23:59:59`).toISOString() : null
      }
    });

    button.disabled = false;
    button.textContent = 'Criar acesso';

    if (error || !data?.ok) {
      const detail = data?.error || error?.message || 'Não consegui criar o acesso.';
      return say(clientMessage, `${detail} Confira se a Edge Function create-client foi publicada.`, 'error');
    }

    document.querySelector('#resultUsername').textContent = data.username;
    document.querySelector('#resultPassword').textContent = password;
    credentialResult.classList.remove('is-hidden');
    say(clientMessage, `Acesso criado e roteiro “${data.itinerary_title}” liberado.`, 'success');
  });

  document.querySelector('#copyCredentialsButton').onclick = async () => {
    const username = document.querySelector('#resultUsername').textContent;
    const password = document.querySelector('#resultPassword').textContent;
    const text = `Seu acesso ao Portal Modo Turistagem\nUsuário: ${username}\nSenha: ${password}\nAcesse: ${config.siteUrl || location.origin}`;
    try {
      await navigator.clipboard.writeText(text);
      say(clientMessage, 'Dados de acesso copiados ✨', 'success');
    } catch {
      say(clientMessage, 'Não consegui copiar automaticamente. Selecione os dados acima.', 'warning');
    }
  };

  document.querySelector('#adminSignOutButton').onclick = async () => {
    if (db) await db.auth.signOut();
    location.replace('index.html');
  };

  fill(window.MODO_PREVIEW_ITINERARY);
  verify();
})();
