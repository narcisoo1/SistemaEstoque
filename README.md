# Sistema de Gerenciamento de Estoque - Secretaria de Educação

Sistema completo para gerenciamento de estoque de materiais escolares, desenvolvido com React, TypeScript, Tailwind CSS e Supabase.

## 🚀 Tecnologias

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Deploy**: Netlify
- **Autenticação**: Supabase Auth
- **Banco de Dados**: PostgreSQL (Supabase)

## 📋 Funcionalidades

### Para Solicitantes (Escolas)
- ✅ Criar solicitações de materiais
- ✅ Acompanhar status das solicitações
- ✅ Editar solicitações pendentes
- ✅ Dashboard com estatísticas pessoais

### Para Despachantes
- ✅ Gerenciar materiais e estoque
- ✅ Aprovar/rejeitar solicitações
- ✅ Despachar materiais
- ✅ Registrar entradas de estoque
- ✅ Gerenciar fornecedores

### Para Administradores
- ✅ Todas as funcionalidades de despachante
- ✅ Gerenciar usuários do sistema
- ✅ Relatórios completos
- ✅ Dashboard administrativo

## 🛠️ Configuração do Projeto

### 1. Configuração do Supabase

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Execute as migrações SQL:
   - `supabase/migrations/create_inventory_tables.sql`
   - `supabase/migrations/create_functions.sql`

### 2. Configuração das Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

### 3. Instalação e Execução

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

### 4. Deploy no Netlify

1. Conecte seu repositório ao Netlify
2. Configure as variáveis de ambiente no painel do Netlify
3. O deploy será automático a cada push

## 👥 Usuários de Demonstração

O sistema vem com dados de exemplo pré-configurados:

- **Administrador**: admin@educacao.gov.br (senha: password)
- **Despachante**: carlos@educacao.gov.br (senha: password)
- **Solicitantes**: 
  - maria@escola1.edu.br (senha: password)
  - joao@escola2.edu.br (senha: password)
  - ana@escola3.edu.br (senha: password)

**Importante**: Para demonstração, a autenticação está simplificada. Em produção, será usado o Supabase Auth completo.

## 🔐 Autenticação e Segurança

- Autenticação via Supabase Auth
- Row Level Security (RLS) habilitado
- Políticas de acesso baseadas em roles
- Sessões seguras e automáticas

## 📊 Estrutura do Banco de Dados

- `users` - Usuários do sistema
- `materials` - Materiais disponíveis
- `suppliers` - Fornecedores
- `stock_entries` - Entradas de estoque
- `requests` - Solicitações
- `request_items` - Itens das solicitações
- `stock_movements` - Histórico de movimentações

## 🎨 Interface

- Design responsivo e moderno
- Componentes reutilizáveis
- Feedback visual para ações
- Navegação intuitiva por roles

## 📈 Relatórios

- Relatórios de solicitações
- Relatórios de entradas de estoque
- Relatórios de materiais
- Exportação em PDF
- Filtros avançados

## 🔄 Funcionalidades em Tempo Real

- Atualizações automáticas de estoque
- Notificações de mudanças de status
- Sincronização entre usuários

## 📱 Responsividade

- Otimizado para desktop, tablet e mobile
- Interface adaptativa
- Experiência consistente em todos os dispositivos

## 🚀 Performance

- Lazy loading de componentes
- Otimização de queries
- Cache inteligente
- Build otimizado para produção

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.