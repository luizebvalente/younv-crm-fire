import firestoreService from './firebase/firestore'

class FirebaseDataService {
  constructor() {
    this.useFirebase = true // Usar Firebase por padrão
    this.initializeData()
  }

  // Inicializar dados padrão se necessário
  async initializeData() {
    try {
      if (this.useFirebase) {
        console.log('🔥 Firebase Data Service inicializado')
      }
    } catch (error) {
      console.error('Erro ao inicializar Firebase Data Service:', error)
    }
  }

  // NOVA FUNÇÃO: Obter informações do usuário atual com fallback aprimorado
  getCurrentUserInfo() {
    // Tentar obter do contexto global primeiro
    if (window.currentUser) {
      return {
        id: window.currentUser.uid || window.currentUser.id,
        nome: window.currentUser.displayName || window.currentUser.nome || window.currentUser.email || 'Usuário',
        email: window.currentUser.email || ''
      }
    }

    // Fallback para Firebase Auth
    if (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) {
      const user = window.firebase.auth().currentUser
      return {
        id: user.uid,
        nome: user.displayName || user.email || 'Usuário',
        email: user.email || ''
      }
    }

    // Fallback final
    return {
      id: 'sistema',
      nome: 'Sistema',
      email: 'sistema@younv.com'
    }
  }

  // FUNÇÃO APRIMORADA: Transformar dados para Firebase com auditoria completa
  transformToFirebase(entity, item) {
    const currentUser = this.getCurrentUserInfo()
    const now = new Date().toISOString()

    // Campos base de auditoria
    const auditFields = {
      data_ultima_alteracao: now,
      alterado_por_id: currentUser.id,
      alterado_por_nome: currentUser.nome,
      alterado_por_email: currentUser.email
    }

    // Se é um novo item, adicionar campos de criação
    if (!item.id && !item.criado_por_id) {
      auditFields.criado_por_id = currentUser.id
      auditFields.criado_por_nome = currentUser.nome
      auditFields.criado_por_email = currentUser.email
      auditFields.data_criacao = now
    }

    switch (entity) {
      case 'leads':
        return {
          ...item,
          ...auditFields,
          // Garantir que campos obrigatórios existam
          nome_paciente: item.nome_paciente || '',
          telefone: item.telefone || '',
          status: item.status || 'Lead',
          tags: item.tags || [],
          valor_orcado: parseFloat(item.valor_orcado) || 0,
          // Campos de follow-up
          followup1_realizado: Boolean(item.followup1_realizado),
          followup2_realizado: Boolean(item.followup2_realizado),
          followup3_realizado: Boolean(item.followup3_realizado),
          // Histórico de alterações
          historico_alteracoes: item.historico_alteracoes || []
        }
      
      case 'medicos':
        return {
          ...item,
          ...auditFields,
          nome: item.nome || '',
          especialidade_id: item.especialidade_id || '',
          ativo: Boolean(item.ativo)
        }
      
      case 'especialidades':
        return {
          ...item,
          ...auditFields,
          nome: item.nome || '',
          descricao: item.descricao || '',
          ativo: Boolean(item.ativo)
        }
      
      case 'procedimentos':
        return {
          ...item,
          ...auditFields,
          nome: item.nome || '',
          valor: parseFloat(item.valor) || 0,
          duracao: parseInt(item.duracao) || 0,
          especialidade_id: item.especialidade_id || '',
          ativo: Boolean(item.ativo)
        }
      
      case 'tags':
        return {
          ...item,
          ...auditFields,
          nome: item.nome || '',
          cor: item.cor || '#3b82f6',
          categoria: item.categoria || 'Geral',
          ativo: Boolean(item.ativo)
        }
      
      default:
        return {
          ...item,
          ...auditFields
        }
    }
  }

