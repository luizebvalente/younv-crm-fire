// Serviços de autenticação Firebase
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from './config'

class AuthService {
  // Fazer login com email e senha
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
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
      'auth/operation-not-allowed': 'Operação não permitida'
    }
    
    return errorMessages[errorCode] || 'Erro desconhecido. Tente novamente'
  }
}

export default new AuthService()

