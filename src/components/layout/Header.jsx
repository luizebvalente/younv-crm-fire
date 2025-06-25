import { Menu, LogOut, User, Search, Bell, Settings, Building2, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'

const Header = ({ onMenuClick, user, clinica }) => { // MODIFICADO - incluir clinica
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
  }

  const getUserInitials = (user) => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  // NOVO - Obter nome do usuário
  const getUserName = () => {
    if (user?.displayName) {
      return user.displayName
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'Usuário'
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Logo and clinic info - MODIFICADO */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">Y</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {clinica?.nome || 'Clinical CRM'}
              </h1>
              <p className="text-sm text-gray-500">
                {clinica?.nome ? 'Sistema Multi-Tenant' : 'Sistema de Gestão'}
              </p>
            </div>
          </div>

          {/* NOVO - Informações da clínica */}
          {clinica && (
            <div className="hidden lg:flex items-center space-x-4 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <Building2 className="h-4 w-4 text-blue-600" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">{clinica.nome}</p>
                <p className="text-blue-600 text-xs">
                  {clinica.contato?.cidade || 'Clínica Ativa'} • ID: {clinica.id.slice(-6)}
                </p>
              </div>
            </div>
          )}

          {/* Status indicators - MODIFICADO */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Sistema Online</span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-600">Multi-Tenant Ativo</span>
            </div>
          </div>
        </div>

        {/* Search and actions */}
        <div className="flex items-center space-x-4">
          {/* Search bar */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar pacientes, médicos..."
              className="pl-10 pr-4 py-2 w-80 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-red-500 text-white text-xs flex items-center justify-center">
              3
            </Badge>
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="sm">
            <Settings className="h-5 w-5 text-gray-600" />
          </Button>

          {/* User profile - MODIFICADO */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {getUserName()}
              </p>
              <p className="text-xs text-gray-500">
                {clinica?.nome ? 'Admin da Clínica' : 'Administrador'}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-medium text-sm">
                      {getUserInitials(user)}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {getUserName()}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    {/* NOVO - Mostrar clínica no dropdown */}
                    {clinica && (
                      <p className="text-xs leading-none text-blue-600 font-medium">
                        {clinica.nome}
                      </p>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                {/* NOVO - Configurações da clínica */}
                {clinica && (
                  <DropdownMenuItem>
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>Configurações da Clínica</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Last sync time */}
          <div className="hidden lg:block text-right">
            <p className="text-xs text-gray-500">Última sincronização: {getCurrentTime()}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

