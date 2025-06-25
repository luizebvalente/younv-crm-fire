// Serviço para gerenciar clínicas
import firestoreService from './firebase/firestore'

class ClinicaService {
  constructor() {
    this.collectionName = 'clinicas'
  }

  // Buscar clínica por ID
  async getById(id) {
    try {
      return await firestoreService.getById(this.collectionName, id)
    } catch (error) {
      console.error('Erro ao buscar clínica:', error)
      throw error
    }
  }

  // Criar nova clínica
  async create(clinicaData) {
    try {
      const clinica = {
        ...clinicaData,
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      return await firestoreService.create(this.collectionName, clinica)
    } catch (error) {
      console.error('Erro ao criar clínica:', error)
      throw error
    }
  }

  // Atualizar clínica
  async update(id, clinicaData) {
    try {
      const updatedData = {
        ...clinicaData,
        updatedAt: new Date().toISOString()
      }
      
      return await firestoreService.update(this.collectionName, id, updatedData)
    } catch (error) {
      console.error('Erro ao atualizar clínica:', error)
      throw error
    }
  }

  // Listar todas as clínicas ativas
  async getAll() {
    try {
      const clinicas = await firestoreService.getAll(this.collectionName)
      return clinicas.filter(clinica => clinica.ativo)
    } catch (error) {
      console.error('Erro ao listar clínicas:', error)
      throw error
    }
  }

  // Desativar clínica
  async deactivate(id) {
    try {
      return await this.update(id, { ativo: false })
    } catch (error) {
      console.error('Erro ao desativar clínica:', error)
      throw error
    }
  }

  // Validar dados da clínica
  validateClinicaData(data) {
    const errors = []

    if (!data.nome || data.nome.trim().length < 3) {
      errors.push('Nome da clínica deve ter pelo menos 3 caracteres')
    }

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Email inválido')
    }

    if (!data.telefone || data.telefone.length < 10) {
      errors.push('Telefone deve ter pelo menos 10 dígitos')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Validar email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Criar clínica padrão para migração
  async createDefaultClinica() {
    const defaultClinica = {
      nome: "Clínica Padrão",
      razaoSocial: "Clínica Padrão Ltda",
      cnpj: "00.000.000/0001-00",
      endereco: {
        rua: "Endereço não informado",
        bairro: "Centro",
        cidade: "São Paulo",
        estado: "SP",
        cep: "00000-000"
      },
      contato: {
        telefone: "(11) 0000-0000",
        email: "contato@clinicapadrao.com",
        whatsapp: "(11) 90000-0000"
      },
      configuracoes: {
        timezone: "America/Sao_Paulo",
        moeda: "BRL",
        idioma: "pt-BR"
      },
      plano: "basic",
      ativo: true
    }

    try {
      return await this.create(defaultClinica)
    } catch (error) {
      console.error('Erro ao criar clínica padrão:', error)
      throw error
    }
  }
}

export default new ClinicaService()

