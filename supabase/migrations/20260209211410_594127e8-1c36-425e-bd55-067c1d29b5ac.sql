
-- Drop existing RLS policies first
DROP POLICY IF EXISTS "Usuários podem ver suas próprias categorias" ON public.categorias;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias categorias" ON public.categorias;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias categorias" ON public.categorias;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias categorias" ON public.categorias;

-- Now remove user_id column
ALTER TABLE public.categorias DROP COLUMN user_id;

-- New policies: all authenticated can read, admins can manage
CREATE POLICY "Todos autenticados podem ver categorias"
ON public.categorias FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins podem criar categorias"
ON public.categorias FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem atualizar categorias"
ON public.categorias FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem deletar categorias"
ON public.categorias FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));
