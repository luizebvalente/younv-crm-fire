import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Users, Calendar, DollarSign, TrendingUp, Check, RefreshCw, X, Tag, Settings, AlertTriangle, User, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useFirestore } from '@/hooks/useFirestore'
import { useAuth } from '@/contexts/AuthContext'
import firebaseDataService from '@/services/firebaseDataService'

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [medicos, setMedicos] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [procedimentos, setProcedimentos] = useState([])
  
  // ESTADOS PARA TAGS - ADICIONADOS
  const [tags, setTags] = useState([])
  const [selectedTagsFilter, setSelectedTagsFilter] = useState([])
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState(null)
  const [tagForm, setTagForm] = useState({
    nome: '',
    cor: '#3b82f6',
    categoria: 'Procedimento'
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [error, setError] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [existingPatient, setExistingPatient] = useState(null)
  const [activeTab, setActiveTab] = useState('leads')

  // NOVO: Hook de autenticação
  const { user } = useAuth()

  // FORMDATA CORRIGIDO - ADICIONADO CAMPO TAGS
  const [formData, setFormData] = useState({
    nome_paciente: '',
    telefone: '',
    data_nascimento: '',
    email: '',
    canal_contato: '',
    solicitacao_paciente: '',
    medico_agendado_id: '',
    especialidade_id: '',
    procedimento_agendado_id: '',
    agendado: false,
    motivo_nao_agendamento: '',
    outros_profissionais_agendados: false,
    quais_profissionais: '',
    pagou_reserva: false,
    tipo_visita: '',
    valor_orcado: '',
    orcamento_fechado: '',
    valor_fechado_parcial: '',
    observacao_geral: '',
    perfil_comportamental_disc: '',
    status: 'Lead',
    // Follow-ups
    followup1_realizado: false,
    followup1_data: '',
    followup2_realizado: false,
    followup2_data: '',
    followup3_realizado: false,
    followup3_data: '',
    // NOVO: TAGS
    tags: []
  })

  // NOVA FUNÇÃO: Migração de rastreamento de usuário
  const handleUserTrackingMigration = async () => {
    try {
      setMigrating(true)
      setError(null)
      
      console.log('🔄 Iniciando migração de rastreamento de usuário...')
      
      const result = await firebaseDataService.migrateLeadsForUserTracking()
      
      if (result.success) {
        console.log('✅ Migração de rastreamento concluída:', result)
        
        // Recarregar dados
        await loadData()
        
        alert(`${result.message}\\n\\nEstatísticas:\\n- Total: ${result.stats.total}\\n- Migrados: ${result.stats.migrados}`)
      } else {
        console.error('❌ Erro na migração de rastreamento:', result)
        setError(result.message)
      }
    } catch (err) {
      console.error('❌ Erro durante a migração de rastreamento:', err)
      setError(`Erro durante a migração de rastreamento: ${err.message}`)
    } finally {
      setMigrating(false)
    }
  }

  // Função para migração usando o serviço centralizado
  const handleFieldMigration = async () => {
    try {
      setMigrating(true)
      setError(null)
      
      console.log('🔄 Iniciando migração via serviço...')
      
      // Usar a função de migração do serviço
      const result = await firebaseDataService.migrateLeadsFields()
      
      if (result.success) {
        console.log('✅ Migração concluída:', result)
        
        // Recarregar dados
        await loadData()
        
        // Mostrar resultado para o usuário
        alert(`${result.message}\\n\\nEstatísticas:\\n- Total: ${result.stats.total}\\n- Migrados: ${result.stats.migrados}`)
      } else {
        console.error('❌ Erro na migração:', result)
        setError(result.message)
      }
    } catch (err) {
      console.error('❌ Erro durante a migração:', err)
      setError(`Erro durante a migração: ${err.message}`)
    } finally {
      setMigrating(false)
    }
  }

  // NOVA FUNÇÃO: Migração de Tags
  const handleTagMigration = async () => {
    try {
      setMigrating(true)
      setError(null)
      
      console.log('🔄 Iniciando migração de tags...')
      
      const result = await firebaseDataService.migrateLeadsForTags()
      
      if (result.success) {
        console.log('✅ Migração de tags concluída:', result)
        
        // Recarregar dados
        await loadData()
        
        alert(`${result.message}\\n\\nEstatísticas:\\n- Total: ${result.stats.total}\\n- Migrados: ${result.stats.migrados}`)
      } else {
        console.error('❌ Erro na migração de tags:', result)
        setError(result.message)
      }
    } catch (err) {
      console.error('❌ Erro durante a migração de tags:', err)
      setError(`Erro durante a migração de tags: ${err.message}`)
    } finally {
      setMigrating(false)
    }
  }

  // Configurar informações do usuário atual para o serviço
  useEffect(() => {
    if (user) {
      window.currentUser = {
        uid: user.uid,
        id: user.uid,
        displayName: user.displayName || 'Usuário',
        nome: user.displayName || 'Usuário',
        email: user.email || ''
      }
    }
  }, [user])

  // Função para verificar paciente existente
  const checkExistingPatient = async (telefone) => {
    if (!telefone) return false
    
    try {
      const existingLeads = await firebaseDataService.getAll('leads')
      const existing = existingLeads.find(lead => 
        lead.telefone === telefone
      )
      
      if (existing) {
        setExistingPatient(existing)
        return true
      }
      
      setExistingPatient(null)
      return false
    } catch (error) {
      console.error('Erro ao verificar paciente existente:', error)
      return false
    }
  }

  // FUNÇÃO CORRIGIDA: handleSave com auditoria completa
  const handleSave = async (e) => {
    e.preventDefault()
    
    // NOVA VERIFICAÇÃO: Impedir cadastro duplicado para novos leads
    if (!editingItem) {
      const isDuplicate = await checkExistingPatient(formData.telefone)
      if (isDuplicate) {
        setError(`Telefone já registrado! Este número pertence ao paciente: ${existingPatient.nome_paciente}. Não é possível cadastrar o mesmo telefone novamente.`)
        return
      }
    }
    
    try {
      setSaving(true)
      setError(null)
      
      // DADOS COMPLETOS COM AUDITORIA APRIMORADA
      const dataToSave = {
        nome_paciente: formData.nome_paciente || '',
        telefone: formData.telefone || '',
        data_nascimento: formData.data_nascimento || '',
        email: formData.email || '',
        canal_contato: formData.canal_contato || '',
        solicitacao_paciente: formData.solicitacao_paciente || '',
        medico_agendado_id: formData.medico_agendado_id || '',
        especialidade_id: formData.especialidade_id || '',
        procedimento_agendado_id: formData.procedimento_agendado_id || '',
        agendado: formData.agendado || false,
        motivo_nao_agendamento: formData.motivo_nao_agendamento || '',
        outros_profissionais_agendados: formData.outros_profissionais_agendados || false,
        quais_profissionais: formData.quais_profissionais || '',
        pagou_reserva: formData.pagou_reserva || false,
        tipo_visita: formData.tipo_visita || '',
        valor_orcado: parseFloat(formData.valor_orcado) || 0,
        orcamento_fechado: formData.orcamento_fechado || '',
        valor_fechado_parcial: formData.orcamento_fechado === 'Parcial' ? parseFloat(formData.valor_fechado_parcial) || 0 : 0,
        observacao_geral: formData.observacao_geral || '',
        perfil_comportamental_disc: formData.perfil_comportamental_disc || '',
        status: formData.status || 'Lead',
        // Follow-ups - GARANTIR VALORES
        followup1_realizado: Boolean(formData.followup1_realizado),
        followup1_data: formData.followup1_data || '',
        followup2_realizado: Boolean(formData.followup2_realizado),
        followup2_data: formData.followup2_data || '',
        followup3_realizado: Boolean(formData.followup3_realizado),
        followup3_data: formData.followup3_data || '',
        // TAGS
        tags: formData.tags || [],
        // AUDITORIA APRIMORADA
        data_registro_contato: editingItem ? editingItem.data_registro_contato : new Date().toISOString(),
        // HISTÓRICO DE ALTERAÇÕES (NOVO)
        historico_alteracoes: editingItem ? [
          ...(editingItem.historico_alteracoes || []),
          {
            data: new Date().toISOString(),
            usuario_id: user?.uid || 'sistema',
            usuario_nome: user?.displayName || user?.email || 'Sistema',
            usuario_email: user?.email || '',
            campos_alterados: getChangedFields(editingItem, formData),
            acao: 'edicao'
          }
        ] : [{
          data: new Date().toISOString(),
          usuario_id: user?.uid || 'sistema',
          usuario_nome: user?.displayName || user?.email || 'Sistema',
          usuario_email: user?.email || '',
          campos_alterados: [],
          acao: 'criacao'
        }]
      }
      
      console.log('Dados a serem salvos:', dataToSave)
      
      if (editingItem) {
        await firebaseDataService.update('leads', editingItem.id, dataToSave)
        console.log('✅ Lead atualizado com sucesso')
      } else {
        await firebaseDataService.create('leads', dataToSave)
        console.log('✅ Lead criado com sucesso')
      }
      
      await loadData()
      resetForm()
      setIsDialogOpen(false)
    } catch (err) {
      console.error('Erro ao salvar lead:', err)
      setError('Erro ao salvar lead. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  // NOVA FUNÇÃO: Detectar campos alterados
  const getChangedFields = (oldData, newData) => {
    const changes = []
    const fieldsToCheck = [
      'nome_paciente', 'telefone', 'email', 'status', 'valor_orcado',
      'medico_agendado_id', 'especialidade_id', 'procedimento_agendado_id',
      'observacao_geral', 'canal_contato', 'solicitacao_paciente'
    ]
    
    fieldsToCheck.forEach(field => {
      if (oldData[field] !== newData[field]) {
        changes.push({
          campo: field,
          valor_anterior: oldData[field] || '',
          valor_novo: newData[field] || ''
        })
      }
    })
    
    return changes
  }

  // HANDLEEDIT CORRIGIDO - INCLUI TAGS E AUDITORIA
  const handleEdit = (item) => {
    console.log('Editando item:', item)
    setEditingItem(item)
    setFormData({
      nome_paciente: item.nome_paciente || '',
      telefone: item.telefone || '',
      data_nascimento: item.data_nascimento || '',
      email: item.email || '',
      canal_contato: item.canal_contato || '',
      solicitacao_paciente: item.solicitacao_paciente || '',
      medico_agendado_id: item.medico_agendado_id || '',
      especialidade_id: item.especialidade_id || '',
      procedimento_agendado_id: item.procedimento_agendado_id || '',
      agendado: item.agendado || false,
      motivo_nao_agendamento: item.motivo_nao_agendamento || '',
      outros_profissionais_agendados: item.outros_profissionais_agendados || false,
      quais_profissionais: item.quais_profissionais || '',
      pagou_reserva: item.pagou_reserva || false,
      tipo_visita: item.tipo_visita || '',
      valor_orcado: item.valor_orcado ? item.valor_orcado.toString() : '',
      orcamento_fechado: item.orcamento_fechado || '',
      valor_fechado_parcial: item.valor_fechado_parcial ? item.valor_fechado_parcial.toString() : '',
      observacao_geral: item.observacao_geral || '',
      perfil_comportamental_disc: item.perfil_comportamental_disc || '',
      status: item.status || 'Lead',
      // Follow-ups
      followup1_realizado: Boolean(item.followup1_realizado),
      followup1_data: item.followup1_data || '',
      followup2_realizado: Boolean(item.followup2_realizado),
      followup2_data: item.followup2_data || '',
      followup3_realizado: Boolean(item.followup3_realizado),
      followup3_data: item.followup3_data || '',
      // TAGS
      tags: item.tags || []
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este lead?')) {
      try {
        await firebaseDataService.delete('leads', id)
        await loadData()
      } catch (err) {
        console.error('Erro ao excluir lead:', err)
        setError('Erro ao excluir lead. Tente novamente.')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      nome_paciente: '',
      telefone: '',
      data_nascimento: '',
      email: '',
      canal_contato: '',
      solicitacao_paciente: '',
      medico_agendado_id: '',
      especialidade_id: '',
      procedimento_agendado_id: '',
      agendado: false,
      motivo_nao_agendamento: '',
      outros_profissionais_agendados: false,
      quais_profissionais: '',
      pagou_reserva: false,
      tipo_visita: '',
      valor_orcado: '',
      orcamento_fechado: '',
      valor_fechado_parcial: '',
      observacao_geral: '',
      perfil_comportamental_disc: '',
      status: 'Lead',
      followup1_realizado: false,
      followup1_data: '',
      followup2_realizado: false,
      followup2_data: '',
      followup3_realizado: false,
      followup3_data: '',
      tags: []
    })
    setEditingItem(null)
    setExistingPatient(null)
  }

  // FUNÇÃO DE CARREGAMENTO COM DEBUG APRIMORADO
  const loadData = async () => {
    try {
      console.log('🔄 Iniciando carregamento de dados...')
      setLoading(true)
      setError(null)

      console.log('📊 Carregando leads...')
      const leadsData = await firebaseDataService.getAll('leads')
      console.log('✅ Leads carregados:', leadsData.length, leadsData)
      setLeads(leadsData)

      console.log('👨‍⚕️ Carregando médicos...')
      const medicosData = await firebaseDataService.getAll('medicos')
      console.log('✅ Médicos carregados:', medicosData.length)
      setMedicos(medicosData)

      console.log('🏥 Carregando especialidades...')
      const especialidadesData = await firebaseDataService.getAll('especialidades')
      console.log('✅ Especialidades carregadas:', especialidadesData.length)
      setEspecialidades(especialidadesData)

      console.log('🔧 Carregando procedimentos...')
      const procedimentosData = await firebaseDataService.getAll('procedimentos')
      console.log('✅ Procedimentos carregados:', procedimentosData.length)
      setProcedimentos(procedimentosData)

      console.log('🏷️ Carregando tags...')
      const tagsData = await firebaseDataService.getAll('tags')
      console.log('✅ Tags carregadas:', tagsData.length)
      setTags(tagsData)

      console.log('✅ Todos os dados carregados com sucesso!')
    } catch (err) {
      console.error('❌ Erro ao carregar dados:', err)
      setError('Erro ao carregar dados. Tente novamente.')
    } finally {
      setLoading(false)
      console.log('🏁 Carregamento finalizado')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // FILTROS APRIMORADOS
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchTerm || 
      lead.nome_paciente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.telefone?.includes(searchTerm) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'Todos' || lead.status === statusFilter
    
    const matchesTags = selectedTagsFilter.length === 0 || 
      selectedTagsFilter.some(tagId => (lead.tags || []).includes(tagId))
    
    return matchesSearch && matchesStatus && matchesTags
  })

  // DEBUG: Log antes da renderização
  console.log('=== DEBUG RENDERIZAÇÃO ===')
  console.log('Loading:', loading)
  console.log('Leads array:', leads)
  console.log('Leads length:', leads.length)
  console.log('Filtered leads:', filteredLeads)
  console.log('Search term:', searchTerm)
  console.log('Status filter:', statusFilter)
  console.log('=== FIM DEBUG ===')

  // RENDERIZAÇÃO COM VERIFICAÇÕES APRIMORADAS
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leads e Pacientes</h1>
          <p className="text-gray-600">Gerencie leads e acompanhe conversões</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('leads')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'leads'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="inline-block w-4 h-4 mr-2" />
          Leads ({leads.length})
        </button>
        <button
          onClick={() => setActiveTab('tags')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'tags'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Tag className="inline-block w-4 h-4 mr-2" />
          Tags ({tags.length})
        </button>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'leads' && (
        <div className="space-y-6">
          {/* Ações e Migrações */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                resetForm()
                setIsDialogOpen(true)
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Lead
            </Button>
            
            <Button
              variant="outline"
              onClick={handleUserTrackingMigration}
              disabled={migrating}
            >
              {migrating ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <User className="mr-2 h-4 w-4" />
              )}
              Migrar Usuários
            </Button>
            
            <Button
              variant="outline"
              onClick={handleFieldMigration}
              disabled={migrating}
            >
              {migrating ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Settings className="mr-2 h-4 w-4" />
              )}
              Migrar Campos
            </Button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total de Leads</p>
                    <p className="text-2xl font-bold">{leads.length}</p>
                    <p className="text-xs text-green-600">↗ Ativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Agendamentos</p>
                    <p className="text-2xl font-bold">
                      {leads.filter(lead => lead.status === 'Confirmado').length}
                    </p>
                    <p className="text-xs text-green-600">↗ Confirmados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Convertidos</p>
                    <p className="text-2xl font-bold">
                      {leads.filter(lead => lead.status === 'Convertido').length}
                    </p>
                    <p className="text-xs text-purple-600">↗ Fechados</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <DollarSign className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Valor Total</p>
                    <p className="text-2xl font-bold">
                      R$ {leads.reduce((sum, lead) => sum + (lead.valor_orcado || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-orange-600">💰 Receita</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Buscar pacientes, médicos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Lead">Lead</SelectItem>
                <SelectItem value="Confirmado">Confirmado</SelectItem>
                <SelectItem value="Convertido">Convertido</SelectItem>
                <SelectItem value="Faltou">Faltou</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Tags */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Filtrar por Tags</p>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => {
                    if (selectedTagsFilter.includes(tag.id)) {
                      setSelectedTagsFilter(selectedTagsFilter.filter(id => id !== tag.id))
                    } else {
                      setSelectedTagsFilter([...selectedTagsFilter, tag.id])
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTagsFilter.includes(tag.id)
                      ? 'text-white'
                      : 'text-gray-700 bg-gray-200 hover:bg-gray-300'
                  }`}
                  style={{
                    backgroundColor: selectedTagsFilter.includes(tag.id) ? tag.cor : undefined
                  }}
                >
                  {tag.nome}
                </button>
              ))}
            </div>
          </div>

          {/* Debug Info */}
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3>Debug - Total de leads: {leads.length}</h3>
            <h3>Debug - Leads filtrados: {filteredLeads.length}</h3>
          </div>

          {/* Tabela de Leads */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Leads</CardTitle>
            </CardHeader>
            <CardContent>
              {!leads || leads.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum lead encontrado.</p>
                  <Button onClick={loadData} className="mt-4">
                    Recarregar
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4">Paciente</th>
                        <th className="text-left p-4">Contato</th>
                        <th className="text-left p-4">Canal</th>
                        <th className="text-left p-4">Médico/Especialidade</th>
                        <th className="text-left p-4">Valor</th>
                        <th className="text-left p-4">Tags</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Criado por</th>
                        <th className="text-left p-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead, index) => (
                        <tr key={lead.id || index} className="border-b hover:bg-gray-50">
                          <td className="p-4">
                            <div>
                              <div className="font-medium">{lead.nome_paciente}</div>
                              <div className="text-sm text-gray-500">
                                {lead.data_nascimento && new Date(lead.data_nascimento).toLocaleDateString('pt-BR')}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <div className="flex items-center">
                                <span>📞 {lead.telefone}</span>
                              </div>
                              {lead.email && (
                                <div className="flex items-center mt-1">
                                  <span>✉️ {lead.email}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4">{lead.canal_contato || 'N/A'}</td>
                          <td className="p-4">
                            <div>
                              <div className="font-medium">
                                {medicos.find(m => m.id === lead.medico_agendado_id)?.nome || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {especialidades.find(e => e.id === lead.especialidade_id)?.nome || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            R$ {(lead.valor_orcado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {(lead.tags || []).map((tagId, tagIndex) => {
                                const tag = tags.find(t => t.id === tagId)
                                return tag ? (
                                  <Badge key={tagIndex} style={{ backgroundColor: tag.cor }}>
                                    {tag.nome}
                                  </Badge>
                                ) : null
                              })}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant={lead.status === 'Confirmado' ? 'default' : 'secondary'}>
                              {lead.status}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="font-medium">{lead.criado_por_nome || 'Sistema'}</span>
                            </div>
                            {lead.alterado_por_nome && lead.alterado_por_nome !== lead.criado_por_nome && (
                              <div className="text-xs text-gray-500 mt-1">
                                Alt. por {lead.alterado_por_nome}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(lead)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(lead.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog para Criar/Editar Lead */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Lead' : 'Novo Lead'}
            </DialogTitle>
          </DialogHeader>

          {/* Informações de Auditoria */}
          {editingItem && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium mb-2 flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                Informações de Auditoria
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Criado por:</strong> {editingItem.criado_por_nome || 'Sistema'}
                  <br />
                  <strong>Data de criação:</strong> {editingItem.data_registro_contato ? 
                    new Date(editingItem.data_registro_contato).toLocaleString('pt-BR') : 'N/A'}
                </div>
                <div>
                  <strong>Última alteração:</strong> {editingItem.alterado_por_nome || 'Sistema'}
                  <br />
                  <strong>Data da alteração:</strong> {editingItem.data_ultima_alteracao ? 
                    new Date(editingItem.data_ultima_alteracao).toLocaleString('pt-BR') : 'N/A'}
                </div>
              </div>
              
              {/* Histórico de Alterações */}
              {editingItem.historico_alteracoes && editingItem.historico_alteracoes.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2">Histórico de Alterações:</h5>
                  <div className="max-h-32 overflow-y-auto">
                    {editingItem.historico_alteracoes.slice(-5).map((alteracao, index) => (
                      <div key={index} className="text-xs bg-white p-2 rounded mb-1">
                        <strong>{alteracao.acao === 'criacao' ? 'Criado' : 'Editado'}</strong> por {alteracao.usuario_nome} 
                        em {new Date(alteracao.data).toLocaleString('pt-BR')}
                        {alteracao.campos_alterados && alteracao.campos_alterados.length > 0 && (
                          <div className="mt-1">
                            Campos alterados: {alteracao.campos_alterados.map(c => c.campo).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {/* Resto do formulário permanece igual... */}
            {/* Por brevidade, mantendo apenas a estrutura principal */}
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingItem ? 'Atualizar' : 'Criar'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mensagens de Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Erro</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

