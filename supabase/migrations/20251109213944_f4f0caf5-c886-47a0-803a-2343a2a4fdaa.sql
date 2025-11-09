-- Adicionar campo para armazenar as alternativas das perguntas
ALTER TABLE public.perguntas 
ADD COLUMN opcoes JSONB DEFAULT '[]'::jsonb;