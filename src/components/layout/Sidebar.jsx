import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  Stethoscope, 
  ClipboardList, 
  UserPlus, 
  BarChart3,
  X,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
    badge: 12
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
  },
]

const quickStats = [
  { label: 'Leads Hoje', value: 8, icon: UserPlus },
  { label: 'Agendamentos', value: 15, icon: LayoutDashboard },
  { label: 'Receita', value: 'R$ 12.5k', icon: BarChart3 },
]

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-slate-800 font-bold text-sm">Y</span>
              </div>
              <div>
                <h1 className="text-white font-semibold text-lg">Clinical CRM</h1>
                <p className="text-slate-400 text-xs">v2.0</p>
              </div>
            </div>
            {/* Mobile close button */}
            <Button variant="ghost" size="sm" onClick={onClose} className="lg:hidden text-white hover:bg-slate-700">
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-slate-700 text-white"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  )}
                >
                  <div className="flex items-center">
                    <item.icon className={cn(
                      "mr-3 h-5 w-5 transition-colors",
                      isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                    )} />
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-slate-400 group-hover:text-slate-300">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="bg-blue-600 text-white text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Quick Stats */}
          <div className="px-4 py-4">
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Resumo Rápido
            </h3>
            <div className="space-y-3">
              {quickStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <stat.icon className="h-4 w-4 text-slate-400 mr-2" />
                    <span className="text-slate-300">{stat.label}</span>
                  </div>
                  <span className="text-white font-medium">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t border-slate-700">
            <div className="text-xs text-slate-400 text-center">
              <p className="font-medium text-slate-300">Younv Consultoria</p>
              <p>Sistema de Gestão</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar

