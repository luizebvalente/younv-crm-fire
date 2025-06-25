// Serviço de dados híbrido Firebase/localStorage - VERSÃO MULTI-TENANT
import firestoreService from './firebase/firestore'

class FirebaseDataService {
  constructor() {
    this.useFirebase = true // Ativar Firebase
    this.currentClinicaId = null // NOVO - ID da clínica atual
    this.initializeData()
  }

  // NOVO - Definir clínica atual
  setCurrentClinicaId(clinicaId) {
    this.currentClinicaId = clinicaId
    console.log(`Clínica atual definida: ${clinicaId}`)
  }

  // NOVO - Obter clínica atual
  getCurrentClinicaId() {
    return this.currentClinicaId
  }

  // NOVO - Validar se clínica está definida
  validateClinicaId() {
    if (!this.currentClinicaId) {
      throw new Error('Clínica não definida. Faça login novamente.')
    }
    return this.currentClinicaId
  }

  // Mapeamento de nomes de coleções
  getCollectionName(entity) {
    const mapping = {
      'especialidades': 'especialidades',
      'medicos': 'medicos', 
      'procedimentos': 'procedimentos',
      'leads': 'leads'
    }
    return mapping[entity] || entity
  }

  // Transformar dados para formato Firebase (camelCase)
  transformToFirebase(entity, data) {
    if (entity === 'leads') {
      return {
        clinicaId: data.clinicaId, // NOVO - Sempre incluir clinicaId
        nomePackiente: data.nome_paciente,
        telefone: data.telefone,
        dataNascimento: data.data_nascimento,
        email: data.email,
        canalContato: data.canal_contato,
        solicitacaoPaciente: data.solicitacao_paciente,
        medicoAgendadoId: data.medico_agendado_id,
        especialidadeId: data.especialidade_id,
        procedimentoAgendadoId: data.procedimento_agendado_id,
        agendado: data.agendado,
        motivoNaoAgendamento: data.motivo_nao_agendamento,
        outrosProfissionaisAgendados: data.outros_profissionais_agendados,
        quaisProfissionais: data.quais_profissionais,
        pagouReserva: data.pagou_reserva,
        tipoVisita: data.tipo_visita,
        valorOrcado: data.valor_orcado,
        orcamentoFechado: data.orcamento_fechado,
        observacaoGeral: data.observacao_geral,
        perfilComportamentalDisc: data.perfil_comportamental_disc,
        status: data.status,
        dataRegistroContato: data.data_registro_contato
      }
    }
    
    // Para outras entidades, apenas adicionar clinicaId
    return {
      ...data,
      clinicaId: data.clinicaId // NOVO - Sempre incluir clinicaId
    }
  }

  // Transformar dados do Firebase para formato frontend (snake_case)
  transformFromFirebase(entity, data) {
    if (entity === 'leads') {
      return {
        id: data.id,
        clinicaId: data.clinicaId, // NOVO
        nome_paciente: data.nomePackiente || data.nome_paciente,
        telefone: data.telefone,
        data_nascimento: data.dataNascimento || data.data_nascimento,
        email: data.email,
        canal_contato: data.canalContato || data.canal_contato,
        solicitacao_paciente: data.solicitacaoPaciente || data.solicitacao_paciente,
        medico_agendado_id: data.medicoAgendadoId || data.medico_agendado_id,
        especialidade_id: data.especialidadeId || data.especialidade_id,
        procedimento_agendado_id: data.procedimentoAgendadoId || data.procedimento_agendado_id,
        agendado: data.agendado,
        motivo_nao_agendamento: data.motivoNaoAgendamento || data.motivo_nao_agendamento,
        outros_profissionais_agendados: data.outrosProfissionaisAgendados || data.outros_profissionais_agendados,
        quais_profissionais: data.quaisProfissionais || data.quais_profissionais,
        pagou_reserva: data.pagouReserva || data.pagou_reserva,
        tipo_visita: data.tipoVisita || data.tipo_visita,
        valor_orcado: data.valorOrcado || data.valor_orcado,
        orcamento_fechado: data.orcamentoFechado || data.orcamento_fechado,
        observacao_geral: data.observacaoGeral || data.observacao_geral,
        perfil_comportamental_disc: data.perfilComportamentalDisc || data.perfil_comportamental_disc,
        status: data.status,
        data_registro_contato: data.dataRegistroContato || data.data_registro_contato,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      }
    }
    
    // Para outras entidades, retornar como está
    return {
      ...data,
      clinicaId: data.clinicaId // NOVO - Manter clinicaId
    }
  }

