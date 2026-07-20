from pathlib import Path


def load(path):
    return Path(path).read_text(encoding="utf-8")


def save(path, text):
    Path(path).write_text(text, encoding="utf-8")


# Home
path = "index.html"
text = load(path)
old = "Vai de roteiro pronto. Você escolhe o destino, baixa o material e já começa a viagem com mais clareza, menos pesquisa solta e muito mais segurança pra decidir o que faz sentido pra você."
new = "Vai de roteiro pronto. Você escolhe o destino, recebe seu acesso individual e encontra tudo organizado no Portal de Roteiros — pronto pra abrir no celular, consultar durante a viagem e salvar em PDF quando quiser."
if old not in text:
    raise RuntimeError("Texto da home não encontrado")
text = text.replace(old, new, 1)
button = '<a href="roteiros-prontos.html" class="btn-primary"><span class="emoji emoji-inline" aria-hidden="true">📚</span> Ir para roteiros prontos</a>'
if button not in text:
    raise RuntimeError("Botão de roteiros da home não encontrado")
text = text.replace(button, button + '\n          <a href="portal/" class="btn-blue">🔐 Acessar meus roteiros</a>', 1)
save(path, text)

# Como funciona
path = "como-funciona.html"
text = load(path)
old_title = '<h3><span class="emoji">📄</span> <span class="emoji">🔗</span> Entrega em PDF clicável (pra usar no celular)</h3>'
new_title = '<h3><span class="emoji">📱</span> <span class="emoji">🔗</span> Entrega organizada e pronta pra usar</h3>'
if old_title not in text:
    raise RuntimeError("Título do passo 4 não encontrado")
text = text.replace(old_title, new_title, 1)
old_copy = "A entrega chega organizada e pronta pra ação, com links e orientações.\n              Sem planilha infinita, sem textão confuso — é pra abrir e seguir."
new_copy = "Nos Roteiros Prontos, o acesso acontece pelo Portal de Roteiros. Na consultoria, o formato segue o plano contratado.\n              Em ambos os casos, o conteúdo chega organizado, clicável e pensado pra usar no celular."
if old_copy not in text:
    raise RuntimeError("Texto do passo 4 não encontrado")
text = text.replace(old_copy, new_copy, 1)
old_bullet = '<p class="bullet-txt"><strong>PDF clicável</strong> com tudo organizado (e links funcionando).</p>'
new_bullet = '<p class="bullet-txt"><strong>Portal ou PDF clicável</strong>, conforme o produto, com tudo organizado e links funcionando.</p>'
if old_bullet not in text:
    raise RuntimeError("Bullet de entrega não encontrado")
text = text.replace(old_bullet, new_bullet, 1)

css = """
    .portal-info-box{
      max-width:980px;
      margin:2rem auto 0;
      padding:1.5rem;
      border-radius:20px;
      background:linear-gradient(135deg,var(--azul) 0%,#2458B8 100%);
      color:var(--branco);
      text-align:center;
      box-shadow:0 14px 34px rgba(0,53,153,.18);
    }
    .portal-info-box h3{color:var(--branco);margin-bottom:.6rem}
    .portal-info-box p{max-width:760px;margin:0 auto 1rem;line-height:1.7}
    .portal-info-actions{display:flex;justify-content:center;flex-wrap:wrap;gap:.75rem}
    .portal-info-actions .btn-secondary{border-color:var(--branco);color:var(--branco)}
    .portal-info-actions .btn-secondary:hover{background:var(--branco);color:var(--azul)}
    @media(max-width:768px){.portal-info-actions{flex-direction:column}.portal-info-actions a{width:100%}}
"""
if ".portal-info-box" not in text:
    marker = "  </style>\n</head>"
    if marker not in text:
        raise RuntimeError("Fim do CSS não encontrado")
    text = text.replace(marker, css + "  </style>\n</head>", 1)

box = """      <div class="portal-info-box fade-in">
        <h3>🔐 Já comprou um Roteiro Pronto?</h3>
        <p>Seu acesso fica no Portal de Roteiros. Entre com o usuário e a senha enviados pela Modo para abrir sua biblioteca, acompanhar atualizações e salvar o conteúdo em PDF quando precisar.</p>
        <div class="portal-info-actions">
          <a href="portal/" class="btn-primary">Acessar meus roteiros</a>
          <a href="portal/dashboard.html?demo=1" class="btn-secondary">Ver demonstração</a>
        </div>
      </div>

"""
if 'class="portal-info-box fade-in"' not in text:
    marker = '      <div class="cta-final fade-in">'
    if marker not in text:
        raise RuntimeError("CTA final não encontrado")
    text = text.replace(marker, box + marker, 1)
save(path, text)

# Páginas privadas do portal
for path in ["portal/index.html", "portal/dashboard.html", "portal/roteiro.html", "portal/admin.html"]:
    text = load(path)
    if 'name="robots"' not in text:
        marker = '<meta name="theme-color" content="#003599" />'
        if marker not in text:
            raise RuntimeError(f"Meta theme-color não encontrada em {path}")
        text = text.replace(marker, marker + '<meta name="robots" content="noindex, nofollow" />', 1)
    save(path, text)

path = "portal/dashboard.html"
text = load(path)
old = "Se você já comprou, fala com a gente para conferir o e-mail usado no pagamento."
new = "Se você já comprou, chama a gente com seu comprovante para conferirmos a liberação do roteiro na sua conta."
if old not in text:
    raise RuntimeError("Estado vazio antigo não encontrado")
save(path, text.replace(old, new, 1))

# Validações
required = {
    "roteiros-prontos.html": ["portal-access-title", "Acesso ao Portal enviado após a confirmação do pagamento"],
    "faq.html": ["Como acesso um roteiro que já comprei?", "Consigo salvar o roteiro em PDF?"],
    "index.html": ["Acessar meus roteiros", "Portal de Roteiros"],
    "como-funciona.html": ["portal-info-box fade-in", "Portal ou PDF clicável"],
    "portal/index.html": ["noindex, nofollow"],
    "portal/dashboard.html": ["noindex, nofollow", "liberação do roteiro na sua conta"],
    "portal/roteiro.html": ["noindex, nofollow"],
    "portal/admin.html": ["noindex, nofollow"],
}
for path, items in required.items():
    text = load(path)
    for item in items:
        if item not in text:
            raise RuntimeError(f"Validação falhou em {path}: {item}")
    if text.count("</html>") != 1:
        raise RuntimeError(f"HTML incompleto em {path}")

for temp in [
    ".github/workflows/align-portal-copy.yml",
    ".github/workflows/finish-portal-alignment.yml",
    ".github/finish_portal.py",
    ".github/portal-alignment-trigger.txt",
    ".github/portal-alignment-error.txt",
]:
    Path(temp).unlink(missing_ok=True)
