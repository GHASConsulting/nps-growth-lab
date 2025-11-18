-- Adicionar coluna para controlar se usuário precisa trocar senha
ALTER TABLE public.profiles 
ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT false;

-- Criar função para marcar troca de senha após criação/reset
CREATE OR REPLACE FUNCTION public.mark_password_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Marcar que precisa trocar senha quando for primeiro acesso
  NEW.must_change_password = true;
  RETURN NEW;
END;
$$;

-- Criar trigger para marcar novos usuários
CREATE TRIGGER on_profile_created
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.mark_password_change();