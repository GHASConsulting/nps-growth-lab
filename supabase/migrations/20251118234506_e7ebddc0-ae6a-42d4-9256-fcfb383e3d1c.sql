-- Adiciona coluna resposta_grupo_id para agrupar respostas do mesmo envio
ALTER TABLE public.respostas 
ADD COLUMN resposta_grupo_id UUID NOT NULL DEFAULT gen_random_uuid();

-- Cria índice para melhorar performance de consultas agrupadas
CREATE INDEX idx_respostas_grupo_id ON public.respostas(resposta_grupo_id);