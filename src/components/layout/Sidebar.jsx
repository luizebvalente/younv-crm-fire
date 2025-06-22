import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Activity, 
  ClipboardList, 
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar
} from 'lucide-react'
import { useRealtimeFirestore } from '@/hooks/useFirestore'
import { useMemo } from 'react'

export default function Sidebar() {
  const location = useLocation()
  const { data: leads, loading: leadsLoading } = useRealtimeFirestore('leads')

  // Função para verificar se uma data é hoje
  const isToday = (dateString) => {
    if (!dateString) return false
    
    try {
      const date = new Date(dateString)
      const today = new Date()
      
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear()
    } catch (error) {
      console.error('Erro ao verificar data:', error)
      return false
    }
  }

  // Calcular estatísticas em tempo real
  const stats = useMemo(() => {
    if (leadsLoading || !leads || leads.length === 0) {
      return {
        totalLeads: 0,
        leadsHoje: 0,
        agendamentosHoje: 0,
        receitaHoje: 0
      }
    }

    // Filtrar leads de hoje (por data de registro)
    const leadsHoje = leads.filter(lead => isToday(lead.dataRegistroContato))

    // Para agendamentos e receita, vamos usar uma abordagem mais específica:
    // Como não temos campos específicos de data de agendamento/conversão,
    // vamos considerar apenas os leads que foram REGISTRADOS hoje E têm o status correspondente

    // Agendamentos de hoje: leads registrados hoje que estão agendados
    const agendamentosHoje = leadsHoje.filter(lead => {
      const agendado = lead.agendado || lead.agendado === true
      const status = lead.status || lead.status
      return agendado === true || 
             status === 'Agendado' || 
             status === 'agendado' ||
             status === 'AGENDADO'
    }).length

    // Receita de hoje: leads registrados hoje que foram convertidos
    const leadsConvertidosHoje = leadsHoje.filter(lead => {
      const orcamentoFechado = lead.orcamentoFechado || lead.orcamento_fechado
      const status = lead.status || lead.status
      return orcamentoFechado === true || 
             status === 'Convertido' || 
             status === 'convertido' ||
             status === 'CONVERTIDO'
    })

    console.log('=== DEBUG RECEITA ===')
    console.log('Leads de hoje:', leadsHoje.length)
    console.log('Leads convertidos de hoje:', leadsConvertidosHoje.length)
    
    const receitaHoje = leadsConvertidosHoje.reduce((total, lead) => {
      console.log('Processando lead:', lead.nomePaciente || lead.nome_paciente)
      
      // Verificar se o orçamento é parcial ou total
      const statusOrcamento = lead.statusOrcamento || lead.status_orcamento || 'Total'
      const valorFechadoParcial = lead.valorFechadoParcial || lead.valor_fechado_parcial
      const valorOrcado = lead.valorOrcado || lead.valor_orcado
      
      console.log('Status do orçamento:', statusOrcamento)
      console.log('Valor fechado parcial:', valorFechadoParcial)
      console.log('Valor orçado:', valorOrcado)
      
      let valorParaUsar = 0
      
      // Se for orçamento PARCIAL, usar o valor fechado parcial
      if (statusOrcamento === 'Parcial' || statusOrcamento === 'parcial' || statusOrcamento === 'PARCIAL') {
        console.log('Usando valor PARCIAL')
        if (valorFechadoParcial !== undefined && valorFechadoParcial !== null && valorFechadoParcial !== '') {
          if (typeof valorFechadoParcial === 'string') {
            // Remover formatação brasileira (R$, pontos, vírgulas)
            const valorLimpo = valorFechadoParcial
              .replace(/[R$\s]/g, '')
              .replace(/\./g, '')
              .replace(',', '.')
            valorParaUsar = parseFloat(valorLimpo) || 0
          } else if (typeof valorFechadoParcial === 'number') {
            valorParaUsar = valorFechadoParcial
          }
        }
      } else {
        // Se for orçamento TOTAL, usar o valor orçado
        console.log('Usando valor TOTAL')
        if (valorOrcado !== undefined && valorOrcado !== null && valorOrcado !== '') {
          if (typeof valorOrcado === 'string') {
            // Remover formatação brasileira (R$, pontos, vírgulas)
            const valorLimpo = valorOrcado
              .replace(/[R$\s]/g, '')
              .replace(/\./g, '')
              .replace(',', '.')
            valorParaUsar = parseFloat(valorLimpo) || 0
          } else if (typeof valorOrcado === 'number') {
            valorParaUsar = valorOrcado
          }
        }
      }
      
      console.log('Valor para usar:', valorParaUsar)
      console.log('Total anterior:', total)
      console.log('Novo total:', total + valorParaUsar)
      console.log('---')
      
      return total + valorParaUsar
    }, 0)

    console.log('RECEITA FINAL DE HOJE:', receitaHoje)
    console.log('=== FIM DEBUG ===')

    return {
      totalLeads: leads.length,
      leadsHoje: leadsHoje.length,
      agendamentosHoje,
      receitaHoje
    }
  }, [leads, leadsLoading])

  // Configuração da navegação com contador dinâmico
  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard,
      description: 'Visão geral'
    },
    { 
      name: 'Leads', 
      href: '/leads', 
      icon: UserPlus,
      description: 'Gestão de leads',
      badge: stats.totalLeads
    },
    { 
      name: 'Médicos', 
      href: '/medicos', 
      icon: Users,
      description: 'Profissionais'
    },
    { 
      name: 'Especialidades', 
      href: '/especialidades', 
      icon: Activity,
      description: 'Áreas médicas'
    },
    { 
      name: 'Procedimentos', 
      href: '/procedimentos', 
      icon: ClipboardList,
      description: 'Serviços'
    },
    { 
      name: 'Relatórios', 
      href: '/relatorios', 
      icon: BarChart3,
      description: 'Análises'
    }
  ]

  // Função para formatar valores em milhares
  const formatValue = (value) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`
    }
    return value.toString()
  }

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 border-b border-gray-800">
        <div className="w-10 h-10 flex items-center justify-center">
          <img 
            src="/Younv-Official.png" 
            alt="Younv" 
            className="h-8 w-auto"
          />
        </div>
        <div>
          <h1 className="text-xl font-bold">Clinical CRM</h1>
          <p className="text-sm text-gray-400">v2.0</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center justify-between gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-5 w-5" />
                <div>
                  <div>{item.name}</div>
                  <div className="text-xs text-gray-400">{item.description}</div>
                </div>
              </div>
              {item.badge && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Resumo Rápido */}
      <div className="p-4 border-t border-gray-800">
        <h3 className="text-sm font-medium text-gray-400 mb-3">RESUMO RÁPIDO</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-blue-400" />
              <span className="text-sm">Leads Hoje</span>
            </div>
            <span className="text-lg font-bold">{stats.leadsHoje}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-400" />
              <span className="text-sm">Agendamentos</span>
            </div>
            <span className="text-lg font-bold">{stats.agendamentosHoje}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-yellow-400" />
              <span className="text-sm">Receita</span>
            </div>
            <span className="text-lg font-bold">
              R$ {formatValue(stats.receitaHoje)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="text-center">
          <p className="text-sm font-medium">Younv Consultoria</p>
          <p className="text-xs text-gray-400">Sistema de Gestão</p>
        </div>
      </div>
    </div>
  )
}