  // FUNÇÃO APRIMORADA: Transformar dados do Firebase
  transformFromFirebase(entity, item) {
    if (!item) return null

    // Converter timestamps do Firestore para strings ISO
    const convertTimestamp = (timestamp) => {
      if (!timestamp) return null
      if (timestamp.toDate) return timestamp.toDate().toISOString()
      if (typeof timestamp === 'string') return timestamp
      return new Date(timestamp).toISOString()
    }

    const baseItem = {
      ...item,
      data_criacao: convertTimestamp(item.data_criacao),
      data_ultima_alteracao: convertTimestamp(item.data_ultima_alteracao),
      data_registro_contato: convertTimestamp(item.data_registro_contato)
    }

    switch (entity) {
      case 'leads':
        return {
          ...baseItem,
          valor_orcado: parseFloat(baseItem.valor_orcado) || 0,
          valor_fechado_parcial: parseFloat(baseItem.valor_fechado_parcial) || 0,
          tags: baseItem.tags || [],
          historico_alteracoes: baseItem.historico_alteracoes || []
        }
      
      case 'procedimentos':
        return {
          ...baseItem,
          valor: parseFloat(baseItem.valor) || 0,
          duracao: parseInt(baseItem.duracao) || 0
        }
      
      default:
        return baseItem
    }
  }

  // FUNÇÃO APRIMORADA: Criar com auditoria completa
  async create(entity, item) {
    if (this.useFirebase) {
      try {
        const currentUser = this.getCurrentUserInfo()
        const now = new Date().toISOString()
        
        // Adicionar informações completas de auditoria para criação
        const itemWithUserInfo = {
          ...item,
          criado_por_id: currentUser.id,
          criado_por_nome: currentUser.nome,
          criado_por_email: currentUser.email,
          alterado_por_id: currentUser.id,
          alterado_por_nome: currentUser.nome,
          alterado_por_email: currentUser.email,
          data_criacao: now,
          data_ultima_alteracao: now,
          data_registro_contato: item.data_registro_contato || now,
          // Inicializar histórico de alterações
          historico_alteracoes: [{
            data: now,
            usuario_id: currentUser.id,
            usuario_nome: currentUser.nome,
            usuario_email: currentUser.email,
            acao: 'criacao',
            campos_alterados: []
          }]
        }

        // Transformar dados para o formato Firebase
        const firebaseData = this.transformToFirebase(entity, itemWithUserInfo)
        const result = await firestoreService.create(this.getCollectionName(entity), firebaseData)
        
        console.log(`✅ ${entity} criado com sucesso:`, result.id)
        return this.transformFromFirebase(entity, { id: result.id, ...firebaseData })
      } catch (error) {
        console.error(`Erro ao criar ${entity} no Firebase:`, error)
        throw error
      }
    } else {
      return this.createInLocalStorage(entity, item)
    }
  }

  // FUNÇÃO APRIMORADA: Atualizar com auditoria completa
  async update(entity, id, updatedItem) {
    if (this.useFirebase) {
      try {
        const currentUser = this.getCurrentUserInfo()
        const now = new Date().toISOString()
        
        // Obter dados atuais para comparação
        const currentData = await this.getById(entity, id)
        
        // Detectar campos alterados
        const changedFields = this.detectChangedFields(currentData, updatedItem)
        
        // Adicionar informações de auditoria para atualização
        const itemWithUserInfo = {
          ...updatedItem,
          alterado_por_id: currentUser.id,
          alterado_por_nome: currentUser.nome,
          alterado_por_email: currentUser.email,
          data_ultima_alteracao: now,
          // Preservar dados de criação
          criado_por_id: currentData?.criado_por_id || currentUser.id,
          criado_por_nome: currentData?.criado_por_nome || currentUser.nome,
          criado_por_email: currentData?.criado_por_email || currentUser.email,
          data_criacao: currentData?.data_criacao || now,
          data_registro_contato: currentData?.data_registro_contato || now,
          // Atualizar histórico de alterações
          historico_alteracoes: [
            ...(currentData?.historico_alteracoes || []),
            {
              data: now,
              usuario_id: currentUser.id,
              usuario_nome: currentUser.nome,
              usuario_email: currentUser.email,
              acao: 'edicao',
              campos_alterados: changedFields
            }
          ]
        }

        // Transformar dados para o formato Firebase
        const firebaseData = this.transformToFirebase(entity, itemWithUserInfo)
        const result = await firestoreService.update(this.getCollectionName(entity), id, firebaseData)
        
        console.log(`✅ ${entity} atualizado com sucesso:`, id)
        console.log(`📝 Campos alterados:`, changedFields)
        
        return this.transformFromFirebase(entity, { id, ...firebaseData })
      } catch (error) {
        console.error(`Erro ao atualizar ${entity} no Firebase:`, error)
        throw error
      }
    } else {
      return this.updateInLocalStorage(entity, id, updatedItem)
    }
  }

