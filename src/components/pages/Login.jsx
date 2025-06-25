import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Building2, Mail, Lock, User, Phone, MapPin, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const Login = () => {
  const { signIn, signUp, resetPassword, error, loading, clearError } = useAuth()
  
  // Estados para login
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  })
  
  // Estados para cadastro
  const [signupData, setSignupData] = useState({
    // Dados do usuário
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Dados da clínica
    clinicaNome: '',
    clinicaEmail: '',
    clinicaTelefone: '',
    clinicaCnpj: '',
    clinicaEndereco: '',
    clinicaCidade: '',
    clinicaEstado: ''
  })
  
  // Estados para recuperação de senha
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  
  // Estados da UI
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('login')

  // Limpar erros quando trocar de aba
  const handleTabChange = (value) => {
    setActiveTab(value)
    clearError()
    setResetSent(false)
  }

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault()
    clearError()
    
    if (!loginData.email || !loginData.password) {
      return
    }
    
    await signIn(loginData.email, loginData.password)
  }

  // Handle signup
  const handleSignup = async (e) => {
    e.preventDefault()
    clearError()
    
    // Validações
    if (!signupData.displayName || !signupData.email || !signupData.password) {
      return
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      return
    }
    
    if (!signupData.clinicaNome || !signupData.clinicaEmail) {
      return
    }
    
    // Dados da clínica
    const clinicaData = {
      nome: signupData.clinicaNome,
      razaoSocial: signupData.clinicaNome,
      cnpj: signupData.clinicaCnpj || '',
      endereco: {
        rua: signupData.clinicaEndereco || '',
        cidade: signupData.clinicaCidade || '',
        estado: signupData.clinicaEstado || '',
        cep: ''
      },
      contato: {
        telefone: signupData.clinicaTelefone || '',
        email: signupData.clinicaEmail,
        whatsapp: signupData.clinicaTelefone || ''
      },
      configuracoes: {
        timezone: 'America/Sao_Paulo',
        moeda: 'BRL',
        idioma: 'pt-BR'
      },
      plano: 'basic'
    }
    
    await signUp(
      signupData.email, 
      signupData.password, 
      signupData.displayName,
      clinicaData
    )
  }

  // Handle password reset
  const handlePasswordReset = async (e) => {
    e.preventDefault()
    clearError()
    
    if (!resetEmail) {
      return
    }
    
    const result = await resetPassword(resetEmail)
    if (result.success) {
      setResetSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">Y</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Younv CRM</h1>
          <p className="text-gray-600">Sistema Multi-Tenant para Clínicas</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-xl">Acesso ao Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
                <TabsTrigger value="reset">Recuperar</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={loginData.email}
                        onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Sua senha"
                        className="pl-10 pr-10"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Dados do Usuário */}
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900 flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Dados do Usuário
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nome Completo</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={signupData.displayName}
                        onChange={(e) => setSignupData({...signupData, displayName: e.target.value})}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Senha</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Senha"
                            value={signupData.password}
                            onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm">Confirmar</Label>
                        <Input
                          id="signup-confirm"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirmar"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dados da Clínica */}
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-medium text-gray-900 flex items-center">
                      <Building2 className="mr-2 h-4 w-4" />
                      Dados da Clínica
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="clinica-nome">Nome da Clínica *</Label>
                      <Input
                        id="clinica-nome"
                        type="text"
                        placeholder="Nome da sua clínica"
                        value={signupData.clinicaNome}
                        onChange={(e) => setSignupData({...signupData, clinicaNome: e.target.value})}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="clinica-email">Email da Clínica *</Label>
                        <Input
                          id="clinica-email"
                          type="email"
                          placeholder="contato@clinica.com"
                          value={signupData.clinicaEmail}
                          onChange={(e) => setSignupData({...signupData, clinicaEmail: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clinica-telefone">Telefone</Label>
                        <Input
                          id="clinica-telefone"
                          type="tel"
                          placeholder="(11) 99999-9999"
                          value={signupData.clinicaTelefone}
                          onChange={(e) => setSignupData({...signupData, clinicaTelefone: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="clinica-endereco">Endereço (Opcional)</Label>
                      <Input
                        id="clinica-endereco"
                        type="text"
                        placeholder="Rua, número, bairro"
                        value={signupData.clinicaEndereco}
                        onChange={(e) => setSignupData({...signupData, clinicaEndereco: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="clinica-cidade">Cidade</Label>
                        <Input
                          id="clinica-cidade"
                          type="text"
                          placeholder="São Paulo"
                          value={signupData.clinicaCidade}
                          onChange={(e) => setSignupData({...signupData, clinicaCidade: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="clinica-estado">Estado</Label>
                        <Input
                          id="clinica-estado"
                          type="text"
                          placeholder="SP"
                          maxLength={2}
                          value={signupData.clinicaEstado}
                          onChange={(e) => setSignupData({...signupData, clinicaEstado: e.target.value.toUpperCase()})}
                        />
                      </div>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      'Criar Conta e Clínica'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Reset Password Tab */}
              <TabsContent value="reset" className="space-y-4 mt-6">
                {!resetSent ? (
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-10"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Enviar Link de Recuperação'
                      )}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <Mail className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">Email Enviado!</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => {setResetSent(false); setResetEmail('')}}
                    >
                      Enviar Novamente
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Error Alert */}
            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2024 Younv Consultoria. Todos os direitos reservados.</p>
          <p className="mt-1">Sistema Multi-Tenant v2.0</p>
        </div>
      </div>
    </div>
  )
}

export default Login

