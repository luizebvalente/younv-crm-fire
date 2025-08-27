import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Users, Calendar, DollarSign, TrendingUp, Check, RefreshCw, X, Tag, Settings, AlertTriangle, User, Clock, Eye, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
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
  // Estados principais
  const [leads, setLeads] = useState([])
  const [medicos, setMedicos] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [procedimentos, setProcedimentos] = useState([])
  const [tags, setTags] = useState([])
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalLeads, setTotalLeads] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [lastDoc, setLastDoc] = useState(null)
  
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [criadoPorFilter, setCriadoPorFilter] = useState('Todos')
  const [selectedTagsFilter, setSelectedTagsFilter] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: 'Todos',
    criadoPor: 'Todos',
    tags: []
  })
  
  // Estados para UI
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [saving, setSaving] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [error, setError] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [existingPatient, setExistingPatient] = useState(null)
  const [activeTab, setActiveTab] = useState('leads')
  
  // Estados para tags
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState(null)
  const [tagForm, setTagForm] = useState({
    nome: '',
    cor: '#3b82f6',
    categoria: 'Procedimento'
  })

  // Hook de autenticação
  const { user } = useAuth()

  // Form data para leads
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
    followup1_realizado: false,
    followup1_data: '',
    followup2_realizado: false,
    followup2_data: '',
    followup3_realizado: false,
    followup3_data: '',
    tags: []
  })

  // Configurar dados do usuário para o serviço
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

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData()
  }, [])

  // Aplicar filtros quando mudarem
  useEffect(() => {
    if (shouldApplyFilters()) {
      applyFiltersAndReload()
    }
  }, [searchTerm, statusFilter, criadoPorFilter, selectedTagsFilter])

  // Função para carregar dados iniciais (médicos, especialidades, etc.)
  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Carregando dados iniciais...')
      
      const [medicosData, especialidadesData, procedimentosData, tagsData] = await Promise.all([
        firebaseDataService.getAll('medicos'),
        firebaseDataService.getAll('especialidades'),
        firebaseDataService.getAll('procedimentos'),
        firebaseDataService.getAll('tags')
      ])
      
      setMedicos(medicosData)
      setEspecialidades(especialidadesData)
      setProcedimentos(procedimentosData)
      setTags(tagsData)
      
      console.log('✅ Dados iniciais carregados')
      
      // Carregar primeira página de leads
      await loadLeadsPage(1, true)
      
    } catch (err) {
      console.error('Erro ao carregar dados iniciais:', err)
      setError('Erro ao carregar dados. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Função para carregar página de leads
  const loadLeadsPage = async (page = 1, reset = false, filters = null) => {
    try {
      if (reset) {
        setLoading(true)
        setLeads([])
        setCurrentPage(1)
        setLastDoc(null)
      } else {
        setLoadingMore(true)
      }
      
      setError(null)
      
      console.log(`🔍 Carregando página ${page} de leads...`)
      
      // Usar filtros fornecidos ou os aplicados atualmente
      const currentFilters = filters || appliedFilters
      
      // Montar options para paginação
      const options = {
        pageSize,
        lastDoc: reset ? null : lastDoc,
        orderByField: 'data_registro_contato',
        orderDirection: 'desc',
        filters: []
      }
      
      // Aplicar filtros no Firestore se possível
      if (currentFilters.status !== 'Todos') {
        options.filters.push({
          field: 'status',
          operator: '==',
          value: currentFilters.status
        })
      }
      
      if (currentFilters.criadoPor !== 'Todos') {
        options.filters.push({
          field: 'criado_por_id',
          operator: '==',
          value: currentFilters.criadoPor
        })
      }
      
      let result
      
      // Se há busca por texto, usar busca global
      if (currentFilters.search.trim().length > 0) {
        result = await firebaseDataService.searchGlobal('leads', currentFilters.search, options)
        // Para busca, não temos paginação real, então simular
        const startIndex = (page - 1) * pageSize
        const endIndex = startIndex + pageSize
        
        result = {
          data: result.data.slice(startIndex, endIndex),
          hasMore: endIndex < result.total,
          pageSize,
          lastDoc: null // Busca não usa lastDoc
        }
      } else {
        // Usar paginação normal
        result = await firebaseDataService.getPaginated('leads', options)
      }
      
      console.log(`📊 Página ${page} carregada: ${result.data.length} leads`)
      
      // Extrair usuários únicos para filtro
      const uniqueUsers = [...new Map(
        result.data
          .filter(lead => lead.criado_por_nome && lead.criado_por_id)
          .map(lead => [lead.criado_por_id, { id: lead.criado_por_id, nome: lead.criado_por_nome }])
      ).values()]
      
      if (uniqueUsers.length > 0) {
        setUsuarios(prev => {
          const existingIds = new Set(prev.map(u => u.id))
          const newUsers = uniqueUsers.filter(u => !existingIds.has(u.id))
          return [...prev, ...newUsers]
        })
      }
      
      // Aplicar filtros de tags localmente (pois não é eficiente no Firestore)
      let filteredData = result.data
      if (currentFilters.tags.length > 0) {
        filteredData = filteredData.filter(lead => 
          currentFilters.tags.every(tagId => lead.tags?.includes(tagId))
        )
      }
      
      if (reset) {
        setLeads(filteredData)
        setTotalLeads(filteredData.length)
        setCurrentPage(1)
      } else {
        setLeads(prev => [...prev, ...filteredData])
        setTotalLeads(prev => prev + filteredData.length)
        setCurrentPage(page)
      }
      
      setHasMore(result.hasMore)
      setLastDoc(result.lastDoc)
      
    } catch (err) {
      console.error('Erro ao carregar leads:', err)
      setError('Erro ao carregar leads. Tente novamente.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Verificar se deve aplicar filtros
  const shouldApplyFilters = () => {
    return (
      searchTerm !== appliedFilters.search ||
      statusFilter !== appliedFilters.status ||
      criadoPorFilter !== appliedFilters.criadoPor ||
      JSON.stringify(selectedTagsFilter) !== JSON.stringify(appliedFilters.tags)
    )
  }

  // Aplicar filtros e recarregar
  const applyFiltersAndReload = useCallback(async () => {
    const newFilters = {
      search: searchTerm.trim(),
      status: statusFilter,
      criadoPor: criadoPorFilter,
      tags: [...selectedTagsFilter]
    }
    
    console.log('🔍 Aplicando filtros:', newFilters)
    
    setAppliedFilters(newFilters)
    await loadLeadsPage(1, true, newFilters)
  }, [searchTerm, statusFilter, criadoPorFilter, selectedTagsFilter, pageSize])

  // Limpar todos os filtros
  const clearAllFilters = async () => {
    console.log('🧹 Limpando todos os filtros')
    
    setSearchTerm('')
    setStatusFilter('Todos')
    setCriadoPorFilter('Todos')
    setSelectedTagsFilter([])
    
    const resetFilters = {
      search: '',
      status: 'Todos',
      criadoPor: 'Todos',
      tags: []
    }
    
    setAppliedFilters(resetFilters)
    await loadLeadsPage(1, true, resetFilters)
  }

  // Carregar mais leads (paginação)
  const loadMore = async () => {
    if (!hasMore || loadingMore) return
    await loadLeadsPage(currentPage + 1, false)
  }

  // Ver todos os leads (aumentar pageSize)
  const viewAllLeads = async () => {
    setPageSize(100) // Aumentar para 100 por página
    await loadLeadsPage(1, true)
  }

  // Resetar para paginação padrão
  const resetPagination = async () => {
    setPageSize(20) // Voltar para 20 por página
    await loadLeadsPage(1, true)
  }

  // Migração de campos
  const handleFieldMigration = async () => {
    try {
      setMigrating(true)
      setError(null)
      
      const result = await firebaseDataService.migrateLeadsFields()
      
      if (result.success) {
        await loadLeadsPage(1, true) // Recarregar após migração
        alert(`${result.message}\n\nEstatísticas:\n- Total: ${result.stats.total}\n- Migrados: ${result.stats.migrated}\n- Erros: ${result.stats.errors}`)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(`Erro durante a migração: ${err.message}`)
    } finally {
      setMigrating(false)
    }
  }

  // Migração de rastreamento de usuário
  const handleUserTrackingMigration = async () => {
    try {
      setMigrating(true)
      setError(null)
      
      const result = await firebaseDataService.migrateLeadsForUserTracking()
      
      if (result.success) {
        await loadLeadsPage(1, true) // Recarregar após migração
        alert(`${result.message}\n\nEstatísticas:\n- Total: ${result.stats.total}\n- Migrados: ${result.stats.migrated}\n- Erros: ${result.stats.errors}`)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError(`Erro durante a migração: ${err.message}`)
    } finally {
      setMigrating(false)
    }
  }

  // Verificar paciente existente
  const checkExistingPatient = async (telefone) => {
    if (!telefone || telefone.length < 10) {
      setExistingPatient(null)
      return false
    }

    try {
      // Buscar apenas nos leads já carregados para performance
      const cleanPhone = telefone.replace(/\D/g, '')
      const existingLead = leads.find(lead => 
        lead.telefone && lead.telefone.replace(/\D/g, '') === cleanPhone
      )
      
      if (existingLead && (!editingItem || existingLead.id !== editingItem.id)) {
        setExistingPatient(existingLead)
        setFormData(prev => ({ ...prev, tipo_visita: 'Recorrente' }))
        return true
      } else {
        setExistingPatient(null)
        setFormData(prev => ({ ...prev, tipo_visita: 'Primeira Visita' }))
        return false
      }
    } catch (err) {
      console.error('Erro ao verificar paciente existente:', err)
      return false
    }
  }

  // Submeter formulário de lead
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Verificar duplicação para novos leads
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
        followup1_realizado: Boolean(formData.followup1_realizado),
        followup1_data: formData.followup1_data || '',
        followup2_realizado: Boolean(formData.followup2_realizado),
        followup2_data: formData.followup2_data || '',
        followup3_realizado: Boolean(formData.followup3_realizado),
        followup3_data: formData.followup3_data || '',
        tags: formData.tags || [],
        data_registro_contato: editingItem ? editingItem.data_registro_contato : new Date().toISOString()
      }
      
      if (editingItem) {
        await firebaseDataService.update('leads', editingItem.id, dataToSave)
        // Atualizar o lead na lista local
        setLeads(prev => prev.map(lead => 
          lead.id === editingItem.id ? { ...lead, ...dataToSave } : lead
        ))
      } else {
        const newLead = await firebaseDataService.create('leads', dataToSave)
        // Adicionar novo lead no início da lista
        setLeads(prev => [newLead, ...prev])
        setTotalLeads(prev => prev + 1)
      }
      
      resetForm()
    } catch (err) {
      console.error('Erro ao salvar lead:', err)
      setError('Erro ao salvar lead. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  // Editar lead
  const handleEdit = (item) => {
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
      followup1_realizado: Boolean(item.followup1_realizado),
      followup1_data: item.followup1_data || '',
      followup2_realizado: Boolean(item.followup2_realizado),
      followup2_data: item.followup2_data || '',
      followup3_realizado: Boolean(item.followup3_realizado),
      followup3_data: item.followup3_data || '',
      tags: item.tags || []
    })
    setIsDialogOpen(true)
  }

  // Deletar lead
  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      try {
        setError(null)
        await firebaseDataService.delete('leads', id)
        
        // Remover da lista local
        setLeads(prev => prev.filter(lead => lead.id !== id))
        setTotalLeads(prev => prev - 1)
      } catch (err) {
        console.error('Erro ao excluir lead:', err)
        setError('Erro ao excluir lead. Tente novamente.')
      }
    }
  }

  // Resetar formulário
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
    setIsDialogOpen(false)
    setExistingPatient(null)
  }

  // Funções auxiliares
  const getStatusColor = (status) => {
    const colors = {
      'Lead': 'bg-blue-100 text-blue-800',
      'Convertido': 'bg-green-100 text-green-800',
      'Perdido': 'bg-red-100 text-red-800',
      'Agendado': 'bg-yellow-100 text-yellow-800',
      'Não Agendou': 'bg-gray-100 text-gray-800',
      'Confirmado': 'bg-purple-100 text-purple-800',
      'Faltou': 'bg-orange-100 text-orange-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Não informado'
    
    try {
      const date = new Date(dateString)
      return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Data inválida'
    }
  }

  const toggleTagFilter = (tagId) => {
    if (selectedTagsFilter.includes(tagId)) {
      setSelectedTagsFilter(selectedTagsFilter.filter(id => id !== tagId))
    } else {
      setSelectedTagsFilter([...selectedTagsFilter, tagId])
    }
  }

  const getTagById = (tagId) => tags.find(tag => tag.id === tagId)

  // Estatísticas baseadas nos leads carregados
  const stats = useMemo(() => {
    return {
      total: totalLeads,
      loaded: leads.length,
      agendados: leads.filter(lead => lead.status === 'Agendado').length,
      convertidos: leads.filter(lead => lead.status === 'Convertido').length,
      valorTotal: leads.filter(lead => lead.status === 'Convertido')
                      .reduce((sum, lead) => sum + (lead.valor_orcado || 0), 0)
    }
  }, [leads, totalLeads])

  // Verificar se tem filtros ativos
  const hasActiveFilters = useMemo(() => {
    return appliedFilters.search !== '' ||
           appliedFilters.status !== 'Todos' ||
           appliedFilters.criadoPor !== 'Todos' ||
           appliedFilters.tags.length > 0
  }, [appliedFilters])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando leads...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads e Pacientes</h1>
          <p className="text-muted-foreground">
            Gerencie leads e acompanhe conversões
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <span>📊 {stats.loaded} de {stats.total} carregados</span>
            {hasActiveFilters && (
              <Badge variant="secondary">Filtros ativos</Badge>
            )}
            {pageSize > 20 && (
              <Badge variant="outline">Modo visualização expandida</Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleUserTrackingMigration} 
            disabled={migrating}
            variant="outline"
            className="bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100"
          >
            {migrating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Migrando...
              </>
            ) : (
              <>
                <User className="mr-2 h-4 w-4" />
                Migrar Usuários
              </>
            )}
          </Button>
          
          <Button 
            onClick={handleFieldMigration} 
            disabled={migrating}
            variant="outline"
            className="bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100"
          >
            {migrating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Migrando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Migrar Campos
              </>
            )}
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Lead
              </Button>
            </DialogTrigger>
            {/* Dialog content será adicionado aqui - mantendo o mesmo do código original */}
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              Leads Carregados
            </CardTitle>
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.loaded}</div>
            <p className="text-sm text-gray-600 mt-2 flex items-center">
              {hasActiveFilters ? (
                <>
                  <Filter className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-blue-600 font-medium">de {stats.total} total</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600 font-medium">Total carregado</span>
                </>
              )}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Agendamentos</CardTitle>
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.agendados}</div>
            <p className="text-sm text-gray-600 mt-2 flex items-center">
              <Calendar className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">Confirmados</span>
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Convertidos</CardTitle>
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{stats.convertidos}</div>
            <p className="text-sm text-gray-600 mt-2 flex items-center">
              <TrendingUp className="h-4 w-4 text-purple-600 mr-1" />
              <span className="text-purple-600 font-medium">Fechados</span>
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">Valor Total</CardTitle>
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              R$ {stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-gray-600 mt-2 flex items-center">
              <DollarSign className="h-4 w-4 text-orange-600 mr-1" />
              <span className="text-orange-600 font-medium">Receita</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="bg-gray-50">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">Filtros</CardTitle>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              )}
              
              {pageSize === 20 ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={viewAllLeads}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Todos
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetPagination}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                  <MoreHorizontal className="h-4 w-4 mr-2" />
                  Paginar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primeira linha de filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Status</SelectItem>
                <SelectItem value="Lead">Lead</SelectItem>
                <SelectItem value="Agendado">Agendado</SelectItem>
                <SelectItem value="Convertido">Convertido</SelectItem>
                <SelectItem value="Perdido">Perdido</SelectItem>
                <SelectItem value="Não Agendou">Não Agendou</SelectItem>
                <SelectItem value="Confirmado">Confirmado</SelectItem>
                <SelectItem value="Faltou">Faltou</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={criadoPorFilter} onValueChange={setCriadoPorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por criador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Usuários</SelectItem>
                {usuarios.map(usuario => (
                  <SelectItem key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtros de Tags */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Filtrar por Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTagFilter(tag.id)}
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border-2 transition-all ${
                      selectedTagsFilter.includes(tag.id)
                        ? 'text-white border-transparent'
                        : 'text-gray-700 bg-white border-gray-300 hover:border-gray-400'
                    }`}
                    style={{
                      backgroundColor: selectedTagsFilter.includes(tag.id) ? tag.cor : 'white',
                      borderColor: selectedTagsFilter.includes(tag.id) ? tag.cor : '#d1d5db'
                    }}
                  >
                    <Tag className="h-3 w-3" />
                    {tag.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Indicador de Filtros Ativos */}
          {hasActiveFilters && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Filter className="h-4 w-4" />
                  <span className="font-medium">Filtros ativos:</span>
                  {appliedFilters.search && <Badge variant="secondary">Busca: "{appliedFilters.search}"</Badge>}
                  {appliedFilters.status !== 'Todos' && <Badge variant="secondary">Status: {appliedFilters.status}</Badge>}
                  {appliedFilters.criadoPor !== 'Todos' && (
                    <Badge variant="secondary">
                      Criado por: {usuarios.find(u => u.id === appliedFilters.criadoPor)?.nome}
                    </Badge>
                  )}
                  {appliedFilters.tags.length > 0 && (
                    <Badge variant="secondary">{appliedFilters.tags.length} tags</Badge>
                  )}
                </div>
                <span className="text-sm text-blue-600 font-medium">
                  {stats.loaded} de {stats.total} leads
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Leads */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Leads</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>{leads.length} lead{leads.length !== 1 ? 's' : ''} exibido{leads.length !== 1 ? 's' : ''}</span>
              </div>
              
              {/* Controles de Paginação */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  Página {Math.ceil(leads.length / pageSize)} • {pageSize} por página
                </span>
                
                {hasMore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4 mr-2" />
                        Ver Mais
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {leads.length === 0 ? (
            <div className="text-center py-12">
              {hasActiveFilters ? (
                <>
                  <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lead encontrado</h3>
                  <p className="text-gray-600 mb-4">Tente ajustar os filtros para ver mais resultados</p>
                  <Button onClick={clearAllFilters} variant="outline">
                    Limpar todos os filtros
                  </Button>
                </>
              ) : (
                <>
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum lead cadastrado</h3>
                  <p className="text-gray-600 mb-4">Comece criando seu primeiro lead</p>
                  <Button onClick={() => resetForm()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar primeiro lead
                  </Button>
                </>
              )}
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
                  {leads.map((lead) => {
                    const medico = medicos.find(m => m.id === lead.medico_agendado_id)
                    const especialidade = especialidades.find(e => e.id === lead.especialidade_id)
                    
                    return (
                      <tr key={lead.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{lead.nome_paciente}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(lead.data_registro_contato).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <div>📞 {lead.telefone}</div>
                            <div>✉️ {lead.email}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm">{lead.canal_contato}</span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <div className="font-medium">{medico?.nome || 'N/A'}</div>
                            <div className="text-gray-500">{especialidade?.nome || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-medium">
                            R$ {(lead.valor_orcado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </td>
                        
                        {/* Nova coluna de Tags */}
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {lead.tags?.map(tagId => {
                              const tag = getTagById(tagId)
                              return tag ? (
                                <span
                                  key={tagId}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-white text-xs font-medium"
                                  style={{ backgroundColor: tag.cor }}
                                  title={tag.nome}
                                >
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag.nome.length > 8 ? tag.nome.substring(0, 8) + '...' : tag.nome}
                                </span>
                              ) : null
                            })}
                            {(!lead.tags || lead.tags.length === 0) && (
                              <span className="text-xs text-gray-400">Sem tags</span>
                            )}
                          </div>
                        </td>
                        
                        <td className="p-4">
                          <Badge className={getStatusColor(lead.status)}>
                            {lead.status}
                          </Badge>
                        </td>

                        {/* Coluna: Criado por */}
                        <td className="p-4">
                          <div className="text-sm">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="font-medium">{lead.criado_por_nome || 'Sistema'}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDateTime(lead.data_registro_contato)}
                            </div>
                            {lead.alterado_por_nome && lead.alterado_por_nome !== lead.criado_por_nome && (
                              <div className="text-xs text-gray-400 mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Alt. por {lead.alterado_por_nome}
                                </span>
                              </div>
                            )}
                          </div>
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer com informações de paginação */}
          {leads.length > 0 && (
            <div className="mt-6 pt-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Exibindo {leads.length} de {stats.total} leads
                {hasActiveFilters && (
                  <span className="text-blue-600 ml-1">(filtrados)</span>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                {loadingMore && (
                  <div className="flex items-center text-sm text-gray-500">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Carregando mais leads...
                  </div>
                )}
                
                {hasMore && !loadingMore && (
                  <Button
                    onClick={loadMore}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Carregar Mais ({pageSize} leads)
                  </Button>
                )}
                
                {!hasMore && leads.length > 0 && !hasActiveFilters && (
                  <span className="text-sm text-green-600 font-medium">
                    ✅ Todos os leads carregados
                  </span>
                )}
                
                {!hasMore && hasActiveFilters && (
                  <span className="text-sm text-blue-600 font-medium">
                    🔍 Todos os resultados filtrados
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações de Performance */}
      {stats.loaded > 50 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Performance:</span>
              <span>
                {stats.loaded} leads carregados. 
                {pageSize > 20 
                  ? " Considere usar paginação para melhor performance." 
                  : " Performance otimizada com paginação."
                }
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