  // Inicializar dados padrão
  async initializeData() {
    if (this.useFirebase) {
      // Inicialização será feita por clínica específica
      console.log('Firebase ativo - inicialização por clínica')
    } else {
      this.initializeLocalStorageData()
    }
  }

  // NOVO - Inicializar dados padrão para uma clínica específica
  async initializeDataForClinica(clinicaId) {
    if (this.useFirebase) {
      await firestoreService.initializeDefaultDataForClinica(clinicaId)
    }
  }

  initializeLocalStorageData() {
    // Dados padrão para localStorage (mantido para compatibilidade)
    if (!localStorage.getItem('younv_especialidades')) {
      const especialidades = [
        { id: '1', nome: 'Dermatologia', descricao: 'Cuidados com a pele', ativo: true },
        { id: '2', nome: 'Cardiologia', descricao: 'Cuidados cardíacos', ativo: true }
      ]
      localStorage.setItem('younv_especialidades', JSON.stringify(especialidades))
    }

    if (!localStorage.getItem('younv_medicos')) {
      const medicos = [
        { 
          id: '1', 
          nome: 'Dr. João Silva', 
          crm: '12345-SP', 
          telefone: '(11) 99999-9999',
          email: 'joao@clinica.com',
          especialidade_id: '1',
          ativo: true,
          data_cadastro: new Date().toISOString()
        }
      ]
      localStorage.setItem('younv_medicos', JSON.stringify(medicos))
    }

    if (!localStorage.getItem('younv_procedimentos')) {
      const procedimentos = [
        { 
          id: '1', 
          nome: 'Consulta Dermatológica', 
          valor: 200, 
          duracao: 30, 
          categoria: 'Consulta',
          especialidade_id: '1',
          ativo: true
        }
      ]
      localStorage.setItem('younv_procedimentos', JSON.stringify(procedimentos))
    }

    if (!localStorage.getItem('younv_leads')) {
      localStorage.setItem('younv_leads', JSON.stringify([]))
    }
  }

  // Métodos genéricos para CRUD - MODIFICADOS PARA MULTI-TENANT

  async getAll(entity) {
    if (this.useFirebase) {
      try {
        const clinicaId = this.validateClinicaId()
        
        // Buscar apenas dados da clínica atual
        const data = await firestoreService.getAllByClinica(
          this.getCollectionName(entity), 
          clinicaId
        )
        
        console.log(`Dados brutos do Firebase para ${entity} (clínica ${clinicaId}):`, data)
        
        // Transformar dados do Firebase para formato frontend
        const transformedData = data.map(item => this.transformFromFirebase(entity, item))
        console.log(`Dados transformados para ${entity}:`, transformedData)
        
        return transformedData
      } catch (error) {
        console.error('Erro ao buscar dados do Firebase, usando localStorage como fallback:', error)
        return this.getFromLocalStorage(entity)
      }
    } else {
      return this.getFromLocalStorage(entity)
    }
  }

  async getById(entity, id) {
    if (this.useFirebase) {
      try {
        const clinicaId = this.validateClinicaId()
        
        // Buscar e validar se pertence à clínica
        const data = await firestoreService.getByIdAndClinica(
          this.getCollectionName(entity), 
          id, 
          clinicaId
        )
        
        return data ? this.transformFromFirebase(entity, data) : null
      } catch (error) {
        console.error('Erro ao buscar dados do Firebase, usando localStorage como fallback:', error)
        const items = this.getFromLocalStorage(entity)
        return items.find(item => item.id === id)
      }
    } else {
      const items = this.getFromLocalStorage(entity)
      return items.find(item => item.id === id)
    }
  }

  async create(entity, item) {
    if (this.useFirebase) {
      try {
        const clinicaId = this.validateClinicaId()
        
        // Adicionar clinicaId ao item
        const itemWithClinica = {
          ...item,
          clinicaId: clinicaId
        }
        
        // Transformar dados para o formato Firebase
        const firebaseData = this.transformToFirebase(entity, itemWithClinica)
        console.log(`Criando no Firebase - ${entity}:`, firebaseData)
        
        const result = await firestoreService.create(
          this.getCollectionName(entity), 
          firebaseData
        )
        console.log(`Resultado da criação no Firebase:`, result)
        
        return this.transformFromFirebase(entity, result)
      } catch (error) {
        console.error('Erro ao criar no Firebase, usando localStorage como fallback:', error)
        return this.createInLocalStorage(entity, item)
      }
    } else {
      return this.createInLocalStorage(entity, item)
    }
  }

  async update(entity, id, updatedItem) {
    if (this.useFirebase) {
      try {
        const clinicaId = this.validateClinicaId()
        
        // Garantir que clinicaId não seja alterado
        const itemWithClinica = {
          ...updatedItem,
          clinicaId: clinicaId
        }
        
        // Transformar dados para o formato Firebase
        const firebaseData = this.transformToFirebase(entity, itemWithClinica)
        
        // Atualizar validando clínica
        const result = await firestoreService.updateByClinica(
          this.getCollectionName(entity), 
          id, 
          firebaseData, 
          clinicaId
        )
        
        return this.transformFromFirebase(entity, result)
      } catch (error) {
        console.error('Erro ao atualizar no Firebase, usando localStorage como fallback:', error)
        return this.updateInLocalStorage(entity, id, updatedItem)
      }
    } else {
      return this.updateInLocalStorage(entity, id, updatedItem)
    }
  }

  async delete(entity, id) {
    if (this.useFirebase) {
      try {
        const clinicaId = this.validateClinicaId()
        
        // Deletar validando clínica
        return await firestoreService.deleteByClinica(
          this.getCollectionName(entity), 
          id, 
          clinicaId
        )
      } catch (error) {
        console.error('Erro ao deletar no Firebase, usando localStorage como fallback:', error)
        return this.deleteFromLocalStorage(entity, id)
      }
    } else {
      return this.deleteFromLocalStorage(entity, id)
    }
  }

