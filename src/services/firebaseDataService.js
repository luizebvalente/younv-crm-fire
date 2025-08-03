// Serviço de dados híbrido Firebase/localStorage - VERSÃO COMPLETA COM AUDITORIA E TAGS
import firestoreService from './firebase/firestore'
import { auth } from '@/config/firebase' // Ajuste o caminho conforme sua estrutura

class FirebaseDataService {
  constructor() {
    this.useFirebase = true // Ativar Firebase
    this.initializeData()
  }

  // Mapeamento de nomes de coleções
  getCollectionName(entity) {
    const mapping = {
      'especialidades': 'especialidades',
      'medicos': 'medicos', 
      'procedimentos': 'procedimentos',
      'leads': 'leads',
      'tags': 'tags'
    }
    return mapping[entity] || entity
  }

  // ==========================================
  // SISTEMA DE AUDITORIA
  // ==========================================

  /**
   * Obtém o usuário atual autenticado
   * @returns {Object|null} Dados do usuário atual ou null
   */
  async getCurrentUser() {
    try {
      return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe()
          if (user) {
            resolve({
              id: user.uid,
              nome: user.displayName || user.email.split('@')[0],
              email: user.email
            })
          } else {
            // Fallback para desenvolvimento/teste
            resolve({
              id: 'user_temp',
              nome: 'Usuário Temporário',
              email: 'temp@exemplo.com'
            })
          }
        })
      })
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error)
      // Fallback para desenvolvimento
      return {
        id: 'user_temp',
        nome: 'Usuário Temporário',
        email: 'temp@exemplo.com'
      }
    }
  }

  /**
   * Migração para adicionar campos de auditoria aos leads existentes
   * @returns {Object} Resultado da migração
   */
  async migrateLeadsForAudit() {
    try {
      console.log('🚀 Iniciando migração de auditoria para leads...')
      
      const leads = await this.getAll('leads')
      let migrated = 0
      let errors = 0
      
      const currentUser = await this.getCurrentUser()
      const migrationUser = {
        id: currentUser?.id || 'migration_system',
        nome: currentUser?.nome || 'Sistema de Migração',
        email: currentUser?.email || 'sistema@migracao.com'
      }

      for (const lead of leads) {
        try {
          // Verificar se já possui campos de auditoria
          if (lead.created_by || lead.audit_trail) {
            console.log(`Lead ${lead.id} já possui auditoria, pulando...`)
            continue
          }

          // Criar entrada inicial de auditoria
          const initialAuditEntry = {
            timestamp: lead.data_registro_contato || new Date().toISOString(),
            user: migrationUser,
            action: 'CREATE',
            changes: {
              type: 'migration_creation',
              data: {
                nome_paciente: lead.nome_paciente,
                telefone: lead.telefone,
                status: lead.status,
                canal_contato: lead.canal_contato
              }
            }
          }

          // Dados de auditoria para adicionar
          const auditData = {
            created_at: lead.data_registro_contato || new Date().toISOString(),
            created_by: migrationUser,
            audit_trail: [initialAuditEntry]
          }
          
          await this.update('leads', lead.id, { ...lead, ...auditData })
          migrated++
          
          console.log(`✅ Lead ${lead.id} migrado com sucesso`)
          
        } catch (error) {
          console.error(`❌ Erro ao migrar lead ${lead.id}:`, error)
          errors++
        }
      }

      const result = {
        success: true,
        message: `Migração de auditoria concluída! ${migrated} leads migrados, ${errors} erros.`,
        stats: {
          total: leads.length,
          migrated,
          errors
        }
      }

      console.log('✅ Migração de auditoria concluída:', result)
      return result

    } catch (error) {
      console.error('❌ Erro na migração de auditoria:', error)
      return {
        success: false,
        message: `Erro na migração: ${error.message}`,
        stats: { total: 0, migrated: 0, errors: 1 }
      }
    }
  }

  /**
   * Busca leads com informações de auditoria expandidas
   * @returns {Array} Lista de leads com dados de auditoria
   */
  async getLeadsWithAudit() {
    try {
      const leads = await this.getAll('leads')
      
      // Enriquecer dados de auditoria se necessário
      return leads.map(lead => ({
        ...lead,
        audit_summary: this.getAuditSummary(lead)
      }))
    } catch (error) {
      console.error('Erro ao buscar leads com auditoria:', error)
      throw error
    }
  }

  /**
   * Gera resumo de auditoria para um lead
   * @param {Object} lead - Dados do lead
   * @returns {Object} Resumo da auditoria
   */
  getAuditSummary(lead) {
    if (!lead.audit_trail || lead.audit_trail.length === 0) {
      return {
        total_changes: 0,
        last_modified: null,
        created_by_name: 'Desconhecido',
        last_modified_by_name: null
      }
    }

    const sortedAudit = lead.audit_trail.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )

    const lastEntry = sortedAudit[0]
    const firstEntry = sortedAudit[sortedAudit.length - 1]

    return {
      total_changes: lead.audit_trail.length,
      last_modified: lastEntry.timestamp,
      created_by_name: firstEntry.user.nome,
      last_modified_by_name: lastEntry.action !== 'CREATE' ? lastEntry.user.nome : null,
      has_multiple_editors: new Set(lead.audit_trail.map(entry => entry.user.id)).size > 1
    }
  }

  /**
   * Busca histórico completo de um lead específico
   * @param {string} leadId - ID do lead
   * @returns {Object} Lead com histórico completo
   */
  async getLeadWithFullHistory(leadId) {
    try {
      const lead = await this.getById('leads', leadId)
      
      if (!lead) {
        throw new Error('Lead não encontrado')
      }

      return {
        ...lead,
        audit_summary: this.getAuditSummary(lead),
        formatted_history: this.formatAuditHistory(lead.audit_trail || [])
      }
    } catch (error) {
      console.error('Erro ao buscar histórico do lead:', error)
      throw error
    }
  }

  /**
   * Formata o histórico de auditoria para exibição
   * @param {Array} auditTrail - Lista de entradas de auditoria
   * @returns {Array} Histórico formatado
   */
  formatAuditHistory(auditTrail) {
    return auditTrail
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .map(entry => ({
        ...entry,
        formatted_date: new Date(entry.timestamp).toLocaleString('pt-BR'),
        action_description: this.getActionDescription(entry.action, entry.changes),
        changes_count: entry.changes ? Object.keys(entry.changes).length : 0
      }))
  }

  /**
   * Gera descrição da ação para exibição
   * @param {string} action - Tipo de ação (CREATE, UPDATE, DELETE)
   * @param {Object} changes - Objeto com as mudanças
   * @returns {string} Descrição da ação
   */
  getActionDescription(action, changes) {
    switch (action) {
      case 'CREATE':
        return 'Lead criado no sistema'
      case 'UPDATE':
        if (!changes || Object.keys(changes).length === 0) {
          return 'Lead atualizado'
        }
        const changedFields = Object.keys(changes)
        if (changedFields.length === 1) {
          return `Alterou ${this.getFieldDisplayName(changedFields[0])}`
        }
        return `Alterou ${changedFields.length} campos: ${changedFields.map(f => this.getFieldDisplayName(f)).join(', ')}`
      case 'DELETE':
        return 'Lead removido do sistema'
      default:
        return 'Ação desconhecida'
    }
  }

  /**
   * Converte nome do campo técnico para nome amigável
   * @param {string} fieldName - Nome técnico do campo
   * @returns {string} Nome amigável do campo
   */
  getFieldDisplayName(fieldName) {
    const fieldMap = {
      'nome_paciente': 'Nome do Paciente',
      'telefone': 'Telefone',
      'email': 'E-mail',
      'status': 'Status',
      'canal_contato': 'Canal de Contato',
      'medico_agendado_id': 'Médico',
      'especialidade_id': 'Especialidade',
      'procedimento_agendado_id': 'Procedimento',
      'valor_orcado': 'Valor Orçado',
      'orcamento_fechado': 'Status do Orçamento',
      'valor_fechado_parcial': 'Valor Parcial',
      'tags': 'Tags',
      'observacao_geral': 'Observações',
      'tipo_visita': 'Tipo de Visita',
      'agendado': 'Agendamento',
      'pagou_reserva': 'Pagamento de Reserva',
      'data_nascimento': 'Data de Nascimento',
      'solicitacao_paciente': 'Solicitação do Paciente'
    }
    return fieldMap[fieldName] || fieldName
  }

  // Transformar dados para formato Firebase (camelCase)
  transformToFirebase(entity, data) {
    if (entity === 'leads') {
      return {
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
        valorFechadoParcial: data.valor_fechado_parcial || 0,
        followup1Realizado: data.followup1_realizado || false,
        followup1Data: data.followup1_data || '',
        followup2Realizado: data.followup2_realizado || false,
        followup2Data: data.followup2_data || '',
        followup3Realizado: data.followup3_realizado || false,
        followup3Data: data.followup3_data || '',
        observacaoGeral: data.observacao_geral,
        perfilComportamentalDisc: data.perfil_comportamental_disc,
        status: data.status,
        dataRegistroContato: data.data_registro_contato,
        tags: data.tags || [],
        // NOVOS: Campos de auditoria
        createdAt: data.created_at,
        createdBy: data.created_by,
        modifiedAt: data.modified_at,
        modifiedBy: data.modified_by,
        auditTrail: data.audit_trail || []
      }
    }
    if (entity === 'tags') {
      return {
        nome: data.nome,
        cor: data.cor,
        categoria: data.categoria,
        dataCriacao: data.data_criacao || new Date().toISOString(),
        ativo: data.ativo !== undefined ? data.ativo : true
      }
    }
    return data
  }

  // Transformar dados do Firebase para formato frontend (snake_case)
  transformFromFirebase(entity, data) {
    if (entity === 'leads') {
      return {
        id: data.id,
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
        valor_fechado_parcial: data.valorFechadoParcial || data.valor_fechado_parcial || 0,
        followup1_realizado: data.followup1Realizado || data.followup1_realizado || false,
        followup1_data: data.followup1Data || data.followup1_data || '',
        followup2_realizado: data.followup2Realizado || data.followup2_realizado || false,
        followup2_data: data.followup2Data || data.followup2_data || '',
        followup3_realizado: data.followup3Realizado || data.followup3_realizado || false,
        followup3_data: data.followup3Data || data.followup3_data || '',
        observacao_geral: data.observacaoGeral || data.observacao_geral,
        perfil_comportamental_disc: data.perfilComportamentalDisc || data.perfil_comportamental_disc,
        status: data.status,
        data_registro_contato: data.dataRegistroContato || data.data_registro_contato,
        tags: data.tags || [],
        // NOVOS: Campos de auditoria
        created_at: data.createdAt || data.created_at,
        created_by: data.createdBy || data.created_by,
        modified_at: data.modifiedAt || data.modified_at,
        modified_by: data.modifiedBy || data.modified_by,
        audit_trail: data.auditTrail || data.audit_trail || [],
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      }
    }
    if (entity === 'tags') {
      return {
        id: data.id,
        nome: data.nome,
        cor: data.cor,
        categoria: data.categoria,
        data_criacao: data.dataCriacao || data.data_criacao,
        ativo: data.ativo !== undefined ? data.ativo : true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      }
    }
    return data
  }

  // ==========================================
  // FUNÇÕES PARA TAGS
  // ==========================================

  async migrateLeadsForTags() {
    if (!this.useFirebase) {
      console.log('Migração só funciona com Firebase ativo')
      return { success: false, message: 'Firebase não está ativo' }
    }

    try {
      console.log('🔄 Iniciando migração de tags...')
      
      const rawLeads = await firestoreService.getAll('leads')
      console.log(`📊 Encontrados ${rawLeads.length} leads para análise`)
      
      let migrated = 0
      let total = rawLeads.length
      const errors = []

      for (const lead of rawLeads) {
        try {
          if (!lead.hasOwnProperty('tags')) {
            const updatedLead = {
              ...lead,
              tags: []
            }
            
            await firestoreService.update('leads', lead.id, updatedLead)
            migrated++
            console.log(`✅ Lead ${lead.nomePackiente || lead.nome_paciente} migrado`)
          }
        } catch (leadError) {
          console.error(`❌ Erro ao migrar lead ${lead.id}:`, leadError)
          errors.push({
            leadId: lead.id,
            error: leadError.message
          })
        }
      }

      console.log(`🎉 Migração de tags concluída!`)
      console.log(`📈 Estatísticas: ${migrated} de ${total} leads migrados`)

      return {
        success: true,
        message: `Migração concluída! ${migrated} de ${total} leads atualizados.`,
        stats: { total, migrated, errors: errors.length }
      }
    } catch (error) {
      console.error('❌ Erro na migração de tags:', error)
      return {
        success: false,
        message: `Erro na migração: ${error.message}`,
        stats: { total: 0, migrated: 0, errors: 1 }
      }
    }
  }

  async createTag(tagData) {
    if (!this.useFirebase) {
      console.log('Tags só funcionam com Firebase ativo')
      throw new Error('Firebase não está ativo')
    }

    try {
      const firebaseData = this.transformToFirebase('tags', tagData)
      const result = await firestoreService.create('tags', firebaseData)
      
      console.log('✅ Tag criada:', result.id)
      return { success: true, id: result.id }
    } catch (error) {
      console.error('❌ Erro ao criar tag:', error)
      throw error
    }
  }

  async updateTag(id, tagData) {
    if (!this.useFirebase) {
      console.log('Tags só funcionam com Firebase ativo')
      throw new Error('Firebase não está ativo')
    }

    try {
      const firebaseData = this.transformToFirebase('tags', tagData)
      await firestoreService.update('tags', id, firebaseData)
      
      console.log('✅ Tag atualizada:', id)
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao atualizar tag:', error)
      throw error
    }
  }

  async deleteTag(id) {
    if (!this.useFirebase) {
      console.log('Tags só funcionam com Firebase ativo')
      throw new Error('Firebase não está ativo')
    }

    try {
      console.log('🗑️ Excluindo tag:', id)
      
      const rawLeads = await firestoreService.getAll('leads')
      let leadsUpdated = 0
      
      for (const lead of rawLeads) {
        if (lead.tags && lead.tags.includes(id)) {
          const updatedTags = lead.tags.filter(tagId => tagId !== id)
          await firestoreService.update('leads', lead.id, {
            ...lead,
            tags: updatedTags
          })
          leadsUpdated++
        }
      }
      
      await firestoreService.delete('tags', id)
      
      console.log(`✅ Tag excluída. ${leadsUpdated} leads atualizados.`)
      return { success: true, leadsUpdated }
    } catch (error) {
      console.error('❌ Erro ao excluir tag:', error)
      throw error
    }
  }

  async updateLeadTags(leadId, tags) {
    if (!this.useFirebase) {
      console.log('Tags só funcionam com Firebase ativo')
      throw new Error('Firebase não está ativo')
    }

    try {
      const currentLead = await firestoreService.getById('leads', leadId)
      if (!currentLead) {
        throw new Error('Lead não encontrado')
      }

      const updatedLead = {
        ...currentLead,
        tags: tags || []
      }

      await firestoreService.update('leads', leadId, updatedLead)
      
      console.log('✅ Tags do lead atualizadas:', leadId)
      return { success: true }
    } catch (error) {
      console.error('❌ Erro ao atualizar tags do lead:', error)
      throw error
    }
  }

  async getLeadsByTags(tagIds) {
    if (!this.useFirebase) {
      console.log('Tags só funcionam com Firebase ativo')
      return []
    }

    try {
      const rawLeads = await firestoreService.getAll('leads')
      const filteredLeads = []
      
      for (const lead of rawLeads) {
        if (lead.tags && tagIds.some(tagId => lead.tags.includes(tagId))) {
          const transformedLead = this.transformFromFirebase('leads', lead)
          filteredLeads.push(transformedLead)
        }
      }
      
      return filteredLeads
    } catch (error) {
      console.error('❌ Erro ao buscar leads por tags:', error)
      throw error
    }
  }

  async createDefaultTags() {
    if (!this.useFirebase) {
      console.log('Tags só funcionam com Firebase ativo')
      throw new Error('Firebase não está ativo')
    }

    try {
      const defaultTags = [
        { nome: 'Flacidez', cor: '#ef4444', categoria: 'Procedimento' },
        { nome: 'Ginecologia', cor: '#ec4899', categoria: 'Especialidade' },
        { nome: 'Botox', cor: '#8b5cf6', categoria: 'Procedimento' },
        { nome: 'Preenchimento', cor: '#06b6d4', categoria: 'Procedimento' },
        { nome: 'Harmonização', cor: '#10b981', categoria: 'Procedimento' },
        { nome: 'Urgente', cor: '#f59e0b', categoria: 'Prioridade' },
        { nome: 'VIP', cor: '#10b981', categoria: 'Tipo Cliente' },
        { nome: 'Primeira Visita', cor: '#3b82f6', categoria: 'Tipo Cliente' },
        { nome: 'Recorrente', cor: '#6366f1', categoria: 'Tipo Cliente' },
        { nome: 'Follow-up', cor: '#f97316', categoria: 'Prioridade' }
      ]

      const createdTags = []
      let errors = []

      for (const tagData of defaultTags) {
        try {
          const result = await this.createTag(tagData)
          createdTags.push({ id: result.id, ...tagData })
        } catch (error) {
          console.error(`Erro ao criar tag ${tagData.nome}:`, error)
          errors.push({ tag: tagData.nome, error: error.message })
        }
      }

      console.log('✅ Tags padrão criadas:', createdTags.length)
      
      return {
        success: true,
        message: `${createdTags.length} tags padrão criadas com sucesso!`,
        tags: createdTags,
        errors
      }
    } catch (error) {
      console.error('❌ Erro ao criar tags padrão:', error)
      throw error
    }
  }

  // ==========================================
  // MIGRAÇÃO DE CAMPOS
  // ==========================================

  async migrateLeadsFields() {
    if (!this.useFirebase) {
      console.log('Migração só funciona com Firebase ativo')
      return { success: false, message: 'Firebase não está ativo' }
    }

    try {
      console.log('🚀 Iniciando migração de campos dos leads...')
      
      const rawLeads = await firestoreService.getAll('leads')
      console.log(`📊 Encontrados ${rawLeads.length} leads para análise`)
      
      let migratedCount = 0
      const errors = []
      
      for (const lead of rawLeads) {
        try {
          console.log(`🔍 Analisando lead: ${lead.nomePackiente || lead.nome_paciente} (ID: ${lead.id})`)
          
          const needsMigration = (
            lead.valorFechadoParcial === undefined ||
            lead.followup1Realizado === undefined ||
            lead.followup1Data === undefined ||
            lead.followup2Realizado === undefined ||
            lead.followup2Data === undefined ||
            lead.followup3Realizado === undefined ||
            lead.followup3Data === undefined ||
            lead.tags === undefined
          )
          
          if (needsMigration) {
            console.log(`⚡ Migrando lead: ${lead.nomePackiente || lead.nome_paciente}`)
            
            const updatedLead = {
              nomePackiente: lead.nomePackiente || lead.nome_paciente || '',
              telefone: lead.telefone || '',
              dataNascimento: lead.dataNascimento || lead.data_nascimento || '',
              email: lead.email || '',
              canalContato: lead.canalContato || lead.canal_contato || '',
              solicitacaoPaciente: lead.solicitacaoPaciente || lead.solicitacao_paciente || '',
              medicoAgendadoId: lead.medicoAgendadoId || lead.medico_agendado_id || '',
              especialidadeId: lead.especialidadeId || lead.especialidade_id || '',
              procedimentoAgendadoId: lead.procedimentoAgendadoId || lead.procedimento_agendado_id || '',
              agendado: lead.agendado || false,
              motivoNaoAgendamento: lead.motivoNaoAgendamento || lead.motivo_nao_agendamento || '',
              outrosProfissionaisAgendados: lead.outrosProfissionaisAgendados || lead.outros_profissionais_agendados || false,
              quaisProfissionais: lead.quaisProfissionais || lead.quais_profissionais || '',
              pagouReserva: lead.pagouReserva || lead.pagou_reserva || false,
              tipoVisita: lead.tipoVisita || lead.tipo_visita || '',
              valorOrcado: lead.valorOrcado || lead.valor_orcado || 0,
              orcamentoFechado: lead.orcamentoFechado || lead.orcamento_fechado || '',
              observacaoGeral: lead.observacaoGeral || lead.observacao_geral || '',
              perfilComportamentalDisc: lead.perfilComportamentalDisc || lead.perfil_comportamental_disc || '',
              status: lead.status || 'Lead',
              dataRegistroContato: lead.dataRegistroContato || lead.data_registro_contato || new Date().toISOString(),
              
              // NOVOS CAMPOS
              valorFechadoParcial: lead.valorFechadoParcial || lead.valor_fechado_parcial || 0,
              followup1Realizado: lead.followup1Realizado || lead.followup1_realizado || false,
              followup1Data: lead.followup1Data || lead.followup1_data || '',
              followup2Realizado: lead.followup2Realizado || lead.followup2_realizado || false,
              followup2Data: lead.followup2Data || lead.followup2_data || '',
              followup3Realizado: lead.followup3Realizado || lead.followup3_realizado || false,
              followup3Data: lead.followup3Data || lead.followup3_data || '',
              tags: lead.tags || []
            }
            
            await firestoreService.update('leads', lead.id, updatedLead)
            migratedCount++
            
            console.log(`✅ Lead ${lead.nomePackiente || lead.nome_paciente} migrado com sucesso`)
          } else {
            console.log(`⏭️ Lead ${lead.nomePackiente || lead.nome_paciente} já possui todos os campos`)
          }
          
        } catch (leadError) {
          console.error(`❌ Erro ao migrar lead ${lead.id}:`, leadError)
          errors.push({
            leadId: lead.id,
            leadName: lead.nomePackiente || lead.nome_paciente,
            error: leadError.message
          })
        }
      }
      
      console.log(`🎉 Migração concluída!`)
      console.log(`📈 Estatísticas:`)
      console.log(`   - Total de leads: ${rawLeads.length}`)
      console.log(`   - Leads migrados: ${migratedCount}`)
      console.log(`   - Erros: ${errors.length}`)
      
      if (errors.length > 0) {
        console.log(`⚠️ Erros encontrados:`, errors)
      }
      
      return {
        success: true,
        message: `Migração concluída! ${migratedCount} leads foram atualizados.`,
        stats: {
          total: rawLeads.length,
          migrated: migratedCount,
          errors: errors.length
        },
        errors
      }
      
    } catch (error) {
      console.error('❌ Erro durante a migração:', error)
      return {
        success: false,
        message: `Erro durante a migração: ${error.message}`,
        error
      }
    }
  }

  // ==========================================
  // RELATÓRIOS E ESTATÍSTICAS DE AUDITORIA
  // ==========================================

  /**
   * Relatório de auditoria por período
   * @param {string} startDate - Data inicial (ISO string)
   * @param {string} endDate - Data final (ISO string)
   * @returns {Object} Relatório de auditoria
   */
  async getAuditReport(startDate, endDate) {
    try {
      const leads = await this.getAll('leads')
      const report = {
        period: { start: startDate, end: endDate },
        total_leads: leads.length,
        leads_with_audit: 0,
        total_changes: 0,
        changes_by_user: {},
        changes_by_action: { CREATE: 0, UPDATE: 0, DELETE: 0 },
        most_active_users: [],
        most_changed_leads: [],
        changes_timeline: []
      }

      const start = new Date(startDate)
      const end = new Date(endDate)

      leads.forEach(lead => {
        if (!lead.audit_trail || lead.audit_trail.length === 0) return

        report.leads_with_audit++
        
        const relevantChanges = lead.audit_trail.filter(entry => {
          const entryDate = new Date(entry.timestamp)
          return entryDate >= start && entryDate <= end
        })

        report.total_changes += relevantChanges.length

        relevantChanges.forEach(entry => {
          // Contagem por usuário
          const userId = entry.user.id
          if (!report.changes_by_user[userId]) {
            report.changes_by_user[userId] = {
              name: entry.user.nome,
              email: entry.user.email,
              count: 0
            }
          }
          report.changes_by_user[userId].count++

          // Contagem por ação
          report.changes_by_action[entry.action]++

          // Timeline
          report.changes_timeline.push({
            date: entry.timestamp,
            user: entry.user.nome,
            action: entry.action,
            lead_name: lead.nome_paciente,
            lead_id: lead.id
          })
        })

        // Leads mais modificados
        if (relevantChanges.length > 0) {
          report.most_changed_leads.push({
            id: lead.id,
            name: lead.nome_paciente,
            changes_count: relevantChanges.length
          })
        }
      })

      // Ordenar usuários mais ativos
      report.most_active_users = Object.values(report.changes_by_user)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Ordenar leads mais modificados
      report.most_changed_leads = report.most_changed_leads
        .sort((a, b) => b.changes_count - a.changes_count)
        .slice(0, 10)

      // Ordenar timeline
      report.changes_timeline = report.changes_timeline
        .sort((a, b) => new Date(b.date) - new Date(a.date))

      return report
    } catch (error) {
      console.error('Erro ao gerar relatório de auditoria:', error)
      throw error
    }
  }

  /**
   * Busca alterações por usuário específico
   * @param {string} userId - ID do usuário
   * @param {number} limit - Limite de resultados (padrão: 50)
   * @returns {Array} Lista de alterações do usuário
   */
  async getChangesByUser(userId, limit = 50) {
    try {
      const leads = await this.getAll('leads')
      const userChanges = []

      leads.forEach(lead => {
        if (!lead.audit_trail) return

        const userEntries = lead.audit_trail
          .filter(entry => entry.user.id === userId)
          .map(entry => ({
            ...entry,
            lead_id: lead.id,
            lead_name: lead.nome_paciente,
            lead_phone: lead.telefone
          }))

        userChanges.push(...userEntries)
      })

      return userChanges
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit)
    } catch (error) {
      console.error('Erro ao buscar alterações por usuário:', error)
      throw error
    }
  }

  /**
   * Estatísticas gerais de auditoria
   * @returns {Object} Estatísticas do sistema
   */
  async getAuditStats() {
    try {
      const leads = await this.getAll('leads')
      const stats = {
        total_leads: leads.length,
        leads_with_audit: 0,
        leads_without_audit: 0,
        total_changes: 0,
        unique_users: new Set(),
        changes_last_7_days: 0,
        changes_last_30_days: 0,
        most_active_user: null,
        most_changed_lead: null
      }

      const now = new Date()
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const userActivity = {}
      const leadActivity = {}

      leads.forEach(lead => {
        if (!lead.audit_trail || lead.audit_trail.length === 0) {
          stats.leads_without_audit++
          return
        }

        stats.leads_with_audit++
        stats.total_changes += lead.audit_trail.length

        // Atividade por lead
        leadActivity[lead.id] = {
          name: lead.nome_paciente,
          changes: lead.audit_trail.length
        }

        lead.audit_trail.forEach(entry => {
          const entryDate = new Date(entry.timestamp)
          stats.unique_users.add(entry.user.id)

          // Atividade por usuário
          if (!userActivity[entry.user.id]) {
            userActivity[entry.user.id] = {
              name: entry.user.nome,
              email: entry.user.email,
              changes: 0
            }
          }
          userActivity[entry.user.id].changes++

          // Contadores de período
          if (entryDate >= last7Days) {
            stats.changes_last_7_days++
          }
          if (entryDate >= last30Days) {
            stats.changes_last_30_days++
          }
        })
      })

      // Usuário mais ativo
      stats.most_active_user = Object.values(userActivity)
        .sort((a, b) => b.changes - a.changes)[0] || null

      // Lead mais modificado
      stats.most_changed_lead = Object.values(leadActivity)
        .sort((a, b) => b.changes - a.changes)[0] || null

      stats.unique_users = stats.unique_users.size

      return stats
    } catch (error) {
      console.error('Erro ao calcular estatísticas de auditoria:', error)
      throw error
    }
  }

  /**
   * Limpa registros de auditoria antigos (opcional, para manutenção)
   * @param {number} daysToKeep - Dias para manter (padrão: 365)
   * @returns {Object} Resultado da limpeza
   */
  async cleanOldAuditRecords(daysToKeep = 365) {
    try {
      console.log(`🧹 Iniciando limpeza de registros de auditoria mais antigos que ${daysToKeep} dias...`)
      
      const leads = await this.getAll('leads')
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      let leadsProcessed = 0
      let recordsRemoved = 0

      for (const lead of leads) {
        if (!lead.audit_trail || lead.audit_trail.length === 0) continue

        const originalCount = lead.audit_trail.length
        
        // Manter sempre o primeiro registro (criação) e registros recentes
        const filteredAudit = lead.audit_trail.filter((entry, index) => {
          const entryDate = new Date(entry.timestamp)
          return index === 0 || // Primeiro registro (criação)
                 entry.action === 'CREATE' || // Registros de criação
                 entryDate >= cutoffDate // Registros recentes
        })

        if (filteredAudit.length < originalCount) {
          await this.update('leads', lead.id, { ...lead, audit_trail: filteredAudit })
          recordsRemoved += (originalCount - filteredAudit.length)
          leadsProcessed++
        }
      }

      const result = {
        success: true,
        message: `Limpeza concluída! ${recordsRemoved} registros removidos de ${leadsProcessed} leads.`,
        stats: {
          leads_processed: leadsProcessed,
          records_removed: recordsRemoved,
          cutoff_date: cutoffDate.toISOString()
        }
      }

      console.log('✅ Limpeza de auditoria concluída:', result)
      return result

    } catch (error) {
      console.error('❌ Erro na limpeza de auditoria:', error)
      return {
        success: false,
        message: `Erro na limpeza: ${error.message}`,
        stats: { leads_processed: 0, records_removed: 0 }
      }
    }
  }

  // ==========================================
  // FUNÇÕES EXISTENTES (CRUD)
  // ==========================================

  async initializeData() {
    if (this.useFirebase) {
      await firestoreService.initializeDefaultData()
    } else {
      this.initializeLocalStorageData()
    }
  }

  initializeLocalStorageData() {
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

  // Métodos genéricos para CRUD
  async getAll(entity) {
    if (this.useFirebase) {
      try {
        const data = await firestoreService.getAll(this.getCollectionName(entity))
        console.log(`Dados brutos do Firebase para ${entity}:`, data)
        
        const transformedData = data.map(item => this.transformFromFirebase(entity, item))
        console.log(`Dados transformados para ${entity}:`, transformedData)
        
        return transformedData
      } catch (error) {
        console.error('Erro ao buscar dados do Firebase, usando localStorage como fallback')
        return this.getFromLocalStorage(entity)
      }
    } else {
      return this.getFromLocalStorage(entity)
    }
  }

  async getById(entity, id) {
    if (this.useFirebase) {
      try {
        const data = await firestoreService.getById(this.getCollectionName(entity), id)
        return data ? this.transformFromFirebase(entity, data) : null
      } catch (error) {
        console.error('Erro ao buscar dados do Firebase, usando localStorage como fallback')
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
        const firebaseData = this.transformToFirebase(entity, item)
        console.log(`Criando no Firebase - ${entity}:`, firebaseData)
        
        const result = await firestoreService.create(this.getCollectionName(entity), firebaseData)
        console.log(`Resultado da criação no Firebase:`, result)
        
        return this.transformFromFirebase(entity, result)
      } catch (error) {
        console.error('Erro ao criar no Firebase, usando localStorage como fallback')
        return this.createInLocalStorage(entity, item)
      }
    } else {
      return this.createInLocalStorage(entity, item)
    }
  }

  async update(entity, id, updatedItem) {
    if (this.useFirebase) {
      try {
        const firebaseData = this.transformToFirebase(entity, updatedItem)
        const result = await firestoreService.update(this.getCollectionName(entity), id, firebaseData)
        return this.transformFromFirebase(entity, result)
      } catch (error) {
        console.error('Erro ao atualizar no Firebase, usando localStorage como fallback')
        return this.updateInLocalStorage(entity, id, updatedItem)
      }
    } else {
      return this.updateInLocalStorage(entity, id, updatedItem)
    }
  }

  async delete(entity, id) {
    if (this.useFirebase) {
      try {
        return await firestoreService.delete(this.getCollectionName(entity), id)
      } catch (error) {
        console.error('Erro ao deletar no Firebase, usando localStorage como fallback')
        return this.deleteFromLocalStorage(entity, id)
      }
    } else {
      return this.deleteFromLocalStorage(entity, id)
    }
  }

  // Métodos localStorage (fallback)
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

  // Métodos específicos para relatórios
  async getLeadsByPeriod(startDate, endDate) {
    if (this.useFirebase) {
      try {
        const data = await firestoreService.getLeadsByPeriod(startDate, endDate)
        return data.map(item => this.transformFromFirebase('leads', item))
      } catch (error) {
        console.error('Erro ao buscar leads por período no Firebase')
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
        return await firestoreService.getConversionRate()
      } catch (error) {
        console.error('Erro ao calcular taxa de conversão no Firebase')
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
}

export default new FirebaseDataService()