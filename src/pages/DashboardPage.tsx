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

const DashboardPage = () => {
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([]);
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);
  const [estatisticasNPS, setEstatisticasNPS] = useState({
    promotores: 0,
    passivos: 0,
    detratores: 0,
    total: 0
  });

  useEffect(() => {
    buscarRespostas();
    buscarPesquisas();
  }, []);

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
    
    setEstatisticasNPS({
      promotores,
      passivos,
      detratores,
      total: respostasComNota.length
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

  const categoriasDisponiveis = [...new Set(pesquisas.map(p => p.categoria).filter(Boolean))];

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <nav className="flex space-x-6 mb-8 border-b pb-4">
          <Link to="/pesquisas" className="text-black hover:underline hover:text-gray-600">
            Gestão de Pesquisa
          </Link>
          <Link to="/config" className="text-black hover:underline hover:text-gray-600">
            Administração
          </Link>
          <Link to="/integracoes" className="text-black hover:underline hover:text-gray-600">
            Integração
          </Link>
        </nav>
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
                  {categoriasDisponiveis.map((categoria) => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Gráfico de Notas NPS</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGrafico}>
                <XAxis dataKey="nota" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#5a89a3" />
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
              {respostasFiltradas.map((resposta) => (
                <div key={resposta.id} className="p-4 border rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <strong>Canal:</strong> {resposta.canal || 'N/A'}
                    </div>
                    <div>
                      <strong>Nota:</strong> {resposta.valor_numero || 'N/A'}
                    </div>
                    <div>
                      <strong>Data:</strong> {format(new Date(resposta.respondido_em), 'dd/MM/yyyy')}
                    </div>
                    <div>
                      <strong>Comentário:</strong> {resposta.valor_texto || 'N/A'}
                    </div>
                  </div>
                </div>
              ))}
              {respostasFiltradas.length === 0 && (
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