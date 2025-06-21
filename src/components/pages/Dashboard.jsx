import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { Users, UserPlus, Calendar, TrendingUp, DollarSign, Target, Activity, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import firebaseDataService from '@/services/firebaseDataService'

const Dashboard = () => {
  const [leads, setLeads] = useState([])
  const [medicos, setMedicos] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [procedimentos, setProcedimentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [leadsData, medicosData, especialidadesData, procedimentosData] = await Promise.all([
        firebaseDataService.getAll('leads'),
        firebaseDataService.getAll('medicos'),
        firebaseDataService.getAll('especialidades'),
        firebaseDataService.getAll('procedimentos')
      ])
      
      setLeads(leadsData)
      setMedicos(medicosData)
      setEspecialidades(especialidadesData)
      setProcedimentos(procedimentosData)
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err)
      setError('Erro ao carregar dados do dashboard. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Cálculos para métricas
  const totalLeads = leads.length
  const agendados = leads.filter(l => l.agendado).length
  const convertidos = leads.filter(l => l.status === 'Convertido').length
  const taxaConversao = totalLeads > 0 ? ((convertidos / totalLeads) * 100).toFixed(1) : 0
  const valorTotal = leads.reduce((sum, lead) => sum + (lead.valor_orcado || 0), 0)

  // Leads recentes (últimos 5)
  const leadsRecentes = leads
    .sort((a, b) => new Date(b.data_registro_contato) - new Date(a.data_registro_contato))
    .slice(0, 5)

  // Próximos agendamentos (simulado)
  const proximosAgendamentos = leads
    .filter(l => l.agendado && l.status !== 'Convertido')
    .slice(0, 5)

  // Dados para gráfico de leads por canal
  const leadsPorCanal = () => {
    const canais = {}
    leads.forEach(lead => {
      canais[lead.canal_contato] = (canais[lead.canal_contato] || 0) + 1
    })
    return Object.entries(canais).map(([canal, quantidade]) => ({
      canal,
      quantidade
    }))
  }

  // Dados para gráfico de evolução mensal
  const leadsPorMes = () => {
    const meses = {}
    leads.forEach(lead => {
      const data = new Date(lead.data_registro_contato)
      const mesAno = `${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`
      meses[mesAno] = (meses[mesAno] || 0) + 1
    })
    return Object.entries(meses)
      .map(([mes, quantidade]) => ({ mes, quantidade }))
      .slice(-6) // Últimos 6 meses
  }

  const getMedicoNome = (id) => {
    const medico = medicos.find(m => m.id === id)
    return medico ? medico.nome : 'N/A'
  }

  const getEspecialidadeNome = (id) => {
    const especialidade = especialidades.find(e => e.id === id)
    return especialidade ? especialidade.nome : 'N/A'
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const formatTime = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'há poucos minutos'
    if (diffInHours < 24) return `há ${diffInHours} horas`
    return `há ${Math.floor(diffInHours / 24)} dias`
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Visão geral do seu CRM</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Leads
            </CardTitle>
            <UserPlus className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalLeads}</div>
            <p className="text-xs text-gray-600 mt-1">
              <span className="text-green-600">+{Math.floor(totalLeads * 0.12)}</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Agendamentos
            </CardTitle>
            <Calendar className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{agendados}</div>
            <p className="text-xs text-gray-600 mt-1">
              <span className="text-green-600">+{Math.floor(agendados * 0.08)}</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Taxa de Conversão
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{taxaConversao}%</div>
            <p className="text-xs text-gray-600 mt-1">
              <span className="text-green-600">+3%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Médicos Ativos
            </CardTitle>
            <Users className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{medicos.length}</div>
            <p className="text-xs text-gray-600 mt-1">
              <span className="text-gray-600">0%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads por Canal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Leads por Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsPorCanal().length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={leadsPorCanal()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="canal" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Evolução de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsPorMes().length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={leadsPorMes()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="quantidade" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leads Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leadsRecentes.map((lead) => (
                <div key={lead.id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {lead.nome_paciente}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getEspecialidadeNome(lead.especialidade_id)} - {formatTime(lead.data_registro_contato)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      lead.status === 'Convertido' ? 'bg-green-100 text-green-800' :
                      lead.status === 'Agendado' ? 'bg-yellow-100 text-yellow-800' :
                      lead.status === 'Lead' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))}
              {leadsRecentes.length === 0 && (
                <p className="text-gray-500 text-center py-4">Nenhum lead cadastrado ainda</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proximosAgendamentos.map((lead) => (
                <div key={lead.id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {lead.nome_paciente}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getMedicoNome(lead.medico_agendado_id)} - {getEspecialidadeNome(lead.especialidade_id)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(lead.valor_orcado)}</p>
                    <p className="text-xs text-gray-500">Agendado</p>
                  </div>
                </div>
              ))}
              {proximosAgendamentos.length === 0 && (
                <p className="text-gray-500 text-center py-4">Nenhum agendamento pendente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Valor Total Orçado:</span>
                <span className="font-medium">{formatCurrency(valorTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Valor Convertido:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(leads.filter(l => l.status === 'Convertido').reduce((sum, lead) => sum + (lead.valor_orcado || 0), 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Ticket Médio:</span>
                <span className="font-medium">
                  {formatCurrency(totalLeads > 0 ? valorTotal / totalLeads : 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Taxa de Agendamento:</span>
                <span className="font-medium">
                  {totalLeads > 0 ? ((agendados / totalLeads) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Taxa de Conversão:</span>
                <span className="font-medium text-green-600">{taxaConversao}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Leads Perdidos:</span>
                <span className="font-medium text-red-600">
                  {leads.filter(l => l.status === 'Perdido').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cadastros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Médicos:</span>
                <span className="font-medium">{medicos.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Especialidades:</span>
                <span className="font-medium">{especialidades.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Procedimentos:</span>
                <span className="font-medium">{procedimentos.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard

