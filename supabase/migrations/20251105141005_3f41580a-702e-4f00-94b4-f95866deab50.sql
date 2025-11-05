-- Criar tabela de categorias
CREATE TABLE public.categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  is_nps BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de pesquisas
CREATE TABLE public.pesquisas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  periodicidade TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de perguntas
CREATE TABLE public.perguntas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pesquisa_id UUID NOT NULL REFERENCES public.pesquisas(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  tipo_resposta TEXT NOT NULL CHECK (tipo_resposta = ANY (ARRAY['numero'::text, 'campo'::text, 'data'::text])),
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de respostas
CREATE TABLE public.respostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pesquisa_id UUID NOT NULL REFERENCES public.pesquisas(id) ON DELETE CASCADE,
  pergunta_id UUID NOT NULL REFERENCES public.perguntas(id) ON DELETE CASCADE,
  valor_numero INTEGER,
  valor_texto TEXT,
  valor_data DATE,
  canal TEXT,
  respondido_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pesquisas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias
CREATE POLICY "Usuários podem ver suas próprias categorias" 
ON public.categorias 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias categorias" 
ON public.categorias 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias categorias" 
ON public.categorias 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias categorias" 
ON public.categorias 
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para pesquisas
CREATE POLICY "Usuários podem ver suas próprias pesquisas" 
ON public.pesquisas 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias pesquisas" 
ON public.pesquisas 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias pesquisas" 
ON public.pesquisas 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias pesquisas" 
ON public.pesquisas 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Pesquisas ativas são públicas" 
ON public.pesquisas 
FOR SELECT 
USING (ativa = true);

-- Políticas para perguntas
CREATE POLICY "Usuários podem ver perguntas de suas pesquisas" 
ON public.perguntas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.pesquisas 
    WHERE pesquisas.id = perguntas.pesquisa_id 
    AND pesquisas.user_id = auth.uid()
  )
);

CREATE POLICY "Qualquer um pode ver perguntas de pesquisas ativas" 
ON public.perguntas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.pesquisas 
    WHERE pesquisas.id = perguntas.pesquisa_id 
    AND pesquisas.ativa = true
  )
);

CREATE POLICY "Usuários podem criar perguntas em suas pesquisas" 
ON public.perguntas 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pesquisas 
    WHERE pesquisas.id = perguntas.pesquisa_id 
    AND pesquisas.user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem atualizar perguntas de suas pesquisas" 
ON public.perguntas 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.pesquisas 
    WHERE pesquisas.id = perguntas.pesquisa_id 
    AND pesquisas.user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem deletar perguntas de suas pesquisas" 
ON public.perguntas 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.pesquisas 
    WHERE pesquisas.id = perguntas.pesquisa_id 
    AND pesquisas.user_id = auth.uid()
  )
);

-- Políticas para respostas
CREATE POLICY "Donos de pesquisas podem ver respostas" 
ON public.respostas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.pesquisas 
    WHERE pesquisas.id = respostas.pesquisa_id 
    AND pesquisas.user_id = auth.uid()
  )
);

CREATE POLICY "Qualquer um pode inserir respostas" 
ON public.respostas 
FOR INSERT 
WITH CHECK (true);

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers para atualizar timestamps
CREATE TRIGGER update_categorias_updated_at
  BEFORE UPDATE ON public.categorias
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pesquisas_updated_at
  BEFORE UPDATE ON public.pesquisas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();