  // Métodos localStorage (fallback) - mantidos sem alteração
  getFromLocalStorage(entity) {
    const key = `younv_${entity}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  }

  createInLocalStorage(entity, item) {
    const items = this.getFromLocalStorage(entity)
    const newItem = {
      ...item,
      id: Date.now().toString(),
      data_registro_contato: item.data_registro_contato || new Date().toISOString()
    }
    items.push(newItem)
    localStorage.setItem(`younv_${entity}`, JSON.stringify(items))
    return newItem
  }

  updateInLocalStorage(entity, id, updatedItem) {
    const items = this.getFromLocalStorage(entity)
    const index = items.findIndex(item => item.id === id)
    if (index !== -1) {
      items[index] = { ...items[index], ...updatedItem }
      localStorage.setItem(`younv_${entity}`, JSON.stringify(items))
      return items[index]
    }
    return null
  }

  deleteFromLocalStorage(entity, id) {
    const items = this.getFromLocalStorage(entity)
    const filteredItems = items.filter(item => item.id !== id)
    localStorage.setItem(`younv_${entity}`, JSON.stringify(filteredItems))
    return true
  }

  // Métodos específicos para relatórios - MODIFICADOS PARA MULTI-TENANT

  async getLeadsByPeriod(startDate, endDate) {
    if (this.useFirebase) {
      try {
        const clinicaId = this.validateClinicaId()
        
        const data = await firestoreService.getLeadsByPeriodAndClinica(
          startDate, 
          endDate, 
          clinicaId
        )
        
        return data.map(item => this.transformFromFirebase('leads', item))
      } catch (error) {
        console.error('Erro ao buscar leads por período no Firebase:', error)
        const leads = this.getFromLocalStorage('leads')
        return leads.filter(lead => {
          const leadDate = new Date(lead.data_registro_contato)
          return leadDate >= new Date(startDate) && leadDate <= new Date(endDate)
        })
      }
    } else {
      const leads = this.getFromLocalStorage('leads')
      return leads.filter(lead => {
        const leadDate = new Date(lead.data_registro_contato)
        return leadDate >= new Date(startDate) && leadDate <= new Date(endDate)
      })
    }
  }

  async getConversionRate() {
    if (this.useFirebase) {
      try {
        const clinicaId = this.validateClinicaId()
        return await firestoreService.getConversionRateByClinica(clinicaId)
      } catch (error) {
        console.error('Erro ao calcular taxa de conversão no Firebase:', error)
        const leads = this.getFromLocalStorage('leads')
        const total = leads.length
        const converted = leads.filter(lead => lead.status === 'Convertido').length
        return total > 0 ? (converted / total * 100).toFixed(1) : 0
      }
    } else {
      const leads = this.getFromLocalStorage('leads')
      const total = leads.length
      const converted = leads.filter(lead => lead.status === 'Convertido').length
      return total > 0 ? (converted / total * 100).toFixed(1) : 0
    }
  }

  // NOVO - Obter leads por canal (filtrado por clínica)
  async getLeadsByChannel() {
    if (this.useFirebase) {
      try {
        const clinicaId = this.validateClinicaId()
        return await firestoreService.getLeadsByChannelAndClinica(clinicaId)
      } catch (error) {
        console.error('Erro ao buscar leads por canal no Firebase:', error)
        const leads = this.getFromLocalStorage('leads')
        const channels = {}
        leads.forEach(lead => {
          channels[lead.canal_contato] = (channels[lead.canal_contato] || 0) + 1
        })
        return channels
      }
    } else {
      const leads = this.getFromLocalStorage('leads')
      const channels = {}
      leads.forEach(lead => {
        channels[lead.canal_contato] = (channels[lead.canal_contato] || 0) + 1
      })
      return channels
    }
  }

  // NOVO - Obter estatísticas por médico (filtrado por clínica)
  async getMedicoStats() {
    if (this.useFirebase) {
      try {
        const clinicaId = this.validateClinicaId()
        return await firestoreService.getMedicoStatsByClinica(clinicaId)
      } catch (error) {
        console.error('Erro ao buscar estatísticas por médico no Firebase:', error)
        // Fallback para localStorage
        const leads = this.getFromLocalStorage('leads')
        const medicos = this.getFromLocalStorage('medicos')
        
        const stats = {}
        medicos.forEach(medico => {
          const medicoLeads = leads.filter(lead => lead.medico_agendado_id === medico.id)
          stats[medico.nome] = {
            total_leads: medicoLeads.length,
            agendados: medicoLeads.filter(lead => lead.agendado).length,
            convertidos: medicoLeads.filter(lead => lead.status === 'Convertido').length
          }
        })
        
        return stats
      }
    } else {
      const leads = this.getFromLocalStorage('leads')
      const medicos = this.getFromLocalStorage('medicos')
      
      const stats = {}
      medicos.forEach(medico => {
        const medicoLeads = leads.filter(lead => lead.medico_agendado_id === medico.id)
        stats[medico.nome] = {
          total_leads: medicoLeads.length,
          agendados: medicoLeads.filter(lead => lead.agendado).length,
          convertidos: medicoLeads.filter(lead => lead.status === 'Convertido').length
        }
      })
      
      return stats
    }
  }
}

export default new FirebaseDataService()

