# Portal de Roteiros — Modo Turistagem

Sistema reutilizável para publicar roteiros sem diagramar cada página no Figma.

## O que já existe

- login com usuário e senha criados pela administradora;
- nenhum cadastro público;
- demonstração pública resumida;
- biblioteca individual de roteiros;
- template responsivo com sumário e impressão em PDF;
- painel administrativo para importar, visualizar, salvar e liberar roteiros;
- criação segura de contas por Supabase Edge Function;
- Supabase Auth + banco + Row Level Security para cada cliente ver somente o que comprou.

## Demonstração pública x roteiro completo

A demonstração fica em `data/andes-na-janela.preview.js` e pode ser vista sem login.

O roteiro completo **não deve ser salvo no GitHub público**. Ele é entregue em um arquivo JSON privado, importado pelo painel administrativo e salvo na tabela `itineraries` do Supabase. Assim, o navegador só recebe o conteúdo integral depois de autenticar o usuário e confirmar o acesso pelas políticas RLS.

## Modelo de acesso

O cliente não cria conta e não usa link mágico. A Modo Turistagem gera:

```text
Usuário: maria.silva
Senha: senha-gerada-pela-modo
```

Internamente, o Supabase usa um e-mail técnico que o cliente nunca precisa ver. O portal transforma o nome de usuário nesse identificador antes de fazer o login.

## Ativação

1. Rode `portal/supabase/schema.sql` no SQL Editor.
2. Caso apareça erro de política já existente, rode `portal/supabase/reparar-politicas.sql` e depois execute o `schema.sql` novamente.
3. Rode `portal/supabase/admin-generated-access.sql`.
4. Em **Authentication > Users**, crie manualmente a primeira conta de administradora usando seu e-mail real e uma senha forte.
5. Rode `portal/supabase/promote-admin.sql`, trocando o e-mail pelo seu.
6. Em **Authentication > Providers > Email**, desative **Allow new users to sign up**. Apenas contas já criadas poderão entrar.
7. Publique a função `supabase/functions/create-client/index.ts` com o nome `create-client`.
8. Entre em `portal/admin.html` usando seu e-mail real no campo de usuário e sua senha.
9. Importe o JSON privado, confira a prévia e salve o roteiro.
10. Use **Criar usuário e senha** para gerar o acesso do cliente e liberar o roteiro na mesma ação.

## Publicar a Edge Function

Pelo Supabase Dashboard:

1. Abra **Edge Functions**.
2. Crie uma função chamada `create-client`.
3. Copie o conteúdo de `supabase/functions/create-client/index.ts`.
4. Publique mantendo a verificação de JWT ativada.

A função recebe a sessão da administradora, confirma `is_admin = true` e só então usa a chave secreta disponível no ambiente seguro do Supabase para criar o usuário. A chave secreta nunca vai para o navegador ou para o GitHub.

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

- o público não consegue se cadastrar;
- a criação de usuários acontece somente na Edge Function;
- `auth.admin.createUser()` nunca é chamado no navegador;
- a chave secreta nunca deve ir para `config.js`;
- use somente a chave pública `anon` ou `publishable` no navegador;
- o conteúdo integral fica no Supabase com RLS;
- guarde os arquivos JSON completos fora do repositório público;
- a demonstração é propositalmente resumida.
