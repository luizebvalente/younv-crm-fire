import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Users, Calendar, DollarSign, TrendingUp, Check, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useFirestore } from '@/hooks/useFirestore'
import firebaseDataService from '@/services/firebaseDataService'

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [medicos, setMedicos] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [procedimentos, setProcedimentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [error, setError] = useState(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [existingPatient, setExistingPatient] = useState(null)

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
    followup3_data: ''
  })

  // Função para migração usando o serviço centralizado
  const handleFieldMigration = async () => {
    try {
      setMigrating(true)
      setError(null)
      
      console.log('🚀 Iniciando migração via serviço...')
      
      // Usar a função de migração do serviço
      const result = await firebaseDataService.migrateLeadsFields()
      
      if (result.success) {
        console.log('✅ Migração concluída:', result)
        
        // Recarregar dados
        await loadData()
        
        // Mostrar resultado para o usuário
        alert(`${result.message}\n\nEstatísticas:\n- Total: ${result.stats.total}\n- Migrados: ${result.stats.migrated}\n- Erros: ${result.stats.errors}`)
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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [leadsData, medicosData, especialidadesData, procedimentosData] = await Promise.all([
        firebaseDataService.getAll('leads'),
        firebaseDataService.getAll('medicos'),
        firebaseDataService.getAll('especialidades'),
        firebaseDataService.getAll('procedimentos')
      ])
      
      setLeads(leadsData)
      setMedicos(medicosData)
      setEspecialidades(especialidadesData)
      setProcedimentos(procedimentosData)
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
      setError('Erro ao carregar dados. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const checkExistingPatient = async (telefone) => {
    if (!telefone || telefone.length < 10) {
      setExistingPatient(null)
      return
    }

    try {
      const cleanPhone = telefone.replace(/\D/g, '')
      const existingLead = leads.find(lead => 
        lead.telefone && lead.telefone.replace(/\D/g, '') === cleanPhone
      )
      
      if (existingLead && (!editingItem || existingLead.id !== editingItem.id)) {
        setExistingPatient(existingLead)
        setFormData(prev => ({ ...prev, tipo_visita: 'Recorrente' }))
      } else {
        setExistingPatient(null)
        setFormData(prev => ({ ...prev, tipo_visita: 'Primeira Visita' }))
      }
    } catch (err) {
      console.error('Erro ao verificar paciente existente:', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.nome_paciente || !formData.telefone || !formData.email) {
      setError('Por favor, preencha todos os campos obrigatórios.')
      return
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
        // Follow-ups - GARANTIR VALORES
        followup1_realizado: Boolean(formData.followup1_realizado),
        followup1_data: formData.followup1_data || '',
        followup2_realizado: Boolean(formData.followup2_realizado),
        followup2_data: formData.followup2_data || '',
        followup3_realizado: Boolean(formData.followup3_realizado),
        followup3_data: formData.followup3_data || '',
        data_registro_contato: editingItem ? editingItem.data_registro_contato : new Date().toISOString()
      }
      
      console.log('Dados a serem salvos:', dataToSave)
      
      if (editingItem) {
        await firebaseDataService.update('leads', editingItem.id, dataToSave)
      } else {
        await firebaseDataService.create('leads', dataToSave)
      }
      
      await loadData()
      resetForm()
    } catch (err) {
      console.error('Erro ao salvar lead:', err)
      setError('Erro ao salvar lead. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

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
      // Follow-ups - VALORES SEGUROS
      followup1_realizado: Boolean(item.followup1_realizado),
      followup1_data: item.followup1_data || '',
      followup2_realizado: Boolean(item.followup2_realizado),
      followup2_data: item.followup2_data || '',
      followup3_realizado: Boolean(item.followup3_realizado),
      followup3_data: item.followup3_data || ''
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id) => {
    if (confirm('Tem certeza que deseja excluir este lead?')) {
      try {
        setError(null)
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
      // Follow-ups
      followup1_realizado: false,
      followup1_data: '',
      followup2_realizado: false,
      followup2_data: '',
      followup3_realizado: false,
      followup3_data: ''
    })
    setEditingItem(null)
    setIsDialogOpen(false)
    setExistingPatient(null)
  }

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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.nome_paciente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lead.telefone?.includes(searchTerm) ||
                         lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'Todos' || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: leads.length,
    agendados: leads.filter(lead => lead.status === 'Agendado').length,
    convertidos: leads.filter(lead => lead.status === 'Convertido').length,
    valorTotal: leads.filter(lead => lead.status === 'Convertido')
                    .reduce((sum, lead) => sum + (lead.valor_orcado || 0), 0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Carregando leads...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads e Pacientes</h1>
          <p className="text-muted-foreground">Gerencie leads e acompanhe conversões</p>
        </div>
        <div className="flex gap-2">
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
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
              </DialogHeader>
              
              {existingPatient && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Paciente Recorrente Detectado!
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        Este telefone já está cadastrado para: <strong>{existingPatient.nome_paciente}</strong>
                        <br />
                        Status anterior: {existingPatient.status}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados Pessoais */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dados Pessoais</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Nome do Paciente *</label>
                      <Input
                        value={formData.nome_paciente}
                        onChange={(e) => setFormData({...formData, nome_paciente: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Telefone *</label>
                      <Input
                        value={formData.telefone}
                        onChange={(e) => {
                          setFormData({...formData, telefone: e.target.value})
                          checkExistingPatient(e.target.value)
                        }}
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">E-mail *</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Data de Nascimento *</label>
                      <Input
                        type="date"
                        value={formData.data_nascimento}
                        onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Canal de Contato</label>
                      <Select value={formData.canal_contato} onValueChange={(value) => setFormData({...formData, canal_contato: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o canal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Instagram">Instagram</SelectItem>
                          <SelectItem value="Google">Google</SelectItem>
                          <SelectItem value="Facebook">Facebook</SelectItem>
                          <SelectItem value="Indicação">Indicação</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo de Visita</label>
                      <Select value={formData.tipo_visita} onValueChange={(value) => setFormData({...formData, tipo_visita: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo de visita" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Primeira Visita">Primeira Visita</SelectItem>
                          <SelectItem value="Recorrente">Recorrente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Lead">Lead</SelectItem>
                          <SelectItem value="Convertido">Convertido</SelectItem>
                          <SelectItem value="Perdido">Perdido</SelectItem>
                          <SelectItem value="Agendado">Agendado</SelectItem>
                          <SelectItem value="Não Agendou">Não Agendou</SelectItem>
                          <SelectItem value="Confirmado">Confirmado</SelectItem>
                          <SelectItem value="Faltou">Faltou</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Solicitação e Atendimento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Solicitação e Atendimento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Solicitação do Paciente</label>
                      <Textarea
                        value={formData.solicitacao_paciente}
                        onChange={(e) => setFormData({...formData, solicitacao_paciente: e.target.value})}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Médico</label>
                        <Select value={formData.medico_agendado_id} onValueChange={(value) => setFormData({...formData, medico_agendado_id: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o médico" />
                          </SelectTrigger>
                          <SelectContent>
                            {medicos.map((medico) => (
                              <SelectItem key={medico.id} value={medico.id}>
                                {medico.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Especialidade</label>
                        <Select value={formData.especialidade_id} onValueChange={(value) => setFormData({...formData, especialidade_id: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a especialidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {especialidades.map((especialidade) => (
                              <SelectItem key={especialidade.id} value={especialidade.id}>
                                {especialidade.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Procedimento</label>
                        <Select value={formData.procedimento_agendado_id} onValueChange={(value) => setFormData({...formData, procedimento_agendado_id: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o procedimento" />
                          </SelectTrigger>
                          <SelectContent>
                            {procedimentos.map((procedimento) => (
                              <SelectItem key={procedimento.id} value={procedimento.id}>
                                {procedimento.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Orçamento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Orçamento</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Valor Orçado (R$)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.valor_orcado}
                        onChange={(e) => setFormData({...formData, valor_orcado: e.target.value})}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Status do Orçamento</label>
                      <Select value={formData.orcamento_fechado} onValueChange={(value) => setFormData({...formData, orcamento_fechado: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Status do orçamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Total">Total</SelectItem>
                          <SelectItem value="Parcial">Parcial</SelectItem>
                          <SelectItem value="Não">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.orcamento_fechado === 'Parcial' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Valor Fechado Parcial (R$)</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.valor_fechado_parcial}
                          onChange={(e) => setFormData({...formData, valor_fechado_parcial: e.target.value})}
                          placeholder="0,00"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Follow-ups */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Follow-ups</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((num) => (
                      <div key={num} className="space-y-3">
                        <label className="text-sm font-medium">Follow-up {num}</label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={formData[`followup${num}_realizado`]}
                            onCheckedChange={(checked) => 
                              setFormData({...formData, [`followup${num}_realizado`]: checked})
                            }
                          />
                          <label className="text-sm">Realizado</label>
                        </div>
                        {formData[`followup${num}_realizado`] && (
                          <Input
                            type="date"
                            value={formData[`followup${num}_data`]}
                            onChange={(e) => setFormData({...formData, [`followup${num}_data`]: e.target.value})}
                          />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Observações */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Observações Gerais</label>
                      <Textarea
                        value={formData.observacao_geral}
                        onChange={(e) => setFormData({...formData, observacao_geral: e.target.value})}
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : editingItem ? 'Atualizar Lead' : 'Criar Lead'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alerta de Migração */}
      {!migrating && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <RefreshCw className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                Migração de Campos Firebase
              </h3>
              <div className="mt-2 text-sm text-orange-700">
                Se os campos de follow-up e orçamento parcial não estão funcionando, clique em <strong>"Migrar Campos"</strong> para adicionar os campos ausentes diretamente no Firebase.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.agendados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.convertidos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pacientes, médicos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Lead">Lead</SelectItem>
            <SelectItem value="Agendado">Agendado</SelectItem>
            <SelectItem value="Convertido">Convertido</SelectItem>
            <SelectItem value="Perdido">Perdido</SelectItem>
            <SelectItem value="Não Agendou">Não Agendou</SelectItem>
            <SelectItem value="Confirmado">Confirmado</SelectItem>
            <SelectItem value="Faltou">Faltou</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Paciente</th>
                  <th className="text-left p-4">Contato</th>
                  <th className="text-left p-4">Canal</th>
                  <th className="text-left p-4">Médico/Especialidade</th>
                  <th className="text-left p-4">Valor</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
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
                      <td className="p-4">
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
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
        </CardContent>
      </Card>
    </div>
  )
}

