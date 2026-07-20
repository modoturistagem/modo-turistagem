(() => {
  const config = window.MODO_PORTAL_CONFIG || {};
  const ready = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
  const client = ready ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;
  const msg = document.querySelector('#authMessage');
  const say = (text, type='') => { msg.textContent=text; msg.className=`form-message ${type}`.trim(); };
  const busy = (button,on,label) => { button.disabled=on; button.textContent=on?'Só um segundo…':label; };
  async function existing(){ if(!client)return; const {data}=await client.auth.getSession(); if(data.session) location.replace('dashboard.html'); }
  document.querySelector('#passwordForm').addEventListener('submit', async e => {
    e.preventDefault(); if(!client){say('O login seguro ainda precisa ser conectado ao Supabase. A demonstração já funciona abaixo.','warning');return;}
    const b=document.querySelector('#passwordButton'); busy(b,true,'Entrar'); say('');
    const {error}=await client.auth.signInWithPassword({email:document.querySelector('#email').value.trim(),password:document.querySelector('#password').value});
    busy(b,false,'Entrar'); if(error){say('Não consegui entrar. Confere os dados ou usa o link mágico.','error');return;} location.replace('dashboard.html');
  });
  document.querySelector('#magicForm').addEventListener('submit', async e => {
    e.preventDefault(); if(!client){say('O envio por e-mail será ativado quando as chaves do Supabase forem adicionadas.','warning');return;}
    const b=document.querySelector('#magicButton'); busy(b,true,'Enviar link');
    const redirectTo=`${config.siteUrl || location.origin}/dashboard.html`;
    const {error}=await client.auth.signInWithOtp({email:document.querySelector('#magicEmail').value.trim(),options:{emailRedirectTo:redirectTo}});
    busy(b,false,'Enviar link'); say(error?'Não consegui enviar o link agora.':'Pronto! O link foi enviado ✨',error?'error':'success');
  });
  document.querySelector('#demoButton').addEventListener('click',()=>{sessionStorage.setItem('modoPortalDemo','1');location.href='dashboard.html?demo=1';});
  if(!ready)say('Protótipo em modo demonstração. O acesso real será ativado com o Supabase.','warning'); existing();
})();