(() => {
  const config = window.MODO_PORTAL_CONFIG || {};
  const ready = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
  const client = ready ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;
  const message = document.querySelector('#authMessage');
  const say = (text, type = '') => { message.textContent = text; message.className = `form-message ${type}`.trim(); };
  const busy = (button, active, label) => { button.disabled = active; button.textContent = active ? 'Só um segundo…' : label; };
  const redirectTo = `${config.siteUrl || location.origin}/dashboard.html`;

  async function existingSession() {
    if (!client) return;
    const { data } = await client.auth.getSession();
    if (data.session) location.replace('dashboard.html');
  }

  document.querySelector('#passwordForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) return say('O login seguro ainda precisa ser conectado ao Supabase. A demonstração já funciona abaixo.', 'warning');
    const button = document.querySelector('#passwordButton');
    busy(button, true, 'Entrar');
    say('');
    const { error } = await client.auth.signInWithPassword({
      email: document.querySelector('#email').value.trim(),
      password: document.querySelector('#password').value
    });
    busy(button, false, 'Entrar');
    if (error) return say('Não consegui entrar. Confere os dados, cria sua senha no primeiro acesso ou usa o link mágico.', 'error');
    location.replace('dashboard.html');
  });

  document.querySelector('#signupForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) return say('A criação de senha será ativada quando o Supabase for conectado.', 'warning');
    const button = document.querySelector('#signupButton');
    busy(button, true, 'Criar acesso');
    const { data, error } = await client.auth.signUp({
      email: document.querySelector('#signupEmail').value.trim(),
      password: document.querySelector('#signupPassword').value,
      options: { emailRedirectTo: redirectTo }
    });
    busy(button, false, 'Criar acesso');
    if (error) return say(error.message || 'Não consegui criar o acesso agora.', 'error');
    if (data.session) return location.replace('dashboard.html');
    say('Conta criada! Confirme o e-mail e depois entre com a senha escolhida ✨', 'success');
  });

  document.querySelector('#magicForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) return say('O envio por e-mail será ativado quando as chaves do Supabase forem adicionadas.', 'warning');
    const button = document.querySelector('#magicButton');
    busy(button, true, 'Enviar link');
    const { error } = await client.auth.signInWithOtp({
      email: document.querySelector('#magicEmail').value.trim(),
      options: { emailRedirectTo: redirectTo }
    });
    busy(button, false, 'Enviar link');
    say(error ? 'Não consegui enviar o link agora.' : 'Pronto! O link foi enviado ✨', error ? 'error' : 'success');
  });

  document.querySelector('#demoButton').addEventListener('click', () => {
    sessionStorage.setItem('modoPortalDemo', '1');
    location.href = 'dashboard.html?demo=1';
  });

  if (!ready) say('Protótipo em modo demonstração. O acesso real será ativado com o Supabase.', 'warning');
  existingSession();
})();
