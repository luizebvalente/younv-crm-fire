import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './App.css'

// Context
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Layout Components
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'

// Page Components
import Dashboard from './components/pages/Dashboard'
import Medicos from './components/pages/Medicos'
import Especialidades from './components/pages/Especialidades'
import Procedimentos from './components/pages/Procedimentos'
import Leads from './components/pages/Leads'
import Relatorios from './components/pages/Relatorios'
import Login from './components/pages/Login'

// Services
import firebaseDataService from './services/firebaseDataService'

// Componente principal da aplicação autenticada
function AuthenticatedApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, clinica, clinicaId, hasClinica } = useAuth() // MODIFICADO - incluir dados da clínica

  useEffect(() => {
    // NOVO - Definir clínica atual no serviço de dados quando clínica for carregada
    if (clinicaId) {
      firebaseDataService.setCurrentClinicaId(clinicaId)
      
      // Inicializar dados padrão para a clínica se necessário
      firebaseDataService.initializeDataForClinica(clinicaId)
        .then(() => {
          console.log(`Dados inicializados para clínica: ${clinica?.nome}`)
        })
        .catch(error => {
          console.error('Erro ao inicializar dados da clínica:', error)
        })
    }
  }, [clinicaId, clinica])

  // NOVO - Verificar se clínica está carregada
  if (!hasClinica) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">Carregando dados da clínica...</p>
          {clinica && (
            <p className="mt-2 text-sm text-gray-500">{clinica.nome}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header - MODIFICADO para passar dados da clínica */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          user={user}
          clinica={clinica}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/medicos" element={<Medicos />} />
            <Route path="/especialidades" element={<Especialidades />} />
            <Route path="/procedimentos" element={<Procedimentos />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

// Componente que gerencia autenticação
function AppContent() {
  const { user, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  // NOVO - Mostrar erro se houver
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Erro de Autenticação</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return user ? <AuthenticatedApp /> : <Login />
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App

