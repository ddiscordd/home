# CONCORD 1.0

Plataforma de comunicação em tempo real com chat de texto, chamadas de voz, gerenciamento de servidores e canais.

## Tecnologias

- React + TypeScript
- Vite
- Firebase (Auth + Realtime Database)
- Tailwind CSS

## Pré-requisitos

- Node.js 18+
- npm ou pnpm

## Instalação

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

## Build de produção

```bash
npm run build
```

## Configuração do Firebase

Crie um arquivo `.env` na raiz com suas credenciais:

```env
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://seu_projeto-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=seu_projeto
```

## Funcionalidades

- Autenticação via Google
- Chat de texto em tempo real
- Servidores e canais personalizados
- Sistema de amigos e mensagens diretas
- Editor visual administrativo (personalização avançada)
- Controle de aparência global (cores, tamanhos, visibilidade)

## Licença

Uso interno.

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
