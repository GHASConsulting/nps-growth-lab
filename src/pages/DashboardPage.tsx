import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const DashboardPage = () => {
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroData, setFiltroData] = useState("");
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);

  useEffect(() => {
    buscarRespostas();
  }, []);

  useEffect(() => {
    gerarDadosGrafico();
  }, [respostas, filtroNome, filtroEmpresa, filtroData]);

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

  const gerarDadosGrafico = () => {
    const respostasFiltradas = respostas.filter(resposta => {
      const matchNome = !filtroNome || (resposta.canal && resposta.canal.toLowerCase().includes(filtroNome.toLowerCase()));
      const matchEmpresa = !filtroEmpresa || (resposta.canal && resposta.canal.toLowerCase().includes(filtroEmpresa.toLowerCase()));
      const matchData = !filtroData || resposta.respondido_em.includes(filtroData);
      return matchNome && matchEmpresa && matchData;
    });

    const dadosNPS = Array.from({ length: 11 }, (_, i) => ({
      nota: i,
      quantidade: respostasFiltradas.filter(r => r.valor_numero === i).length
    }));

    setDadosGrafico(dadosNPS);
  };

  const respostasFiltradas = respostas.filter(resposta => {
    const matchNome = !filtroNome || (resposta.canal && resposta.canal.toLowerCase().includes(filtroNome.toLowerCase()));
    const matchEmpresa = !filtroEmpresa || (resposta.canal && resposta.canal.toLowerCase().includes(filtroEmpresa.toLowerCase()));
    const matchData = !filtroData || resposta.respondido_em.includes(filtroData);
    return matchNome && matchEmpresa && matchData;
  });

  return (
    <div className="min-h-screen bg-white text-black p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-xl font-semibold">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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