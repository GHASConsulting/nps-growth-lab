import React, { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function LovableNPS() {
  const [pesquisas, setPesquisas] = useState([]);
  const [respostas, setRespostas] = useState([]);

  const [nome, setNome] = useState("");
  const [pergunta, setPergunta] = useState("");
  const [agradecimento, setAgradecimento] = useState("");
  const [followup, setFollowup] = useState("");
  const [categoria, setCategoria] = useState("");
  const [periodicidade, setPeriodicidade] = useState("");

  const [filtroNome, setFiltroNome] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");
  const [filtroData, setFiltroData] = useState("");

  const [novaResposta, setNovaResposta] = useState({ nota: "", comentario: "", nome: "", empresa: "" });

  useEffect(() => {
    const saved = localStorage.getItem("pesquisas");
    if (saved) setPesquisas(JSON.parse(saved));
    const savedResp = localStorage.getItem("respostas");
    if (savedResp) setRespostas(JSON.parse(savedResp));
  }, []);

  useEffect(() => {
    localStorage.setItem("pesquisas", JSON.stringify(pesquisas));
    localStorage.setItem("respostas", JSON.stringify(respostas));
  }, [pesquisas, respostas]);

  const salvarPesquisa = () => {
    const novaPesquisa = {
      id: Date.now(),
      nome,
      pergunta,
      agradecimento,
      followup,
      categoria,
      periodicidade,
      criado_em: new Date().toISOString(),
    };
    setPesquisas([...pesquisas, novaPesquisa]);
    setNome("");
    setPergunta("");
    setAgradecimento("");
    setFollowup("");
    setCategoria("");
    setPeriodicidade("");
  };

  const enviarResposta = () => {
    const nova = {
      ...novaResposta,
      nota: parseInt(novaResposta.nota),
      respondido_em: new Date().toISOString(),
    };
    setRespostas([...respostas, nova]);
    setNovaResposta({ nota: "", comentario: "", nome: "", empresa: "" });
  };

  const respostasFiltradas = respostas.filter((r) => {
    return (
      (!filtroNome || r.nome?.toLowerCase().includes(filtroNome.toLowerCase())) &&
      (!filtroEmpresa || r.empresa?.toLowerCase().includes(filtroEmpresa.toLowerCase())) &&
      (!filtroData || format(new Date(r.respondido_em), "yyyy-MM-dd") === filtroData)
    );
  });

  return (
    <div className="min-h-screen bg-white text-black">
      <nav className="p-4 border-b flex gap-6 text-lg font-medium">
        <Link to="/pesquisas" className="hover:underline">Gestão de Pesquisas</Link>
        <Link to="/dashboard" className="hover:underline">Dashboard</Link>
        <Link to="/config" className="hover:underline">Administração</Link>
        <Link to="/integracoes" className="hover:underline">Integrações</Link>
      </nav>

      <Routes>
        <Route path="/pesquisas" element={
          <Card className="m-6">
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-xl font-semibold">Criar Pesquisa</h2>
              <Input placeholder="Nome da Pesquisa" value={nome} onChange={(e) => setNome(e.target.value)} />
              <Textarea placeholder="Pergunta NPS" value={pergunta} onChange={(e) => setPergunta(e.target.value)} />
              <Textarea placeholder="Mensagem de Agradecimento" value={agradecimento} onChange={(e) => setAgradecimento(e.target.value)} />
              <Textarea placeholder="Pergunta de Follow-up" value={followup} onChange={(e) => setFollowup(e.target.value)} />
              <Input placeholder="Categoria / Setor" value={categoria} onChange={(e) => setCategoria(e.target.value)} />
              <Select value={periodicidade} onValueChange={setPeriodicidade}>
                <SelectTrigger><SelectValue placeholder="Periodicidade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unica">Única</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="trimestral">Trimestral</SelectItem>
                </SelectContent>
              </Select>
              <Button className="w-full bg-[#5a89a3] text-white" onClick={salvarPesquisa}>Salvar Pesquisa</Button>

              <h2 className="text-xl font-semibold mt-8">Pesquisas Cadastradas</h2>
              <Input placeholder="Filtrar por Nome" value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} />
              <Input placeholder="Filtrar por Empresa" value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)} />
              <Input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} />
              {pesquisas.map((p, i) => (
                <div key={i} className="border rounded p-3">
                  <p><strong>{p.nome}</strong> - {p.pergunta}</p>
                  <p><small>Criado em: {format(new Date(p.criado_em), "dd/MM/yyyy")}</small></p>
                </div>
              ))}
            </CardContent>
          </Card>
        } />

        <Route path="/dashboard" element={
          <Card className="m-6">
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-xl font-semibold">Dashboard</h2>
              <Input placeholder="Filtrar por Nome" value={filtroNome} onChange={(e) => setFiltroNome(e.target.value)} />
              <Input placeholder="Filtrar por Empresa" value={filtroEmpresa} onChange={(e) => setFiltroEmpresa(e.target.value)} />
              <Input type="date" value={filtroData} onChange={(e) => setFiltroData(e.target.value)} />

              <h3 className="text-lg font-medium">Gráfico NPS</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={respostasFiltradas.reduce((acc, r) => {
                  const existing = acc.find(e => e.nota === r.nota?.toString());
                  if (existing) existing.total++;
                  else acc.push({ nota: r.nota?.toString(), total: 1 });
                  return acc;
                }, [])}>
                  <XAxis dataKey="nota" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#5a89a3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>

              <h3 className="text-lg font-medium">Respostas Individuais</h3>
              {respostasFiltradas.map((r, i) => (
                <div key={i} className="border p-3 rounded-md">
                  <p><strong>Nome:</strong> {r.nome}</p>
                  <p><strong>Empresa:</strong> {r.empresa}</p>
                  <p><strong>Nota:</strong> {r.nota}</p>
                  <p><strong>Comentário:</strong> {r.comentario}</p>
                  <p><strong>Data:</strong> {format(new Date(r.respondido_em), "dd/MM/yyyy HH:mm")}</p>
                </div>
              ))}

              <h3 className="text-lg font-medium pt-6">Nova Resposta (Simulação)</h3>
              <Input type="number" placeholder="Nota (0-10)" value={novaResposta.nota} onChange={(e) => setNovaResposta({ ...novaResposta, nota: e.target.value })} />
              <Textarea placeholder="Comentário" value={novaResposta.comentario} onChange={(e) => setNovaResposta({ ...novaResposta, comentario: e.target.value })} />
              <Input placeholder="Seu nome" value={novaResposta.nome} onChange={(e) => setNovaResposta({ ...novaResposta, nome: e.target.value })} />
              <Input placeholder="Empresa" value={novaResposta.empresa} onChange={(e) => setNovaResposta({ ...novaResposta, empresa: e.target.value })} />
              <Button className="bg-[#5a89a3] text-white" onClick={enviarResposta}>Enviar</Button>
            </CardContent>
          </Card>
        } />

        <Route path="/config" element={
          <Card className="m-6">
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-xl font-semibold">Administração</h2>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configurações Gerais</h3>
                <Input placeholder="Nome da Empresa" />
                <Input placeholder="Logotipo da empresa (URL)" />
                <Textarea placeholder="Mensagem personalizada de boas-vindas" />
                <Input placeholder="E-mail de contato para suporte" />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personalização Visual</h3>
                <Input placeholder="Cor primária (hex - ex: #5a89a3)" />
                <Input placeholder="Cor secundária (hex)" />
                <Input placeholder="URL do favicon" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Tema padrão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claro">Claro</SelectItem>
                    <SelectItem value="escuro">Escuro</SelectItem>
                    <SelectItem value="auto">Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Gestão de Usuários</h3>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seu nível de acesso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="leitor">Somente Leitura</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Convidar usuário por e-mail" />
                <Button variant="outline">Enviar Convite</Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Configurações de Notificação</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span>Notificar por e-mail sobre novas respostas</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span>Relatório semanal automático</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span>Alertas de NPS baixo</span>
                  </label>
                </div>
              </div>

              <Button className="w-full bg-[#5a89a3] text-white">Salvar Configurações</Button>
            </CardContent>
          </Card>
        } />
        <Route path="/integracoes" element={
          <Card className="m-6">
            <CardContent className="space-y-4 pt-6">
              <h2 className="text-xl font-semibold">Integrações</h2>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Automação e Webhooks</h3>
                <Input placeholder="URL de Webhook (ex: Zapier/Make)" />
                <Input placeholder="Token de autenticação" />
                <Button variant="outline">Testar Webhook</Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Integração com CRM/ERP</h3>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o sistema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salesforce">Salesforce</SelectItem>
                    <SelectItem value="hubspot">HubSpot</SelectItem>
                    <SelectItem value="pipedrive">Pipedrive</SelectItem>
                    <SelectItem value="sap">SAP</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Chave da API" />
                <Input placeholder="URL do endpoint" />
                <Button variant="outline">Conectar Sistema</Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">E-mail Marketing</h3>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Plataforma de e-mail" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mailchimp">MailChimp</SelectItem>
                    <SelectItem value="sendinblue">Sendinblue</SelectItem>
                    <SelectItem value="constant-contact">Constant Contact</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Chave da API de e-mail" />
                <Button variant="outline">Conectar E-mail</Button>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Relatórios e BI</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span>Integração com Google Analytics</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span>Exportar para Power BI</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" />
                    <span>Conectar com Tableau</span>
                  </label>
                </div>
                <Input placeholder="Token de integração com BI" />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Status das Integrações</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span>Webhook Principal</span>
                    <span className="text-green-600">✓ Conectado</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span>CRM</span>
                    <span className="text-red-600">✗ Desconectado</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded">
                    <span>E-mail Marketing</span>
                    <span className="text-yellow-600">⚠ Configuração Pendente</span>
                  </div>
                </div>
              </div>

              <Button className="w-full bg-[#5a89a3] text-white">Salvar Integrações</Button>
            </CardContent>
          </Card>
        } />
      </Routes>
    </div>
  );
}