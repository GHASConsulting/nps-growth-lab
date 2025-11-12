-- Adicionar campos de flags na tabela perguntas
ALTER TABLE public.perguntas 
ADD COLUMN is_nome_responsavel boolean NOT NULL DEFAULT false,
ADD COLUMN is_instituicao boolean NOT NULL DEFAULT false;