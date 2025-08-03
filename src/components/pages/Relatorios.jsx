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
import { Users, UserPlus, Calendar, TrendingUp, DollarSign, Target, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import firebaseDataService from '@/services/firebaseDataService'

const Relatorios = () => {
  const [leads, setLeads] = useState([])
  const [medicos, setMedicos] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [leadsData, medicosData, especialidadesData] = await Promise.all([
        firebaseDataService.getAll('leads'),
        firebaseDataService.getAll('medicos'),
        firebaseDataService.getAll('especialidades')
      ])
      
      setLeads(leadsData)
      setMedicos(medicosData)
      setEspecialidades(especialidadesData)
    } catch (err) {
      console.error('Erro ao carregar dados dos relatórios:', err)
      setError('Erro ao carregar dados dos relatórios. Tente novamente.')
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
  const valorConvertido = leads
    .filter(l => l.status === 'Convertido')
    .reduce((sum, lead) => sum + (lead.valor_orcado || 0), 0)

  // Dados para gráficos
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

  const leadsPorStatus = () => {
    const status = {}
    leads.forEach(lead => {
      status[lead.status] = (status[lead.status] || 0) + 1
    })
    return Object.entries(status).map(([status, quantidade]) => ({
      status,
      quantidade
    }))
  }

  const medicosPorAtendimento = () => {
    const stats = {}
    medicos.forEach(medico => {
      const medicoLeads = leads.filter(lead => lead.medico_agendado_id === medico.id)
      stats[medico.nome] = {
        nome: medico.nome,
        total: medicoLeads.length,
        convertidos: medicoLeads.filter(lead => lead.status === 'Convertido').length
      }
    })
    return Object.values(stats).sort((a, b) => b.total - a.total)
  }

  const leadsPorMes = () => {
    const meses = {}
    leads.forEach(lead => {
      const data = new Date(lead.data_registro_contato)
      const mesAno = `${data.getMonth() + 1}/${data.getFullYear()}`
      meses[mesAno] = (meses[mesAno] || 0) + 1
    })
    return Object.entries(meses).map(([mes, quantidade]) => ({
      mes,
      quantidade
    })).slice(-6) // Últimos 6 meses
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando relatórios...</span>
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

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-600">Análises e métricas de performance</p>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              Todos os leads cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agendados}</div>
            <p className="text-xs text-muted-foreground">
              {totalLeads > 0 ? ((agendados / totalLeads) * 100).toFixed(1) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertidos}</div>
            <p className="text-xs text-muted-foreground">
              {taxaConversao}% de conversão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaConversao}%</div>
            <p className="text-xs text-muted-foreground">
              Leads → Convertidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Orçado</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorTotal)}</div>
            <p className="text-xs text-muted-foreground">
              Total em orçamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Convertido</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorConvertido)}</div>
            <p className="text-xs text-muted-foreground">
              {valorTotal > 0 ? ((valorConvertido / valorTotal) * 100).toFixed(1) : 0}% do orçado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads por Canal */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Canal de Contato</CardTitle>
          </CardHeader>
          <CardContent>
            {leadsPorCanal().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={leadsPorCanal()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="canal" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status dos Leads */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {leadsPorStatus().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadsPorStatus()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, quantidade }) => `${status}: ${quantidade}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="quantidade"
                  >
                    {leadsPorStatus().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Médicos por Atendimento */}
        <Card>
          <CardHeader>
            <CardTitle>Performance dos Médicos</CardTitle>
          </CardHeader>
          <CardContent>
            {medicosPorAtendimento().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={medicosPorAtendimento()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#8884d8" name="Total de Leads" />
                  <Bar dataKey="convertidos" fill="#82ca9d" name="Convertidos" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evolução Temporal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Leads (Últimos 6 Meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {leadsPorMes().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={leadsPorMes()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="quantidade" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Performance dos Médicos */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking de Médicos por Atendimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {medicosPorAtendimento().length > 0 ? (
            <div className="space-y-4">
              {medicosPorAtendimento().map((medico, index) => (
                <div key={medico.nome} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{medico.nome}</p>
                      <p className="text-sm text-gray-500">
                        {medico.total} leads • {medico.convertidos} convertidos
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      {medico.total > 0 ? ((medico.convertidos / medico.total) * 100).toFixed(1) : 0}%
                    </p>
                    <p className="text-sm text-gray-500">Taxa de conversão</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum dado de médicos disponível.</p>
              <p className="text-gray-400 text-sm">Cadastre médicos e leads para ver os relatórios.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Relatorios

