// Serviços de autenticação Firebase - VERSÃO MULTI-TENANT
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './config'

class AuthService {
  // Fazer login com email e senha
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Verificar se usuário tem clínica associada
      const userClinicaData = await this.getUserClinicaData(userCredential.user.uid)
      
      if (!userClinicaData || !userClinicaData.clinicaId) {
        // Usuário não tem clínica associada
        await this.signOut()
        return { 
          success: false, 
          error: 'Usuário não possui clínica associada. Entre em contato com o administrador.' 
        }
      }

      return { success: true, user: userCredential.user }
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) }
    }
  }

  // Criar nova conta
  async signUp(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Atualizar o nome do usuário
      if (displayName) {
        await updateProfile(userCredential.user, { displayName })
      }
      
      return { success: true, user: userCredential.user }
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) }
    }
  }

  // Fazer logout
  async signOut() {
    try {
      await signOut(auth)
      return { success: true }
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) }
    }
  }

  // Resetar senha
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email)
      return { success: true }
    } catch (error) {
      return { success: false, error: this.getErrorMessage(error.code) }
    }
  }

  // Observar mudanças no estado de autenticação
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback)
  }

  // Obter usuário atual
  getCurrentUser() {
    return auth.currentUser
  }

  // Verificar se usuário está logado
  isAuthenticated() {
    return !!auth.currentUser
  }

  // NOVO - Associar usuário a uma clínica
  async setUserClinica(userId, clinicaId, role = 'admin') {
    try {
      const userClinicaRef = doc(db, 'user_clinicas', userId)
      await setDoc(userClinicaRef, {
        userId,
        clinicaId,
        role,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ativo: true
      })
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao associar usuário à clínica:', error)
      return { success: false, error: error.message }
    }
  }

  // NOVO - Obter dados da associação usuário-clínica
  async getUserClinicaData(userId) {
    try {
      const userClinicaRef = doc(db, 'user_clinicas', userId)
      const docSnap = await getDoc(userClinicaRef)
      
      if (docSnap.exists()) {
        return docSnap.data()
      }
      
      return null
    } catch (error) {
      console.error('Erro ao buscar dados da clínica do usuário:', error)
      return null
    }
  }

  // NOVO - Simular custom claims usando Firestore
  async getIdTokenResult(user) {
    try {
      const userClinicaData = await this.getUserClinicaData(user.uid)
      
      // Simular estrutura do token result
      return {
        claims: {
          clinicaId: userClinicaData?.clinicaId || null,
          role: userClinicaData?.role || null
        },
        token: await user.getIdToken(),
        authTime: user.metadata.lastSignInTime,
        issuedAtTime: user.metadata.creationTime,
        expirationTime: new Date(Date.now() + 3600000).toISOString() // 1 hora
      }
    } catch (error) {
      console.error('Erro ao obter token result:', error)
      return {
        claims: {},
        token: await user.getIdToken()
      }
    }
  }

  // NOVO - Verificar se usuário tem acesso a uma clínica específica
  async hasClinicaAccess(userId, clinicaId) {
    try {
      const userClinicaData = await this.getUserClinicaData(userId)
      return userClinicaData?.clinicaId === clinicaId && userClinicaData?.ativo
    } catch (error) {
      console.error('Erro ao verificar acesso à clínica:', error)
      return false
    }
  }

  // NOVO - Remover associação usuário-clínica
  async removeUserClinica(userId) {
    try {
      const userClinicaRef = doc(db, 'user_clinicas', userId)
      await setDoc(userClinicaRef, {
        ativo: false,
        updatedAt: new Date().toISOString()
      }, { merge: true })
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao remover associação usuário-clínica:', error)
      return { success: false, error: error.message }
    }
  }

  // NOVO - Atualizar role do usuário
  async updateUserRole(userId, newRole) {
    try {
      const userClinicaRef = doc(db, 'user_clinicas', userId)
      await setDoc(userClinicaRef, {
        role: newRole,
        updatedAt: new Date().toISOString()
      }, { merge: true })
      
      return { success: true }
    } catch (error) {
      console.error('Erro ao atualizar role do usuário:', error)
      return { success: false, error: error.message }
    }
  }

  // NOVO - Listar usuários de uma clínica
  async getClinicaUsers(clinicaId) {
    try {
      // Esta funcionalidade requer uma query mais complexa
      // Por enquanto, retornamos uma estrutura básica
      console.log('Funcionalidade de listar usuários da clínica ainda não implementada')
      return []
    } catch (error) {
      console.error('Erro ao listar usuários da clínica:', error)
      return []
    }
  }

  // Traduzir códigos de erro para mensagens amigáveis
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Senha incorreta',
      'auth/email-already-in-use': 'Este email já está em uso',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres',
      'auth/invalid-email': 'Email inválido',
      'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde',
      'auth/network-request-failed': 'Erro de conexão. Verifique sua internet',
      'auth/user-disabled': 'Esta conta foi desabilitada',
      'auth/operation-not-allowed': 'Operação não permitida',
      'auth/invalid-credential': 'Credenciais inválidas',
      'auth/user-token-expired': 'Sessão expirada. Faça login novamente'
    }
    
    return errorMessages[errorCode] || 'Erro desconhecido. Tente novamente'
  }
}

export default new AuthService()

