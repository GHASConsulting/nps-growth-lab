-- Inserir o primeiro admin manualmente (usando o ID do usuário que já existe)
-- Este é o usuário gustavo.melo@ghas.com.br
INSERT INTO public.user_roles (user_id, role)
VALUES ('87ae6394-5c85-4fc5-bd96-34622ae9ba53', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Criar profile para o usuário existente se não existir
INSERT INTO public.profiles (id, full_name)
VALUES ('87ae6394-5c85-4fc5-bd96-34622ae9ba53', 'Gustavo Melo')
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;