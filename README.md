# 🔐 IAMService API - Sistema IAM Completo

Sistema IAM (Identity and Access Management) completo para gerenciar autenticação, usuários e cargos. API REST moderna construída com NestJS e TypeScript, pronta para uso com arquitetura escalável, segurança robusta e documentação automática.

## 🌐 Aplicação em Produção

**URL da API:** https://jp-auth-service-6c3a177d9759.herokuapp.com/  
**Documentação Swagger:** https://jp-auth-service-6c3a177d9759.herokuapp.com/api/docs

## 🎯 O Problema que Resolve

Implementar um sistema IAM (Identity and Access Management) completo do zero é um desafio complexo que envolve:
- Gerenciar identidades de usuários de forma segura
- Controlar acesso e autorização baseado em cargos/roles
- Implementar autenticação robusta com JWT e refresh tokens
- Gerenciar o ciclo de vida de usuários (criação, atualização, remoção)
- Validar e sanitizar dados de entrada
- Tratar erros de forma consistente
- Documentar a API adequadamente

## ✨ A Solução

IAMService API é um **sistema IAM completo** pronto para uso que oferece:

### 🔐 Gerenciamento de Identidade
- ✅ Sistema de autenticação JWT completo (access + refresh tokens)
- ✅ Registro e login de usuários
- ✅ Reset de senha com tokens temporários
- ✅ Hash seguro de senhas

### 👥 Gerenciamento de Usuários
- ✅ CRUD completo de usuários
- ✅ Visualização de perfil próprio
- ✅ Listagem com paginação e filtros
- ✅ Busca por ID

### 🛡️ Gerenciamento de Acesso e Cargos
- ✅ Sistema de cargos/roles (USER/ADMIN)
- ✅ Autorização baseada em roles
- ✅ Proteção de rotas por nível de acesso
- ✅ Controle granular de permissões

## 🚀 Benefícios

### Para Desenvolvedores
- **Pronto para usar** - Setup completo em minutos
- **Código limpo** - Arquitetura modular e bem organizada
- **Type-safe** - TypeScript em todo o projeto
- **Documentação automática** - Swagger UI integrado
- **Testes incluídos** - Exemplos de testes unitários e E2E

### Para o Projeto
- **IAM completo** - Solução pronta para gerenciar identidades, usuários e cargos
- **Segurança robusta** - Hash de senhas, JWT, validação de entrada
- **Escalável** - Arquitetura modular do NestJS
- **Manutenível** - Código organizado seguindo boas práticas
- **Produto pronto** - Pode ser usado como base para novos projetos

### Credenciais de Teste
Após executar `npm run db:setup`, você terá:

**Administrador:**
- Email: `admin@iamBase.com`
- Senha: `Admin@123456`

**Usuário comum:**
- Email: `joao.silva@example.com`
- Senha: `User@123456`

## 🚀 Endpoints Principais

### Autenticação
- `POST /auth/register` - Registro de novo usuário
- `POST /auth/login` - Login e obtenção de tokens
- `POST /auth/refresh` - Renovação de access token
- `POST /auth/requestPasswordReset` - Solicitar reset de senha
- `POST /auth/resetPassword` - Resetar senha com token

### Usuários
- `GET /users/me` - Perfil do usuário autenticado
- `GET /users` - Listar usuários (com paginação)
- `GET /users/:id` - Buscar usuário por ID
- `POST /users/admin` - Criar novo usuário (ADMIN)
- `PATCH /users/admin/:id` - Atualizar usuário (ADMIN)
- `DELETE /users/admin/:id` - Remover usuário (ADMIN)

## 📦 Instalação Completa

### Pré-requisitos
- Node.js 18+ e NPM
- PostgreSQL 12+
- Git

### Passo a Passo Detalhado

1. **Clone o repositório**
```bash
git clone <repository-url>
cd iamservice-api
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/iamBase?schema=public"

# JWT
JWT_SECRET="your-secret-key-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret-key-here"
JWT_REFRESH_EXPIRES_IN="7d"

# Application
PORT=8080
NODE_ENV=development
DOMAIN_URL=localhost
```

4. **Configure o banco de dados**
```bash
npm run db:setup
```

Este comando executa:
- Geração do Prisma Client
- Aplicação das migrações
- População inicial com dados de seed

5. **Inicie o servidor**
```bash
npm run start:dev
```

## 🧪 Scripts Disponíveis

### Desenvolvimento
```bash
npm run start          # Executa em modo produção
npm run start:dev      # Executa em modo desenvolvimento (watch mode)
npm run start:debug    # Executa em modo debug
```

### Build
```bash
npm run build          # Compila o projeto para produção
npm run format         # Formata o código com Prettier
npm run lint           # Executa o linter e corrige problemas
```

### Banco de Dados
```bash
npm run db:setup       # Setup completo (generate + migrate + seed)
npm run prisma:generate # Gera o Prisma Client
npm run prisma:migrate  # Aplica migrações pendentes
npm run prisma:seed     # Popula o banco com dados iniciais
```

### Testes
```bash
npm run test           # Executa testes unitários
```

#### Estrutura de Módulos

```
src/
├── auth/              # Módulo de autenticação
│   ├── dto/          # Data Transfer Objects
│   ├── strategies/   # Estratégias Passport (JWT, Local)
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/            # Módulo de usuários
│   ├── dto/
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── users.module.ts
├── common/           # Recursos compartilhados
│   ├── decorators/   # Decorators customizados
│   ├── filters/      # Exception filters
│   ├── guards/       # Guards de autenticação/autorização
│   ├── interceptors/ # Interceptors globais
│   └── pipes/        # Pipes customizados
├── config/           # Configuração da aplicação
├── database/         # Configuração do Prisma
└── repositories/     # Repositórios de dados
```

## 📚 Documentação Adicional

### Guias Específicos

- 🗄️ **[Banco de Dados](./prisma/README.md)** - Setup, migrations, seeds e troubleshooting
- 📖 **[Documentação da API](./documentation/README.md)** - Como visualizar e usar a especificação OpenAPI

### Recursos Externos

- [NestJS Documentation](https://nestjs.com/) - Framework Node.js progressivo
- [Passport.js](http://www.passportjs.org/) - Middleware de autenticação
- [Class-validator](https://github.com/typestack/class-validator) - Validação baseada em decorators
- [Prisma](https://www.prisma.io/) - ORM moderno e type-safe
- [JWT.io](https://jwt.io/) - JSON Web Tokens
- [Jest](https://jestjs.io/) - Framework de testes
- [OpenAPI Specification](https://swagger.io/specification/) - Especificação OpenAPI 3.0

## 📝 Licença

MIT License - veja o arquivo LICENSE para mais detalhes.

## 👤 Autor

**Jean** - jpm.work.prog@gmail.com

---

⭐ Se este projeto foi útil para você, considere dar uma estrela no repositório!
