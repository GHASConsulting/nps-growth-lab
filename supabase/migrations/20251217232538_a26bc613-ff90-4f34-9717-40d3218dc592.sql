-- Add enviar_para_gpt column to perguntas table
ALTER TABLE public.perguntas 
ADD COLUMN enviar_para_gpt boolean NOT NULL DEFAULT false;