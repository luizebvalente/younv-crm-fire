// Context para gerenciar autenticação - VERSÃO MULTI-TENANT
import { createContext, useContext, useEffect, useState } from 'react'
import { authService } from '../services/firebase'
import clinicaService from '../services/clinicaService'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [clinica, setClinica] = useState(null) // NOVO - Dados da clínica
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Observar mudanças no estado de autenticação
    const unsubscribe = authService.onAuthStateChanged(async (user) => {
      setUser(user)
      
      if (user) {
        try {
          // Buscar dados da clínica do usuário
          await loadUserClinica(user)
        } catch (error) {
          console.error('Erro ao carregar dados da clínica:', error)
          setError('Erro ao carregar dados da clínica')
        }
      } else {
        setClinica(null)
      }
      
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // NOVO - Carregar dados da clínica do usuário
  const loadUserClinica = async (user) => {
    try {
      // Usar o serviço de auth para obter dados da clínica
      const tokenResult = await authService.getIdTokenResult(user)
      const clinicaId = tokenResult.claims.clinicaId

      if (clinicaId) {
        // Buscar dados completos da clínica
        const clinicaData = await clinicaService.getById(clinicaId)
        
        if (clinicaData && clinicaData.ativo) {
          setClinica(clinicaData)
        } else {
          throw new Error('Clínica não encontrada ou inativa')
        }
      } else {
        // Usuário não tem clínica associada
        throw new Error('Usuário não possui clínica associada')
      }
    } catch (error) {
      console.error('Erro ao carregar clínica do usuário:', error)
      throw error
    }
  }

  const signIn = async (email, password) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await authService.signIn(email, password)
      
      if (!result.success) {
        setError(result.error)
        return result
      }

      // Aguardar carregamento da clínica
      if (result.user) {
        await loadUserClinica(result.user)
      }

      return result
    } catch (error) {
      console.error('Erro no login:', error)
      setError('Erro ao fazer login. Tente novamente.')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, displayName, clinicaData = null) => {
    setLoading(true)
    setError(null)
    
    try {
      // Criar conta no Firebase Auth
      const result = await authService.signUp(email, password, displayName)
      
      if (!result.success) {
        setError(result.error)
        return result
      }

      // Se dados da clínica foram fornecidos, criar a clínica
      if (clinicaData && result.user) {
        try {
          const novaClinica = await clinicaService.create(clinicaData)
          
          // Associar usuário à clínica via custom claims
          await authService.setUserClinica(result.user.uid, novaClinica.id)
          
          // Recarregar token para obter custom claims
          await result.user.getIdToken(true)
          
          setClinica(novaClinica)
        } catch (clinicaError) {
          console.error('Erro ao criar clínica:', clinicaError)
          // Deletar usuário se falhou ao criar clínica
          await result.user.delete()
          throw new Error('Erro ao criar clínica. Cadastro cancelado.')
        }
      }

      return result
    } catch (error) {
      console.error('Erro no cadastro:', error)
      setError(error.message || 'Erro ao criar conta. Tente novamente.')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await authService.signOut()
      
      if (result.success) {
        setClinica(null)
      } else {
        setError(result.error)
      }
      
      return result
    } catch (error) {
      console.error('Erro no logout:', error)
      setError('Erro ao fazer logout. Tente novamente.')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email) => {
    setError(null)
    
    try {
      const result = await authService.resetPassword(email)
      
      if (!result.success) {
        setError(result.error)
      }
      
      return result
    } catch (error) {
      console.error('Erro ao resetar senha:', error)
      setError('Erro ao enviar email de recuperação. Tente novamente.')
      return { success: false, error: error.message }
    }
  }

  // NOVO - Atualizar dados da clínica
  const updateClinica = async (clinicaData) => {
    if (!clinica?.id) {
      throw new Error('Nenhuma clínica carregada')
    }

    try {
      const updatedClinica = await clinicaService.update(clinica.id, clinicaData)
      setClinica(updatedClinica)
      return { success: true, clinica: updatedClinica }
    } catch (error) {
      console.error('Erro ao atualizar clínica:', error)
      setError('Erro ao atualizar dados da clínica')
      return { success: false, error: error.message }
    }
  }

  // NOVO - Recarregar dados da clínica
  const reloadClinica = async () => {
    if (!user || !clinica?.id) return

    try {
      const clinicaData = await clinicaService.getById(clinica.id)
      setClinica(clinicaData)
    } catch (error) {
      console.error('Erro ao recarregar clínica:', error)
    }
  }

  const clearError = () => {
    setError(null)
  }

  // NOVO - Verificar se usuário tem permissão para acessar dados de uma clínica
  const hasClinicaAccess = (targetClinicaId) => {
    return clinica?.id === targetClinicaId
  }

  // NOVO - Obter ID da clínica atual
  const getCurrentClinicaId = () => {
    return clinica?.id || null
  }

  const value = {
    // Estados básicos
    user,
    clinica, // NOVO
    loading,
    error,
    
    // Métodos de autenticação
    signIn,
    signUp,
    signOut,
    resetPassword,
    clearError,
    
    // NOVO - Métodos relacionados à clínica
    updateClinica,
    reloadClinica,
    hasClinicaAccess,
    getCurrentClinicaId,
    
    // Estados derivados
    isAuthenticated: !!user,
    hasClinica: !!clinica, // NOVO
    clinicaId: clinica?.id || null, // NOVO
    clinicaNome: clinica?.nome || null, // NOVO
    
    // NOVO - Informações úteis da clínica
    clinicaInfo: clinica ? {
      id: clinica.id,
      nome: clinica.nome,
      email: clinica.contato?.email,
      telefone: clinica.contato?.telefone,
      plano: clinica.plano
    } : null
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext

