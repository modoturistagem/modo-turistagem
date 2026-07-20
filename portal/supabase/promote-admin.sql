-- Rode depois de criar o seu usuário em Authentication > Users.
-- Troque o e-mail abaixo pelo e-mail que você usa para entrar no portal.
update public.profiles
set is_admin = true
where lower(email) = lower('modoturistagem@gmail.com');

-- Confirmação:
select email, is_admin from public.profiles where is_admin = true;
