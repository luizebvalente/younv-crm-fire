// Script de Migração para Multi-Tenancy
// Este script migra dados existentes para o formato multi-tenant

import { initializeApp } from 'firebase/app'
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  addDoc,
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore'

// Configuração do Firebase (usar as mesmas credenciais do projeto)
const firebaseConfig = {
  apiKey: "AIzaSyBtrRjLQR7sLX00VX9zqviOvZmoFqQSYOU",
  authDomain: "younv-db.firebaseapp.com",
  projectId: "younv-db",
  storageBucket: "younv-db.firebasestorage.app",
  messagingSenderId: "690640193086",
  appId: "1:690640193086:web:008d04a0e2f1272dcd736f"
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

class MigrationService {
  constructor() {
    this.defaultClinicaId = null
  }

  // Executar migração completa
  async runMigration() {
    try {
      console.log('🚀 Iniciando migração para Multi-Tenant...')
      
      // 1. Criar clínica padrão
      const clinicaId = await this.createDefaultClinica()
      this.defaultClinicaId = clinicaId
      
      // 2. Migrar dados existentes
      await this.migrateExistingData(clinicaId)
      
      // 3. Criar usuário administrador padrão
      await this.createDefaultUserClinicaAssociation(clinicaId)
      
      console.log('✅ Migração concluída com sucesso!')
      console.log(`📋 ID da Clínica Padrão: ${clinicaId}`)
      
      return {
        success: true,
        clinicaId,
        message: 'Migração concluída com sucesso'
      }
    } catch (error) {
      console.error('❌ Erro na migração:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Criar clínica padrão
  async createDefaultClinica() {
    try {
      console.log('📋 Criando clínica padrão...')
      
      const clinicaPadrao = {
        nome: "Clínica Padrão - Migração",
        razaoSocial: "Clínica Padrão Ltda",
        cnpj: "00.000.000/0001-00",
        endereco: {
          rua: "Endereço a ser atualizado",
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
        ativo: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        migrated: true,
        migratedAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'clinicas'), clinicaPadrao)
      console.log(`✅ Clínica padrão criada com ID: ${docRef.id}`)
      
      return docRef.id
    } catch (error) {
      console.error('Erro ao criar clínica padrão:', error)
      throw error
    }
  }

  // Migrar dados existentes
  async migrateExistingData(clinicaId) {
    const collections = ['especialidades', 'medicos', 'procedimentos', 'leads']
    
    for (const collectionName of collections) {
      try {
        console.log(`📦 Migrando coleção: ${collectionName}`)
        await this.migrateCollection(collectionName, clinicaId)
      } catch (error) {
        console.error(`Erro ao migrar ${collectionName}:`, error)
        // Continuar com outras coleções mesmo se uma falhar
      }
    }
  }

  // Migrar uma coleção específica
  async migrateCollection(collectionName, clinicaId) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName))
      
      if (querySnapshot.empty) {
        console.log(`⚠️  Coleção ${collectionName} está vazia`)
        return
      }

      const batch = writeBatch(db)
      let count = 0

      querySnapshot.docs.forEach(docSnapshot => {
        const data = docSnapshot.data()
        
        // Verificar se já tem clinicaId (já migrado)
        if (data.clinicaId) {
          console.log(`⏭️  Documento ${docSnapshot.id} já migrado`)
          return
        }

        // Adicionar clinicaId aos dados
        const updatedData = {
          ...data,
          clinicaId: clinicaId,
          migrated: true,
          migratedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }

        batch.update(doc(db, collectionName, docSnapshot.id), updatedData)
        count++
      })

      if (count > 0) {
        await batch.commit()
        console.log(`✅ ${count} documentos migrados em ${collectionName}`)
      } else {
        console.log(`ℹ️  Nenhum documento para migrar em ${collectionName}`)
      }
    } catch (error) {
      console.error(`Erro ao migrar coleção ${collectionName}:`, error)
      throw error
    }
  }

  // Criar associação usuário-clínica padrão
  async createDefaultUserClinicaAssociation(clinicaId) {
    try {
      console.log('👤 Criando associação usuário-clínica padrão...')
      
      // Esta associação será criada quando o primeiro usuário fizer login
      // Por enquanto, apenas logamos que está pronto
      console.log(`ℹ️  Associação será criada no primeiro login`)
      console.log(`ℹ️  Use este ID de clínica: ${clinicaId}`)
      
    } catch (error) {
      console.error('Erro ao criar associação usuário-clínica:', error)
      throw error
    }
  }

  // Verificar status da migração
  async checkMigrationStatus() {
    try {
      console.log('🔍 Verificando status da migração...')
      
      const collections = ['especialidades', 'medicos', 'procedimentos', 'leads']
      const status = {}

      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, collectionName))
        const total = querySnapshot.size
        const migrated = querySnapshot.docs.filter(doc => doc.data().clinicaId).length
        
        status[collectionName] = {
          total,
          migrated,
          pending: total - migrated,
          percentage: total > 0 ? Math.round((migrated / total) * 100) : 0
        }
      }

      console.log('📊 Status da Migração:')
      console.table(status)
      
      return status
    } catch (error) {
      console.error('Erro ao verificar status:', error)
      throw error
    }
  }

  // Rollback da migração (remover clinicaId)
  async rollbackMigration() {
    try {
      console.log('⚠️  Iniciando rollback da migração...')
      
      const collections = ['especialidades', 'medicos', 'procedimentos', 'leads']
      
      for (const collectionName of collections) {
        console.log(`🔄 Fazendo rollback de: ${collectionName}`)
        
        const querySnapshot = await getDocs(collection(db, collectionName))
        const batch = writeBatch(db)
        let count = 0

        querySnapshot.docs.forEach(docSnapshot => {
          const data = docSnapshot.data()
          
          if (data.migrated) {
            // Remover campos de migração
            const cleanData = { ...data }
            delete cleanData.clinicaId
            delete cleanData.migrated
            delete cleanData.migratedAt
            
            batch.update(doc(db, collectionName, docSnapshot.id), cleanData)
            count++
          }
        })

        if (count > 0) {
          await batch.commit()
          console.log(`✅ Rollback de ${count} documentos em ${collectionName}`)
        }
      }
      
      console.log('✅ Rollback concluído')
    } catch (error) {
      console.error('Erro no rollback:', error)
      throw error
    }
  }
}

// Função principal para executar no console do navegador
window.migrationService = new MigrationService()

// Funções de conveniência para o console
window.runMigration = () => window.migrationService.runMigration()
window.checkMigrationStatus = () => window.migrationService.checkMigrationStatus()
window.rollbackMigration = () => window.migrationService.rollbackMigration()

console.log(`
🔧 Script de Migração Multi-Tenant Carregado!

Comandos disponíveis no console:
- runMigration()           : Executar migração completa
- checkMigrationStatus()   : Verificar status da migração
- rollbackMigration()      : Desfazer migração (cuidado!)

Exemplo de uso:
await runMigration()
`)

export default MigrationService

