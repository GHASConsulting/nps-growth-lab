-- Remover a constraint antiga
ALTER TABLE public.perguntas 
DROP CONSTRAINT IF EXISTS perguntas_tipo_resposta_check;

-- Adicionar nova constraint com todos os tipos de resposta
ALTER TABLE public.perguntas 
ADD CONSTRAINT perguntas_tipo_resposta_check 
CHECK (tipo_resposta IN ('numero', 'campo', 'texto_numerico', 'data', 'radio', 'checkbox'));