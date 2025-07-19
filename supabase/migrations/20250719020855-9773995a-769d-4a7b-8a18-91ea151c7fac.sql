-- Atualizar tabela pesquisas (remover campos antigos e adicionar novos)
ALTER TABLE public.pesquisas 
DROP COLUMN pergunta,
DROP COLUMN agradecimento,
DROP COLUMN followup,
DROP COLUMN categoria;

ALTER TABLE public.pesquisas 
ADD COLUMN descricao TEXT;

-- Criar tabela de perguntas
CREATE TABLE public.perguntas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pesquisa_id UUID NOT NULL REFERENCES public.pesquisas(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  tipo_resposta TEXT NOT NULL CHECK (tipo_resposta IN ('numero', 'campo', 'data')),
  ordem INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Recrear tabela respostas com nova estrutura
DROP TABLE public.respostas;

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

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.perguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respostas ENABLE ROW LEVEL SECURITY;

-- Políticas para perguntas
CREATE POLICY "Donos de pesquisas podem ver perguntas" 
ON public.perguntas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.pesquisas 
    WHERE pesquisas.id = perguntas.pesquisa_id 
    AND pesquisas.user_id = auth.uid()
  )
);

CREATE POLICY "Donos de pesquisas podem criar perguntas" 
ON public.perguntas 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pesquisas 
    WHERE pesquisas.id = perguntas.pesquisa_id 
    AND pesquisas.user_id = auth.uid()
  )
);

CREATE POLICY "Donos de pesquisas podem atualizar perguntas" 
ON public.perguntas 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.pesquisas 
    WHERE pesquisas.id = perguntas.pesquisa_id 
    AND pesquisas.user_id = auth.uid()
  )
);

CREATE POLICY "Donos de pesquisas podem deletar perguntas" 
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

-- Política para permitir acesso público às perguntas (para responder pesquisas)
CREATE POLICY "Perguntas de pesquisas ativas são públicas" 
ON public.perguntas 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.pesquisas 
    WHERE pesquisas.id = perguntas.pesquisa_id 
    AND pesquisas.ativa = true
  )
);

-- Índices para melhor performance
CREATE INDEX idx_perguntas_pesquisa_id ON public.perguntas(pesquisa_id);
CREATE INDEX idx_perguntas_ordem ON public.perguntas(pesquisa_id, ordem);
CREATE INDEX idx_respostas_pesquisa_id ON public.respostas(pesquisa_id);
CREATE INDEX idx_respostas_pergunta_id ON public.respostas(pergunta_id);