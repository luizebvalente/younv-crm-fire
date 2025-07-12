// Serviços do Firestore
import { 
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { db } from './config'

class FirestoreService {
  // Métodos genéricos para CRUD

  // Obter todos os documentos de uma coleção
  async getAll(collectionName, orderByField = 'createdAt', orderDirection = 'desc') {
    try {
      const q = query(
        collection(db, collectionName),
        orderBy(orderByField, orderDirection)
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Converter timestamps para strings ISO
        ...this.convertTimestamps(doc.data())
      }))
    } catch (error) {
      console.error(`Erro ao buscar ${collectionName}:`, error)
      throw error
    }
  }

  // Obter documento por ID
  async getById(collectionName, id) {
    try {
      const docRef = doc(db, collectionName, id)
      const docSnap = await getDoc(docRef)
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          ...this.convertTimestamps(docSnap.data())
        }
      } else {
        return null
      }
    } catch (error) {
      console.error(`Erro ao buscar documento ${id} em ${collectionName}:`, error)
      throw error
    }
  }

  // Criar novo documento
  async create(collectionName, data) {
    try {
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
      
      const docRef = await addDoc(collection(db, collectionName), docData)
      
      // Retornar o documento criado
      return await this.getById(collectionName, docRef.id)
    } catch (error) {
      console.error(`Erro ao criar documento em ${collectionName}:`, error)
      throw error
    }
  }

  // Atualizar documento
  async update(collectionName, id, data) {
    try {
      const docRef = doc(db, collectionName, id)
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      }
      
      await updateDoc(docRef, updateData)
      
      // Retornar o documento atualizado
      return await this.getById(collectionName, id)
    } catch (error) {
      console.error(`Erro ao atualizar documento ${id} em ${collectionName}:`, error)
      throw error
    }
  }

  // Deletar documento
  async delete(collectionName, id) {
    try {
      const docRef = doc(db, collectionName, id)
      await deleteDoc(docRef)
      return true
    } catch (error) {
      console.error(`Erro ao deletar documento ${id} em ${collectionName}:`, error)
      throw error
    }
  }

  // Buscar com filtros
  async getWhere(collectionName, field, operator, value) {
    try {
      const q = query(
        collection(db, collectionName),
        where(field, operator, value),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        ...this.convertTimestamps(doc.data())
      }))
    } catch (error) {
      console.error(`Erro ao buscar ${collectionName} com filtro:`, error)
      throw error
    }
  }

  // Observar mudanças em tempo real
  onSnapshot(collectionName, callback, orderByField = 'createdAt') {
    const q = query(
      collection(db, collectionName),
      orderBy(orderByField, 'desc')
    )
    
    return onSnapshot(q, (querySnapshot) => {
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        ...this.convertTimestamps(doc.data())
      }))
      callback(docs)
    })
  }

  // Métodos específicos para relatórios

  // Buscar leads por período
  async getLeadsByPeriod(startDate, endDate) {
    try {
      const start = Timestamp.fromDate(new Date(startDate))
      const end = Timestamp.fromDate(new Date(endDate))
      
      const q = query(
        collection(db, 'leads'),
        where('dataRegistroContato', '>=', start),
        where('dataRegistroContato', '<=', end),
        orderBy('dataRegistroContato', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        ...this.convertTimestamps(doc.data())
      }))
    } catch (error) {
      console.error('Erro ao buscar leads por período:', error)
      throw error
    }
  }

  // Calcular taxa de conversão
  async getConversionRate() {
    try {
      const leads = await this.getAll('leads')
      const total = leads.length
      const converted = leads.filter(lead => lead.status === 'Convertido').length
      return total > 0 ? (converted / total * 100).toFixed(1) : 0
    } catch (error) {
      console.error('Erro ao calcular taxa de conversão:', error)
      throw error
    }
  }

  // Obter leads por canal
  async getLeadsByChannel() {
    try {
      const leads = await this.getAll('leads')
      const channels = {}
      leads.forEach(lead => {
        channels[lead.canalContato] = (channels[lead.canalContato] || 0) + 1
      })
      return channels
    } catch (error) {
      console.error('Erro ao buscar leads por canal:', error)
      throw error
    }
  }

  // Obter estatísticas por médico
  async getMedicoStats() {
    try {
      const [leads, medicos] = await Promise.all([
        this.getAll('leads'),
        this.getAll('medicos')
      ])
      
      const stats = {}
      medicos.forEach(medico => {
        const medicoLeads = leads.filter(lead => lead.medicoAgendadoId === medico.id)
        stats[medico.nome] = {
          total_leads: medicoLeads.length,
          agendados: medicoLeads.filter(lead => lead.agendado).length,
          convertidos: medicoLeads.filter(lead => lead.status === 'Convertido').length
        }
      })
      
      return stats
    } catch (error) {
      console.error('Erro ao buscar estatísticas por médico:', error)
      throw error
    }
  }

  // Utilitário para converter timestamps
  convertTimestamps(data) {
    const converted = {}
    
    Object.keys(data).forEach(key => {
      const value = data[key]
      if (value && typeof value.toDate === 'function') {
        // É um Timestamp do Firestore
        converted[key] = value.toDate().toISOString()
      }
    })
    
    return converted
  }

  // Inicializar dados padrão (para primeira execução)
  async initializeDefaultData() {
    try {
      // Verificar se já existem dados
      const especialidades = await this.getAll('especialidades')
      
      if (especialidades.length === 0) {
        // Criar especialidades padrão
        const defaultEspecialidades = [
          { nome: 'Dermatologia', descricao: 'Cuidados com a pele', ativo: true },
          { nome: 'Cardiologia', descricao: 'Cuidados cardíacos', ativo: true },
          { nome: 'Ortopedia', descricao: 'Cuidados ortopédicos', ativo: true },
          { nome: 'Ginecologia', descricao: 'Saúde da mulher', ativo: true },
          { nome: 'Pediatria', descricao: 'Cuidados infantis', ativo: true }
        ]
        
        for (const esp of defaultEspecialidades) {
          await this.create('especialidades', esp)
        }
        
        console.log('Dados padrão inicializados com sucesso')
      }
    } catch (error) {
      console.error('Erro ao inicializar dados padrão:', error)
    }
  }
}

export default new FirestoreService()

