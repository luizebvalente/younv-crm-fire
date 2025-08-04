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
  LineChart,
  Line
} from 'recharts'
import { Users, UserPlus, Calendar, TrendingUp, DollarSign, Target, Activity, Loader2, Zap } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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

  // NOVO: Cálculo de leads cadastrados hoje
const leadsHoje = leads.filter(lead => {
  if (!lead.data_registro_contato) return false
  
  try {
    const hoje = new Date()
    const dataLead = new Date(lead.data_registro_contato)
    
    // CORREÇÃO: Normalizar as datas para comparação (sem horário)
    const hojeNormalizada = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
    const dataLeadNormalizada = new Date(dataLead.getFullYear(), dataLead.getMonth(), dataLead.getDate())
    
    // Comparar apenas a data (ignorar horário)
    return hojeNormalizada.getTime() === dataLeadNormalizada.getTime()
  } catch (error) {
    console.warn('Erro ao processar data do lead:', lead.data_registro_contato, error)
    return false
  }
}).length

  // NOVO: Cálculo de leads cadastrados ontem para comparação
const leadsOntem = leads.filter(lead => {
  if (!lead.data_registro_contato) return false
  
  try {
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)
    const dataLead = new Date(lead.data_registro_contato)
    
    // CORREÇÃO: Normalizar as datas para comparação (sem horário)
    const ontemNormalizada = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate())
    const dataLeadNormalizada = new Date(dataLead.getFullYear(), dataLead.getMonth(), dataLead.getDate())
    
    return ontemNormalizada.getTime() === dataLeadNormalizada.getTime()
  } catch (error) {
    console.warn('Erro ao processar data do lead para ontem:', lead.data_registro_contato, error)
    return false
  }
}).length
  // NOVO: Cálculo da diferença entre hoje e ontem
  const diferencaHojeOntem = leadsHoje - leadsOntem

console.log('📊 Estatísticas de leads:', {
  hoje: leadsHoje,
  ontem: leadsOntem,
  diferenca: diferencaHojeOntem,
  total: leads.length
})

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2 text-gray-600">Carregando dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral do seu CRM</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Sistema Online</span>
          <div className="w-2 h-2 bg-blue-500 rounded-full ml-4"></div>
          <span className="text-sm text-gray-600">Firebase Conectado</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Total de Leads
            </CardTitle>
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{totalLeads}</div>
            <p className="text-sm text-gray-600 mt-2 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">+0</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Agendamentos
            </CardTitle>
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{agendados}</div>
            <p className="text-sm text-gray-600 mt-2 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">+0</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Taxa de Conversão
            </CardTitle>
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{taxaConversao}%</div>
            <p className="text-sm text-gray-600 mt-2 flex items-center">
              <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">+3%</span> vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Leads Hoje
            </CardTitle>
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{leadsHoje}</div>
            <p className="text-sm text-gray-600 mt-2 flex items-center">
              {diferencaHojeOntem >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
              ) : (
                <TrendingUp className="h-4 w-4 text-red-600 mr-1 transform rotate-180" />
              )}
              <span className={`font-medium ${diferencaHojeOntem >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {diferencaHojeOntem >= 0 ? '+' : ''}{diferencaHojeOntem}
              </span> vs ontem
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leads por Canal */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              <Zap className="h-5 w-5 mr-2 text-purple-600" />
              Leads por Canal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsPorCanal().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leadsPorCanal()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="canal" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Bar dataKey="quantidade" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>Nenhum dado disponível</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evolução Mensal */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
              Evolução de Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsPorMes().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={leadsPorMes()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="quantidade" 
                    stroke="#8b5cf6" 
                    strokeWidth={3}
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#8b5cf6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p>Nenhum dado disponível</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Leads Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leadsRecentes.map((lead) => (
                <div key={lead.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {lead.nome_paciente}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getEspecialidadeNome(lead.especialidade_id)} • {formatTime(lead.data_registro_contato)}
                    </p>
                  </div>
                  <Badge 
                    variant={
                      lead.status === 'Convertido' ? 'default' :
                      lead.status === 'Agendado' ? 'secondary' :
                      lead.status === 'Lead' ? 'outline' : 'destructive'
                    }
                    className={
                      lead.status === 'Convertido' ? 'bg-green-100 text-green-800 hover:bg-green-100' :
                      lead.status === 'Agendado' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' :
                      lead.status === 'Lead' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                      'bg-red-100 text-red-800 hover:bg-red-100'
                    }
                  >
                    {lead.status}
                  </Badge>
                </div>
              ))}
              {leadsRecentes.length === 0 && (
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Nenhum lead cadastrado ainda</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Próximos Agendamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {proximosAgendamentos.map((lead) => (
                <div key={lead.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {lead.nome_paciente}
                    </p>
                    <p className="text-sm text-gray-500">
                      {getMedicoNome(lead.medico_agendado_id)} • {getEspecialidadeNome(lead.especialidade_id)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(lead.valor_orcado)}</p>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      Agendado
                    </Badge>
                  </div>
                </div>
              ))}
              {proximosAgendamentos.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Nenhum agendamento pendente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard

