import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

interface Resposta {
  id: string;
  pesquisa_id: string;
  pergunta_id: string;
  valor_numero?: number;
  valor_texto?: string;
  valor_data?: string;
  respondido_em: string;
  canal?: string;
}

interface Pesquisa {
  id: string;
  nome: string;
  categoria?: string;
  ativa: boolean;
}

interface Categoria {
  id: string;
  nome: string;
  is_nps: boolean;
}

interface Pergunta {
  id: string;
  pesquisa_id: string;
  texto: string;
  ordem: number;
  tipo_resposta: string;
}

interface RespostaAgrupada {
  respondido_em: string;
  pesquisa_id: string;
  respostas: Map<string, Resposta>;
}

const DashboardPage = () => {
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);
  const [estatisticasNPS, setEstatisticasNPS] = useState({
    promotores: 0,
    passivos: 0,
    detratores: 0,
    total: 0,
    nps: 0
  });

  useEffect(() => {
    buscarRespostas();
    buscarPesquisas();
    buscarCategorias();
    buscarPerguntas();
  }, []);

  const buscarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  useEffect(() => {
    gerarDadosGrafico();
  }, [respostas, filtroNome, filtroEmpresa, filtroData, filtroCategoria]);

  const buscarRespostas = async () => {
    try {
      const { data, error } = await supabase
        .from('respostas')
        .select('*')
        .order('respondido_em', { ascending: false });

      if (error) throw error;
      setRespostas(data || []);
    } catch (error) {
      console.error('Erro ao buscar respostas:', error);
    }
  };

  const buscarPesquisas = async () => {
    try {
      const { data, error } = await supabase
        .from('pesquisas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPesquisas(data || []);
    } catch (error) {
      console.error('Erro ao buscar pesquisas:', error);
    }
  };

  const buscarPerguntas = async () => {
    try {
      const { data, error } = await supabase
        .from('perguntas')
        .select('*')
        .order('ordem');

      if (error) throw error;
      setPerguntas(data || []);
    } catch (error) {
      console.error('Erro ao buscar perguntas:', error);
    }
  };

  const gerarDadosGrafico = () => {
    const respostasFiltradas = respostas.filter(resposta => {
      const pesquisaDaResposta = pesquisas.find(p => p.id === resposta.pesquisa_id);
      const matchNome = !filtroNome || (resposta.canal && resposta.canal.toLowerCase().includes(filtroNome.toLowerCase()));
      const matchEmpresa = !filtroEmpresa || (resposta.canal && resposta.canal.toLowerCase().includes(filtroEmpresa.toLowerCase()));
      const matchData = !filtroData || resposta.respondido_em.includes(filtroData);
      const matchCategoria = !filtroCategoria || filtroCategoria === "todos" || (pesquisaDaResposta?.categoria && pesquisaDaResposta.categoria === filtroCategoria);
      return matchNome && matchEmpresa && matchData && matchCategoria;
    });

    const dadosNPS = Array.from({ length: 11 }, (_, i) => ({
      nota: i,
      quantidade: respostasFiltradas.filter(r => r.valor_numero === i).length
    }));

    setDadosGrafico(dadosNPS);

    // Calcular estatísticas NPS
    const respostasComNota = respostasFiltradas.filter(r => r.valor_numero !== null && r.valor_numero !== undefined);
    const promotores = respostasComNota.filter(r => r.valor_numero! >= 9).length;
    const passivos = respostasComNota.filter(r => r.valor_numero! >= 7 && r.valor_numero! <= 8).length;
    const detratores = respostasComNota.filter(r => r.valor_numero! <= 6).length;
    
    // Calcular NPS usando a fórmula: (Promotores - Detratores) / Total * 100
    const nps = respostasComNota.length > 0 ? Math.round(((promotores - detratores) / respostasComNota.length) * 100) : 0;
    
    setEstatisticasNPS({
      promotores,
      passivos,
      detratores,
      total: respostasComNota.length,
      nps
    });
  };

  const respostasFiltradas = respostas.filter(resposta => {
    const pesquisaDaResposta = pesquisas.find(p => p.id === resposta.pesquisa_id);
    const matchNome = !filtroNome || (resposta.canal && resposta.canal.toLowerCase().includes(filtroNome.toLowerCase()));
    const matchEmpresa = !filtroEmpresa || (resposta.canal && resposta.canal.toLowerCase().includes(filtroEmpresa.toLowerCase()));
    const matchData = !filtroData || resposta.respondido_em.includes(filtroData);
    const matchCategoria = !filtroCategoria || filtroCategoria === "todos" || (pesquisaDaResposta?.categoria && pesquisaDaResposta.categoria === filtroCategoria);
    return matchNome && matchEmpresa && matchData && matchCategoria;
  });

  // Agrupar respostas por sessão (pesquisa_id + respondido_em)
  const respostasAgrupadas: RespostaAgrupada[] = [];
  const gruposMap = new Map<string, RespostaAgrupada>();

  respostasFiltradas.forEach(resposta => {
    const chaveGrupo = `${resposta.pesquisa_id}_${resposta.respondido_em}`;
    
    if (!gruposMap.has(chaveGrupo)) {
      gruposMap.set(chaveGrupo, {
        respondido_em: resposta.respondido_em,
        pesquisa_id: resposta.pesquisa_id,
        respostas: new Map()
      });
    }
    
    const grupo = gruposMap.get(chaveGrupo)!;
    grupo.respostas.set(resposta.pergunta_id, resposta);
  });

  respostasAgrupadas.push(...Array.from(gruposMap.values()));

  // Verificar se a categoria selecionada é do tipo NPS
  const categoriaAtual = categorias.find(cat => cat.nome === filtroCategoria);
  const isCategoriaNPS = categoriaAtual?.is_nps || false;

  // Determinar cor do NPS baseado no valor
  const getCorNPS = (nps: number) => {
    if (nps < 0) return "text-red-600";       // Zona crítica
    if (nps <= 49) return "text-yellow-600";  // Zona de aperfeiçoamento
    if (nps <= 74) return "text-blue-600";    // Zona de qualidade
    return "text-green-600";                   // Zona de excelência
  };

  // Determinar zona do NPS
  const getZonaNPS = (nps: number) => {
    if (nps < 0) return "Zona Crítica";
    if (nps <= 49) return "Zona de Aperfeiçoamento";
    if (nps <= 74) return "Zona de Qualidade";
    return "Zona de Excelência";
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-6xl mx-auto space-y-6 p-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-xl font-semibold">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input 
                placeholder="Filtrar por Nome" 
                value={filtroNome} 
                onChange={(e) => setFiltroNome(e.target.value)} 
              />
              <Input 
                placeholder="Filtrar por Empresa" 
                value={filtroEmpresa} 
                onChange={(e) => setFiltroEmpresa(e.target.value)} 
              />
              <Input 
                type="date" 
                placeholder="Filtrar por Data" 
                value={filtroData} 
                onChange={(e) => setFiltroData(e.target.value)} 
              />
              <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as categorias</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.nome}>
                      {categoria.nome} {categoria.is_nps && '(NPS)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Indicador de NPS - só aparece se categoria selecionada for NPS */}
        {isCategoriaNPS && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Indicador NPS</h2>
              <div className="text-center">
                <div className={`text-6xl font-bold ${getCorNPS(estatisticasNPS.nps)}`}>
                  {estatisticasNPS.nps}
                </div>
                <div className="text-lg text-gray-600 mt-2">
                  Net Promoter Score
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {getZonaNPS(estatisticasNPS.nps)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Gráfico de Notas NPS</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGrafico}>
                <XAxis dataKey="nota" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#FB6E2E" />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Legenda NPS */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{estatisticasNPS.promotores}</div>
                <div className="text-sm text-gray-600">Promotores (9-10)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{estatisticasNPS.passivos}</div>
                <div className="text-sm text-gray-600">Passivos (7-8)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{estatisticasNPS.detratores}</div>
                <div className="text-sm text-gray-600">Detratores (0-6)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{estatisticasNPS.total}</div>
                <div className="text-sm text-gray-600">Total de Respostas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-xl font-semibold">Respostas Filtradas</h2>
            <div className="space-y-4">
              {respostasAgrupadas.map((grupo, index) => {
                const perguntasDaPesquisa = perguntas
                  .filter(p => p.pesquisa_id === grupo.pesquisa_id)
                  .sort((a, b) => a.ordem - b.ordem);

                return (
                  <div key={`${grupo.pesquisa_id}_${grupo.respondido_em}_${index}`} className="p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex gap-4 mb-3 pb-3 border-b">
                        <div>
                          <strong>Data do Registro:</strong> {format(new Date(grupo.respondido_em), 'dd/MM/yyyy HH:mm')}
                        </div>
                        {/* Mostrar Nota se existir uma pergunta NPS */}
                        {Array.from(grupo.respostas.values()).find(r => r.valor_numero !== null && r.valor_numero !== undefined) && (
                          <div>
                            <strong>Nota:</strong> {Array.from(grupo.respostas.values()).find(r => r.valor_numero !== null && r.valor_numero !== undefined)?.valor_numero}
                          </div>
                        )}
                      </div>
                      
                      {perguntasDaPesquisa.map((pergunta, idx) => {
                        const resposta = grupo.respostas.get(pergunta.id);
                        let valorResposta = 'N/A';
                        
                        if (resposta) {
                          if (resposta.valor_texto) valorResposta = resposta.valor_texto;
                          else if (resposta.valor_numero !== null && resposta.valor_numero !== undefined) valorResposta = String(resposta.valor_numero);
                          else if (resposta.valor_data) valorResposta = format(new Date(resposta.valor_data), 'dd/MM/yyyy');
                        }
                        
                        return (
                          <div key={pergunta.id}>
                            <strong>Pergunta {idx + 1}:</strong> {pergunta.texto}
                            <div className="ml-4 text-gray-600">{valorResposta}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {respostasAgrupadas.length === 0 && (
                <p className="text-gray-500 text-center py-8">Nenhuma resposta encontrada.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;