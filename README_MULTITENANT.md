# Younv CRM - Sistema Multi-Tenant

## 🎯 Visão Geral

O **Younv CRM Multi-Tenant** é uma evolução do sistema original que permite que múltiplas clínicas utilizem o mesmo sistema com **isolamento total de dados**. Cada login acessa apenas os dados de sua clínica específica.

## ✨ Principais Funcionalidades Multi-Tenant

### 🏥 Isolamento por Clínica
- **Dados Segregados**: Cada clínica possui seus próprios dados
- **Acesso Restrito**: Impossível acessar dados de outras clínicas
- **Segurança Total**: Regras Firestore garantem isolamento

### 👥 Sistema de Usuários
- **Cadastro Integrado**: Criar usuário + clínica simultaneamente
- **Login Seguro**: Verificação automática de associação clínica-usuário
- **Gestão Simplificada**: Sem níveis de acesso complexos

### 🔐 Segurança Avançada
- **Regras Firestore**: Isolamento a nível de banco de dados
- **Validação Dupla**: Frontend + Backend
- **Auditoria**: Logs de todas as operações

## 🚀 Novas Funcionalidades

### 1. Tela de Login Aprimorada
- **3 Abas**: Login, Cadastro, Recuperação de Senha
- **Cadastro de Clínica**: Criar clínica junto com usuário
- **Interface Moderna**: Design responsivo e intuitivo

### 2. Header Informativo
- **Nome da Clínica**: Sempre visível no topo
- **Indicadores**: Status multi-tenant ativo
- **Perfil do Usuário**: Informações da clínica no dropdown

### 3. Serviços Atualizados
- **firebaseDataService**: Filtro automático por clínica
- **clinicaService**: Gestão completa de clínicas
- **authService**: Associação usuário-clínica

### 4. Migração Automática
- **Script Incluído**: Migrar dados existentes
- **Clínica Padrão**: Criação automática para dados antigos
- **Rollback**: Possibilidade de desfazer migração

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.jsx          # ✅ Atualizado - Info da clínica
│   │   └── Sidebar.jsx         # ✅ Mantido
│   └── pages/
│       ├── Login.jsx           # ✅ Novo - Multi-tenant
│       ├── Dashboard.jsx       # ✅ Compatível
│       ├── Medicos.jsx         # ✅ Compatível
│       ├── Especialidades.jsx  # ✅ Compatível
│       ├── Procedimentos.jsx   # ✅ Compatível
│       ├── Leads.jsx           # ✅ Compatível
│       └── Relatorios.jsx      # ✅ Compatível
├── contexts/
│   └── AuthContext.jsx         # ✅ Atualizado - Multi-tenant
├── services/
│   ├── clinicaService.js       # ✅ Novo - Gestão de clínicas
│   ├── firebaseDataService.js  # ✅ Atualizado - Filtros
│   └── firebase/
│       ├── auth.js             # ✅ Atualizado - Associações
│       ├── firestore.js        # ✅ Atualizado - Queries
│       └── config.js           # ✅ Mantido
├── scripts/
│   └── migrate-to-multitenant.js # ✅ Novo - Migração
└── App.jsx                     # ✅ Atualizado - Multi-tenant
```

## 🔧 Configuração e Deploy

### 1. Instalação
```bash
npm install
npm install @radix-ui/react-tabs  # Dependência adicional
```

### 2. Configuração Firebase
O arquivo `src/services/firebase/config.js` já está configurado com as credenciais corretas.

### 3. Regras de Segurança Firestore
Aplicar as regras do arquivo `firestore.rules`:

```bash
firebase deploy --only firestore:rules
```

### 4. Build e Deploy
```bash
# Build para produção
npm run build

