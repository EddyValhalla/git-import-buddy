CREATE TABLE public.crossell_matriz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedimento_origem_id UUID REFERENCES public.procedimentos(id) ON DELETE CASCADE,
  procedimento_sugerido_id UUID REFERENCES public.procedimentos(id) ON DELETE CASCADE,
  delay_dias INTEGER NOT NULL DEFAULT 30,
  mensagem_template TEXT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crossell_matriz TO authenticated;
GRANT ALL ON public.crossell_matriz TO service_role;

ALTER TABLE public.crossell_matriz ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated manage crossell_matriz"
  ON public.crossell_matriz FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE TRIGGER trg_crossell_matriz_updated_at
  BEFORE UPDATE ON public.crossell_matriz
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX idx_crossell_matriz_origem ON public.crossell_matriz (procedimento_origem_id);