  // NOVA FUNÇÃO: Detectar campos alterados
  detectChangedFields(oldData, newData) {
    if (!oldData) return []
    
    const changes = []
    const fieldsToCheck = [
      'nome_paciente', 'telefone', 'email', 'status', 'valor_orcado',
      'medico_agendado_id', 'especialidade_id', 'procedimento_agendado_id',
      'observacao_geral', 'canal_contato', 'solicitacao_paciente',
      'agendado', 'orcamento_fechado', 'tags'
    ]
    
    fieldsToCheck.forEach(field => {
      const oldValue = oldData[field]
      const newValue = newData[field]
      
      // Comparação especial para arrays (tags)
      if (field === 'tags') {
        const oldTags = Array.isArray(oldValue) ? oldValue.sort() : []
        const newTags = Array.isArray(newValue) ? newValue.sort() : []
        if (JSON.stringify(oldTags) !== JSON.stringify(newTags)) {
          changes.push({
            campo: field,
            valor_anterior: oldTags.join(', ') || 'Nenhuma',
            valor_novo: newTags.join(', ') || 'Nenhuma'
          })
        }
      } else if (oldValue !== newValue) {
        changes.push({
          campo: field,
          valor_anterior: oldValue || '',
          valor_novo: newValue || ''
        })
      }
    })
    
    return changes
  }

  // Função para obter todos os itens
  async getAll(entity) {
    if (this.useFirebase) {
      try {
        const items = await firestoreService.getAll(this.getCollectionName(entity))
        console.log(`📊 ${entity} carregados do Firebase:`, items.length)
        return items.map(item => this.transformFromFirebase(entity, item))
      } catch (error) {
        console.error(`Erro ao buscar ${entity} no Firebase:`, error)
        return this.getFromLocalStorage(entity)
      }
    } else {
      return this.getFromLocalStorage(entity)
    }
  }

  // Função para obter item por ID
  async getById(entity, id) {
    if (this.useFirebase) {
      try {
        const item = await firestoreService.getById(this.getCollectionName(entity), id)
        return this.transformFromFirebase(entity, item)
      } catch (error) {
        console.error(`Erro ao buscar ${entity} por ID no Firebase:`, error)
        const items = this.getFromLocalStorage(entity)
        return items.find(item => item.id === id)
      }
    } else {
      const items = this.getFromLocalStorage(entity)
      return items.find(item => item.id === id)
    }
  }

  // Função para deletar
  async delete(entity, id) {
    if (this.useFirebase) {
      try {
        await firestoreService.delete(this.getCollectionName(entity), id)
        console.log(`🗑️ ${entity} deletado:`, id)
        return true
      } catch (error) {
        console.error(`Erro ao deletar ${entity} no Firebase:`, error)
        return this.deleteFromLocalStorage(entity, id)
      }
    } else {
      return this.deleteFromLocalStorage(entity, id)
    }
  }

