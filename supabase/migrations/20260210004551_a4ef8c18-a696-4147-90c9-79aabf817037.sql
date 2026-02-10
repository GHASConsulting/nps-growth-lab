
-- Atualizar política de SELECT em pesquisas para admins verem todas
DROP POLICY IF EXISTS "Usuários podem ver suas próprias pesquisas" ON public.pesquisas;
CREATE POLICY "Usuários podem ver suas próprias pesquisas ou admins veem todas"
  ON public.pesquisas FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Atualizar política de SELECT em respostas para admins verem todas
DROP POLICY IF EXISTS "Donos de pesquisas podem ver respostas" ON public.respostas;
CREATE POLICY "Donos de pesquisas ou admins podem ver respostas"
  ON public.respostas FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM pesquisas
      WHERE pesquisas.id = respostas.pesquisa_id
        AND pesquisas.user_id = auth.uid()
    )
  );

-- Atualizar política de SELECT em perguntas para admins verem todas
DROP POLICY IF EXISTS "Usuários podem ver perguntas de suas pesquisas" ON public.perguntas;
CREATE POLICY "Usuários podem ver perguntas de suas pesquisas ou admins veem todas"
  ON public.perguntas FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM pesquisas
      WHERE pesquisas.id = perguntas.pesquisa_id
        AND pesquisas.user_id = auth.uid()
    )
  );
