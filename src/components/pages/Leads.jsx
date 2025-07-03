import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Edit, Trash2, UserPlus, Phone, Mail, Calendar, DollarSign, Filter, Loader2 } from 'lucide-react'
import firebaseDataService from '@/services/firebaseDataService'

const Leads = () => {
  const [leads, setLeads] = useState([])
  const [medicos, setMedicos] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [procedimentos, setProcedimentos] = useState([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
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
    observacao_geral: '',
    perfil_comportamental_disc: '',
    status: 'Lead'
  })

  const canaisContato = ['Instagram', 'Google', 'Facebook', 'Indicação', 'Outros']
  const tiposVisita = ['Primeira Visita', 'Recorrente']
  const statusOrcamento = ['Total', 'Parcial', 'Não']
  const statusLead = ['Lead', 'Agendado', 'Convertido', 'Perdido']
  const perfisDISC = ['Dominante', 'Influente', 'Estável', 'Consciente']

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
      
      console.log('Leads carregados:', leadsData) // Debug log
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

  const getMedicoNome = (id) => {
    if (!id) return 'N/A'
    const medico = medicos.find(m => m.id === id)
    return medico ? medico.nome : 'N/A'
  }

  const getEspecialidadeNome = (id) => {
    if (!id) return 'N/A'
    const especialidade = especialidades.find(e => e.id === id)
    return especialidade ? especialidade.nome : 'N/A'
  }

  const getProcedimentoNome = (id) => {
    if (!id) return 'N/A'
    const procedimento = procedimentos.find(p => p.id === id)
    return procedimento ? procedimento.nome : 'N/A'
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusColor = (status) => {
    const colors = {
      'Lead': 'bg-blue-100 text-blue-800',
      'Agendado': 'bg-yellow-100 text-yellow-800',
      'Convertido': 'bg-green-100 text-green-800',
      'Perdido': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setError(null)
      
      // Preparar dados garantindo que todos os campos sejam incluídos
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
        observacao_geral: formData.observacao_geral || '',
        perfil_comportamental_disc: formData.perfil_comportamental_disc || '',
        status: formData.status || 'Lead',
        data_registro_contato: editingItem ? editingItem.data_registro_contato : new Date().toISOString()
      }
      
      console.log('Dados a serem salvos:', dataToSave) // Debug log
      
      if (editingItem) {
        await firebaseDataService.update('leads', editingItem.id, dataToSave)
      } else {
        const result = await firebaseDataService.create('leads', dataToSave)
        console.log('Lead criado:', result) // Debug log
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
    console.log('Editando item:', item) // Debug log
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
      valor_orcado: item.valor_orcado?.toString() || '',
      orcamento_fechado: item.orcamento_fechado || '',
      observacao_geral: item.observacao_geral || '',
      perfil_comportamental_disc: item.perfil_comportamental_disc || '',
      status: item.status || 'Lead'
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
      observacao_geral: '',
      perfil_comportamental_disc: '',
      status: 'Lead'
    })
    setEditingItem(null)
    setIsDialogOpen(false)
    setError(null)
  }

  const filteredLeads = filterStatus === 'all' 
    ? leads 
    : leads.filter(lead => lead.status === filterStatus)

  const totalLeads = leads.length
  const agendados = leads.filter(l => l.agendado).length
  const convertidos = leads.filter(l => l.status === 'Convertido').length
  const valorTotal = leads.reduce((sum, lead) => sum + (lead.valor_orcado || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando leads...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads e Pacientes</h1>
          <p className="text-gray-600">Gerencie leads e acompanhe conversões</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Editar Lead' : 'Novo Lead'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome_paciente">Nome do Paciente</Label>
                  <Input
                    id="nome_paciente"
                    value={formData.nome_paciente}
                    onChange={(e) => setFormData({...formData, nome_paciente: e.target.value})}
                    required
                    disabled={saving}
                  />
                </div>
                <div>
                   <Label htmlFor="telefone">Telefone</Label>
                        <Input
    id="telefone"
    value={formData.telefone}
    onChange={(e) => {
      const numbers = e.target.value.replace(/\D/g, '');
      let formatted = '';
      
      if (numbers.length <= 2) {
        formatted = numbers;
      } else if (numbers.length <= 7) {
        formatted = `(${numbers.slice(0, 2)})${numbers.slice(2)}`;
      } else if (numbers.length <= 11) {
        formatted = `(${numbers.slice(0, 2)})${numbers.slice(2, 7)}-${numbers.slice(7)}`;
      } else {
        formatted = `(${numbers.slice(0, 2)})${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
      }
      
      setFormData({...formData, telefone: formatted});
    }}
    placeholder="(XX)XXXXX-XXXX"
    maxLength={14}
    disabled={saving}
  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                    disabled={saving}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="canal_contato">Canal de Contato</Label>
                  <Select 
                    value={formData.canal_contato} 
                    onValueChange={(value) => setFormData({...formData, canal_contato: value})}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o canal" />
                    </SelectTrigger>
                    <SelectContent>
                      {canaisContato.map((canal) => (
                        <SelectItem key={canal} value={canal}>
                          {canal}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({...formData, status: value})}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusLead.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="solicitacao_paciente">Solicitação do Paciente</Label>
                <Textarea
                  id="solicitacao_paciente"
                  value={formData.solicitacao_paciente}
                  onChange={(e) => setFormData({...formData, solicitacao_paciente: e.target.value})}
                  rows={3}
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="medico">Médico</Label>
                  <Select 
                    value={formData.medico_agendado_id} 
                    onValueChange={(value) => setFormData({...formData, medico_agendado_id: value})}
                    disabled={saving}
                  >
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
                <div>
                  <Label htmlFor="especialidade">Especialidade</Label>
                  <Select 
                    value={formData.especialidade_id} 
                    onValueChange={(value) => setFormData({...formData, especialidade_id: value})}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a especialidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {especialidades.map((esp) => (
                        <SelectItem key={esp.id} value={esp.id}>
                          {esp.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="procedimento">Procedimento</Label>
                  <Select 
                    value={formData.procedimento_agendado_id} 
                    onValueChange={(value) => setFormData({...formData, procedimento_agendado_id: value})}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o procedimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {procedimentos.map((proc) => (
                        <SelectItem key={proc.id} value={proc.id}>
                          {proc.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valor_orcado">Valor Orçado (R$)</Label>
                  <Input
                    id="valor_orcado"
                    type="number"
                    step="0.01"
                    value={formData.valor_orcado}
                    onChange={(e) => setFormData({...formData, valor_orcado: e.target.value})}
                    disabled={saving}
                  />
                </div>
                <div>
                  <Label htmlFor="orcamento_fechado">Orçamento Fechado</Label>
                  <Select 
                    value={formData.orcamento_fechado} 
                    onValueChange={(value) => setFormData({...formData, orcamento_fechado: value})}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status do orçamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOrcamento.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="observacao_geral">Observações Gerais</Label>
                <Textarea
                  id="observacao_geral"
                  value={formData.observacao_geral}
                  onChange={(e) => setFormData({...formData, observacao_geral: e.target.value})}
                  rows={3}
                  disabled={saving}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agendamentos</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agendados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Convertidos</CardTitle>
            <UserPlus className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertidos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorTotal)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Leads</CardTitle>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {statusLead.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhum lead encontrado.</p>
              <p className="text-gray-400 text-sm">Clique em "Novo Lead" para começar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead>Médico/Especialidade</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{lead.nome_paciente || 'N/A'}</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(lead.data_registro_contato)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-1" />
                          {lead.telefone || 'N/A'}
                        </div>
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1" />
                          {lead.email || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.canal_contato || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{getMedicoNome(lead.medico_agendado_id)}</div>
                        <div className="text-sm text-gray-500">
                          {getEspecialidadeNome(lead.especialidade_id)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(lead.valor_orcado)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status || 'Lead'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Leads

