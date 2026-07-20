(() => {
  const config = window.MODO_PORTAL_CONFIG || {};
  const ready = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
  const client = ready ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;
  const message = document.querySelector('#authMessage');
  const usernameDomain = config.usernameDomain || 'clientes.modoturistagem.local';

  const say = (text, type = '') => {
    message.textContent = text;
    message.className = `form-message ${type}`.trim();
  };

  const busy = (button, active, label) => {
    button.disabled = active;
    button.textContent = active ? 'Só um segundo…' : label;
  };

  const normalizeUsername = value => value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9._-]/g, '');

  const identifierToEmail = value => {
    const clean = value.trim().toLowerCase();
    if (clean.includes('@')) return clean;
    return `${normalizeUsername(clean)}@${usernameDomain}`;
  };

  async function existingSession() {
    if (!client) return;
    const { data } = await client.auth.getSession();
    if (data.session) location.replace('dashboard.html');
  }

  document.querySelector('#passwordForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) return say('O login seguro ainda precisa ser conectado ao Supabase. A demonstração continua disponível abaixo.', 'warning');

    const username = document.querySelector('#username').value;
    const normalized = normalizeUsername(username);
    if (!username.includes('@') && normalized.length < 3) return say('Confira o nome de usuário enviado pela Modo Turistagem.', 'error');

    const button = document.querySelector('#passwordButton');
    busy(button, true, 'Entrar');
    say('');

    const { error } = await client.auth.signInWithPassword({
      email: identifierToEmail(username),
      password: document.querySelector('#password').value
    });

    busy(button, false, 'Entrar');
    if (error) return say('Usuário ou senha incorretos. Confira os dados recebidos da Modo Turistagem.', 'error');
    location.replace('dashboard.html');
  });

  document.querySelector('#demoButton').addEventListener('click', () => {
    sessionStorage.setItem('modoPortalDemo', '1');
    location.href = 'dashboard.html?demo=1';
  });

  if (!ready) say('Protótipo em modo demonstração. O acesso real será ativado com o Supabase.', 'warning');
  existingSession();
})();