  // NOVA FUNÇÃO: Migração de leads para rastreamento de usuário
  async migrateLeadsForUserTracking() {
    try {
      console.log('🔄 Iniciando migração de rastreamento de usuário...')
      
      const leads = await firestoreService.getAll('leads')
      const currentUser = this.getCurrentUserInfo()
      let migratedCount = 0
      const errors = []
      
      for (const lead of leads) {
        try {
          // Verificar se já possui campos de auditoria
          const needsMigration = !lead.criado_por_id || !lead.alterado_por_id
          
          if (needsMigration) {
            const updatedLead = {
              ...lead,
              criado_por_id: lead.criado_por_id || currentUser.id,
              criado_por_nome: lead.criado_por_nome || currentUser.nome,
              criado_por_email: lead.criado_por_email || currentUser.email,
              alterado_por_id: lead.alterado_por_id || currentUser.id,
              alterado_por_nome: lead.alterado_por_nome || currentUser.nome,
              alterado_por_email: lead.alterado_por_email || currentUser.email,
              data_criacao: lead.data_criacao || lead.data_registro_contato || new Date().toISOString(),
              data_ultima_alteracao: lead.data_ultima_alteracao || new Date().toISOString(),
              historico_alteracoes: lead.historico_alteracoes || [{
                data: lead.data_registro_contato || new Date().toISOString(),
                usuario_id: currentUser.id,
                usuario_nome: currentUser.nome,
                usuario_email: currentUser.email,
                acao: 'criacao',
                campos_alterados: []
              }]
            }
            
            // Atualizar no Firestore
            await firestoreService.update('leads', lead.id, updatedLead)
            migratedCount++
            
            console.log(`✅ Lead ${lead.nome_paciente} migrado com sucesso`)
          } else {
            console.log(`⏭️ Lead ${lead.nome_paciente} já possui campos de auditoria`)
          }
          
        } catch (leadError) {
          console.error(`❌ Erro ao migrar lead ${lead.id}:`, leadError)
          errors.push({
            id: lead.id,
            nome: lead.nome_paciente,
            error: leadError.message
          })
        }
      }
      
      const result = {
        success: true,
        message: `Migração de rastreamento concluída com sucesso!`,
        stats: {
          total: leads.length,
          migrados: migratedCount,
          erros: errors.length
        },
        errors
      }
      
      console.log('✅ Migração de rastreamento concluída:', result)
      return result
      
    } catch (error) {
      console.error('❌ Erro na migração de rastreamento:', error)
      return {
        success: false,
        message: `Erro na migração: ${error.message}`,
        stats: { total: 0, migrados: 0, erros: 1 },
        errors: [{ error: error.message }]
      }
    }
  }

  // NOVA FUNÇÃO: Migração de campos de leads
  async migrateLeadsFields() {
    try {
      console.log('🔄 Iniciando migração de campos...')
      
      const leads = await firestoreService.getAll('leads')
      let migratedCount = 0
      const errors = []
      
      for (const lead of leads) {
        try {
          // Verificar se precisa de migração
          const needsMigration = 
            typeof lead.followup1_realizado === 'undefined' ||
            typeof lead.followup2_realizado === 'undefined' ||
            typeof lead.followup3_realizado === 'undefined' ||
            !Array.isArray(lead.tags)
          
          if (needsMigration) {
            const updatedLead = {
              ...lead,
              // Garantir campos de follow-up
              followup1_realizado: Boolean(lead.followup1_realizado),
              followup1_data: lead.followup1_data || '',
              followup2_realizado: Boolean(lead.followup2_realizado),
              followup2_data: lead.followup2_data || '',
              followup3_realizado: Boolean(lead.followup3_realizado),
              followup3_data: lead.followup3_data || '',
              // Garantir campo tags
              tags: Array.isArray(lead.tags) ? lead.tags : [],
              // Garantir campos de valor
              valor_orcado: parseFloat(lead.valor_orcado) || 0,
              valor_fechado_parcial: parseFloat(lead.valor_fechado_parcial) || 0
            }
            
            await firestoreService.update('leads', lead.id, updatedLead)
            migratedCount++
            
            console.log(`✅ Lead ${lead.nome_paciente} migrado`)
          }
          
        } catch (leadError) {
          console.error(`❌ Erro ao migrar lead ${lead.id}:`, leadError)
          errors.push({
            id: lead.id,
            nome: lead.nome_paciente,
            error: leadError.message
          })
        }
      }
      
      return {
        success: true,
        message: `Migração de campos concluída!`,
        stats: {
          total: leads.length,
          migrados: migratedCount,
          erros: errors.length
        },
        errors
      }
      
    } catch (error) {
      console.error('❌ Erro na migração de campos:', error)
      return {
        success: false,
        message: `Erro na migração: ${error.message}`,
        stats: { total: 0, migrados: 0, erros: 1 },
        errors: [{ error: error.message }]
      }
    }
  }

