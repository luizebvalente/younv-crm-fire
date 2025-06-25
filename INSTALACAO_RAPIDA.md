# 🚀 Instalação Rápida - Younv CRM Multi-Tenant

## ⚡ Setup em 5 Minutos

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Firebase (Já Configurado)
As credenciais já estão no arquivo `src/services/firebase/config.js`

### 3. Aplicar Regras de Segurança
```bash
# Copie o conteúdo de firestore.rules para o Firebase Console
# Ou use Firebase CLI:
firebase deploy --only firestore:rules
```

### 4. Executar em Desenvolvimento
```bash
npm run dev
```

### 5. Build para Produção
```bash
npm run build
```

## 🔄 Migração de Dados Existentes

### Se você tem dados antigos no sistema:

1. **Abra o console do navegador** no sistema
2. **Execute a migração**:
   ```javascript
   await runMigration()
   ```
3. **Verifique o status**:
   ```javascript
   await checkMigrationStatus()
   ```

## 🎯 Primeiro Uso

### Criar Nova Clínica
1. Acesse o sistema
2. Clique na aba **"Cadastrar"**
3. Preencha:
   - **Dados do usuário**: Nome, email, senha
   - **Dados da clínica**: Nome, email, telefone
4. Clique em **"Criar Conta e Clínica"**

### Login Existente
1. Acesse o sistema
2. Digite email e senha na aba **"Entrar"**
3. Sistema verifica automaticamente sua clínica

## ✅ Verificação de Funcionamento

### Teste Multi-Tenant
1. **Crie duas contas** com clínicas diferentes
2. **Faça login** com a primeira conta
3. **Crie alguns dados** (médicos, leads, etc.)
4. **Faça logout** e login com a segunda conta
5. **Verifique** que não vê os dados da primeira clínica

### Indicadores Visuais
- **Header**: Nome da clínica sempre visível
- **Status**: "Multi-Tenant Ativo" no header
- **Dropdown**: Informações da clínica no perfil

## 🔧 Configurações Avançadas

### Personalizar Clínica Padrão
Edite o arquivo `src/services/clinicaService.js`:
```javascript
const defaultClinica = {
  nome: "Sua Clínica",
  // ... outros dados
}
```

### Ajustar Regras de Segurança
Edite o arquivo `firestore.rules` conforme necessário.

## 📱 Deploy

### Vercel (Recomendado)
```bash
# Já configurado no vercel.json
vercel --prod
```

### Netlify
```bash
# Build primeiro
npm run build

# Deploy a pasta dist/
```

## 🆘 Problemas Comuns

### "Usuário não possui clínica associada"
**Solução**: Execute a migração de dados

### "Dados não aparecem"
**Solução**: Verifique se o usuário tem clínica associada

### "Erro 403 no Firebase"
**Solução**: Verifique se as regras Firestore foram aplicadas

### "Dependência não encontrada"
**Solução**: Execute `npm install` novamente

## 📞 Suporte Técnico

### Logs Importantes
- **Console do navegador**: Erros de JavaScript
- **Firebase Console**: Logs do banco de dados
- **Network tab**: Problemas de conectividade

### Comandos de Debug
```javascript
// No console do navegador:
checkMigrationStatus()  // Verificar migração
window.firebaseDataService.getCurrentClinicaId()  // Ver clínica atual
```

## 🎉 Pronto!

Seu sistema multi-tenant está funcionando! 

**Principais benefícios alcançados:**
- ✅ Isolamento total entre clínicas
- ✅ Segurança avançada
- ✅ Interface moderna
- ✅ Compatibilidade 100%
- ✅ Escalabilidade garantida

---

**Dúvidas?** Consulte o `README_MULTITENANT.md` para documentação completa.