# Deploy no Vercel (já configurado)
vercel --prod
```

## 📊 Migração de Dados

### Executar Migração
1. Abra o console do navegador no sistema
2. Execute: `await runMigration()`
3. Aguarde conclusão da migração

### Verificar Status
```javascript
await checkMigrationStatus()
```

### Rollback (se necessário)
```javascript
await rollbackMigration()
```

## 🎨 Interface Multi-Tenant

### Login/Cadastro
- **Tela Unificada**: 3 abas em uma interface
- **Cadastro Completo**: Usuário + Clínica em um formulário
- **Validações**: Campos obrigatórios e formatos

### Dashboard
- **Header Personalizado**: Nome da clínica sempre visível
- **Indicadores**: Status multi-tenant e conexão
- **Dados Filtrados**: Apenas da clínica atual

### Todas as Páginas
- **Filtro Automático**: Dados sempre da clínica correta
- **Criação Segura**: Novos dados com clinicaId correto
- **Interface Inalterada**: Mesma experiência do usuário

## 🔒 Segurança Implementada

### Nível de Banco (Firestore Rules)
```javascript
// Exemplo de regra
allow read: if belongsToUserClinica(resource);
allow create: if hasCorrectClinicaId(request.resource.data);
```

### Nível de Aplicação
- **Validação de clinicaId**: Em todas as operações
- **Filtros Automáticos**: Queries sempre com filtro
- **Verificação de Acesso**: Antes de cada operação

### Nível de Autenticação
- **Associação Obrigatória**: Usuário deve ter clínica
- **Verificação no Login**: Bloqueia usuários sem clínica
- **Tokens Seguros**: Informações da clínica no token

## 📈 Benefícios do Multi-Tenant

### Para o Negócio
- **Escalabilidade**: Múltiplas clínicas no mesmo sistema
- **Economia**: Infraestrutura compartilhada
- **Manutenção**: Atualizações centralizadas

### Para as Clínicas
- **Isolamento**: Dados completamente separados
- **Segurança**: Impossível acessar dados alheios
- **Performance**: Queries otimizadas por clínica

### Para Desenvolvedores
- **Código Limpo**: Arquitetura bem estruturada
- **Manutenibilidade**: Fácil adicionar novas clínicas
- **Testabilidade**: Isolamento facilita testes

## 🚀 Como Usar

### 1. Primeiro Acesso (Nova Clínica)
1. Acesse o sistema
2. Clique em "Cadastrar"
3. Preencha dados do usuário
4. Preencha dados da clínica
5. Clique em "Criar Conta e Clínica"

### 2. Login Existente
1. Acesse o sistema
2. Digite email e senha
3. Sistema verifica associação clínica-usuário
4. Acesso liberado apenas para dados da clínica

### 3. Uso Normal
- **Interface Inalterada**: Mesma experiência
- **Dados Filtrados**: Apenas da sua clínica
- **Criação Automática**: Novos dados com clinicaId

## 🔄 Compatibilidade

### Dados Existentes
- **Migração Automática**: Script converte dados antigos
- **Clínica Padrão**: Criada para dados sem clínica
- **Zero Downtime**: Migração sem interrupção

### Funcionalidades
- **100% Compatível**: Todas as funcionalidades mantidas
- **Interface Igual**: Mesma experiência do usuário
- **Performance**: Melhorada com filtros otimizados

## 📞 Suporte

### Problemas Comuns
1. **Usuário sem clínica**: Execute migração
2. **Dados não aparecem**: Verifique clinicaId
3. **Erro de acesso**: Verifique regras Firestore

### Logs e Debug
- **Console do navegador**: Logs detalhados
- **Firebase Console**: Monitoramento em tempo real
- **Network Tab**: Verificar requests

## 🎉 Conclusão

O **Younv CRM Multi-Tenant** mantém toda a funcionalidade original enquanto adiciona:

✅ **Isolamento total** entre clínicas
✅ **Segurança avançada** com regras Firestore
✅ **Interface moderna** para login/cadastro
✅ **Migração automática** de dados existentes
✅ **Compatibilidade 100%** com sistema anterior
✅ **Escalabilidade** para múltiplas clínicas

**O sistema está pronto para produção e pode ser usado imediatamente!**

---

**Desenvolvido por Younv Consultoria**  
**Sistema Multi-Tenant v2.0**  
**Data: Junho 2024**

