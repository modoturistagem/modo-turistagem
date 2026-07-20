# Portal de Roteiros — Modo Turistagem

Sistema reutilizável para publicar roteiros sem diagramar cada página no Figma.

## O que já existe

- login com e-mail e senha;
- criação de senha no primeiro acesso;
- acesso por link mágico;
- demonstração pública resumida;
- biblioteca individual de roteiros;
- template responsivo com sumário e impressão em PDF;
- painel administrativo para importar, visualizar, salvar e liberar roteiros;
- Supabase Auth + banco + Row Level Security para cada cliente ver somente o que comprou.

## Demonstração pública x roteiro completo

A demonstração fica em `data/andes-na-janela.preview.js` e pode ser vista sem login.

O roteiro completo **não deve ser salvo no GitHub público**. Ele é entregue em um arquivo JSON privado, importado pelo painel administrativo e salvo na tabela `itineraries` do Supabase. Assim, o navegador só recebe o conteúdo integral depois de autenticar o usuário e confirmar o acesso pelas políticas RLS.

## Ativar o login real

1. Crie um projeto no Supabase.
2. Rode `supabase/schema.sql` no SQL Editor.
3. Preencha `js/config.js` com a Project URL e a chave pública `anon`/`publishable`.
4. Em Authentication > URL Configuration, adicione:

```text
https://modoturistagem.github.io/modo-turistagem/portal/
https://modoturistagem.github.io/modo-turistagem/portal/dashboard.html
```

5. Crie sua conta pela opção **Primeiro acesso? Criar minha senha**.
6. Rode `supabase/promote-admin.sql`, trocando o e-mail pelo seu.
7. Entre em `portal/admin.html`.
8. Clique em **Importar JSON privado**, escolha o arquivo completo e abra a prévia.
9. Clique em **Salvar no portal protegido**.
10. No bloco **Liberar roteiro**, informe o e-mail do cliente e o slug do produto.

## Tipos de conteúdo

- `cards`
- `budget`
- `reservations`
- `days`
- `options`
- `links`
- `checklist`
- `closing`
- `pages` — usado para importar materiais longos completos preservando a sequência original.

## Segurança

- não existe senha fixa no JavaScript;
- a chave `service_role` nunca deve ir para o GitHub ou para `config.js`;
- use somente a chave pública `anon` ou `publishable` no navegador;
- o conteúdo integral fica no Supabase com RLS;
- guarde os arquivos JSON completos fora do repositório público;
- a demonstração é propositalmente resumida.