  // Função para obter nome da coleção
  getCollectionName(entity) {
    const collections = {
      'leads': 'leads',
      'medicos': 'medicos',
      'especialidades': 'especialidades',
      'procedimentos': 'procedimentos',
      'tags': 'tags'
    }
    return collections[entity] || entity
  }

  // Funções de fallback para localStorage
  getFromLocalStorage(entity) {
    try {
      const data = localStorage.getItem(`younv_${entity}`)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error(`Erro ao ler ${entity} do localStorage:`, error)
      return []
    }
  }

  createInLocalStorage(entity, item) {
    const items = this.getFromLocalStorage(entity)
    const currentUser = this.getCurrentUserInfo()
    const now = new Date().toISOString()
    
    const newItem = {
      ...item,
      id: Date.now().toString(),
      criado_por_id: currentUser.id,
      criado_por_nome: currentUser.nome,
      criado_por_email: currentUser.email,
      alterado_por_id: currentUser.id,
      alterado_por_nome: currentUser.nome,
      alterado_por_email: currentUser.email,
      data_criacao: now,
      data_ultima_alteracao: now,
      historico_alteracoes: [{
        data: now,
        usuario_id: currentUser.id,
        usuario_nome: currentUser.nome,
        usuario_email: currentUser.email,
        acao: 'criacao',
        campos_alterados: []
      }]
    }
    
    items.push(newItem)
    localStorage.setItem(`younv_${entity}`, JSON.stringify(items))
    return newItem
  }

  updateInLocalStorage(entity, id, updatedItem) {
    const items = this.getFromLocalStorage(entity)
    const index = items.findIndex(item => item.id === id)
    
    if (index !== -1) {
      const currentUser = this.getCurrentUserInfo()
      const now = new Date().toISOString()
      const oldData = items[index]
      
      // Detectar campos alterados
      const changedFields = this.detectChangedFields(oldData, updatedItem)
      
      items[index] = { 
        ...items[index], 
        ...updatedItem,
        alterado_por_id: currentUser.id,
        alterado_por_nome: currentUser.nome,
        alterado_por_email: currentUser.email,
        data_ultima_alteracao: now,
        historico_alteracoes: [
          ...(items[index].historico_alteracoes || []),
          {
            data: now,
            usuario_id: currentUser.id,
            usuario_nome: currentUser.nome,
            usuario_email: currentUser.email,
            acao: 'edicao',
            campos_alterados: changedFields
          }
        ]
      }
      
      localStorage.setItem(`younv_${entity}`, JSON.stringify(items))
      return items[index]
    }
    
    throw new Error(`${entity} com ID ${id} não encontrado`)
  }

  deleteFromLocalStorage(entity, id) {
    const items = this.getFromLocalStorage(entity)
    const filteredItems = items.filter(item => item.id !== id)
    localStorage.setItem(`younv_${entity}`, JSON.stringify(filteredItems))
    return true
  }
}

// Exportar instância única
const firebaseDataService = new FirebaseDataService()
export default firebaseDataService

