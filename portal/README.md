# Portal de Roteiros — Modo Turistagem

Sistema reutilizável para publicar roteiros sem diagramar cada página no Figma.

## Já incluído

- login com senha e link mágico;
- demonstração navegável sem banco;
- biblioteca individual de roteiros;
- template responsivo com sumário, cards, dias, opções, links e checklist;
- botão para imprimir ou salvar em PDF usando o mesmo conteúdo;
- painel administrativo para editar, visualizar e publicar;
- Supabase Auth + banco + Row Level Security para acesso individual.

## Ativação do login real

1. Crie um projeto no Supabase.
2. Rode `supabase/schema.sql` no SQL Editor.
3. Preencha `js/config.js` usando `js/config.example.js` como modelo.
4. Em Authentication > URL Configuration, adicione a URL do portal aos Redirect URLs.
5. Crie sua conta pelo portal e torne-a administradora:

```sql
update public.profiles set is_admin = true where email = 'SEU-EMAIL';
```

6. Entre em `portal/admin.html`, carregue o exemplo e salve o primeiro roteiro.
7. O cliente entra uma vez com link mágico; depois o acesso é liberado pelo e-mail no painel.

## Sem mexer em CSS

O design está em `css/portal.css`. Cada roteiro é apenas conteúdo estruturado. Tipos prontos:

- `cards`
- `budget`
- `reservations`
- `days`
- `options`
- `links`
- `checklist`
- `closing`

Para criar outro destino, use o exemplo de Santiago como base, troque os textos e reordene os blocos. O portal monta a página, a versão mobile e a impressão automaticamente.

## Segurança

Não existe senha fixa no JavaScript. O acesso real depende do Supabase Auth e das políticas RLS. O modo demonstração é apenas uma amostra pública do produto.