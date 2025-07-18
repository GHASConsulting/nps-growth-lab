-- Criar tabela de pesquisas
CREATE TABLE public.pesquisas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  pergunta TEXT NOT NULL,
  agradecimento TEXT,
  followup TEXT,
  categoria TEXT,
  periodicidade TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de respostas
CREATE TABLE public.respostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pesquisa_id UUID NOT NULL REFERENCES public.pesquisas(id) ON DELETE CASCADE,
  nota INTEGER NOT NULL CHECK (nota >= 0 AND nota <= 10),
  comentario TEXT,
  canal TEXT,
  respondido_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pesquisas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;

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
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamps
CREATE TRIGGER update_pesquisas_updated_at
  BEFORE UPDATE ON public.pesquisas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();