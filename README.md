# 📦 BCI Frontend

> **BCI** - Plataforma moderna de gestão de contas de casino

O **BCI Frontend** é o repositório central que contém todas as páginas, assets e lógica do frontend utilizadas tanto no site público como nas apps desktop desenvolvidas em Electron.

Este repositório permite manter um único código-fonte totalmente compatível com Web e Electron, garantindo consistência, rapidez de desenvolvimento e zero duplicação de código.

[![Status](https://img.shields.io/badge/status-active-success.svg)](https://github.com/carpete-americana/bci-frontend)
[![License](https://img.shields.io/badge/license-Private-red.svg)]()

---

## 🎯 Objetivo

Concentrar toda a interface do utilizador do projeto BCI num único local, permitindo:

- 🚀 Atualizações rápidas em Web e Desktop
- 🔁 Sincronização total entre plataformas
- 🧩 Partilha de componentes e lógica
- 📐 Design consistente
- ⚡ Desenvolvimento mais simples e eficiente
- 🔒 Segurança e autenticação robusta

---

## 📁 Estrutura do Repositório

```
bci-frontend/
├── index.html              # Página de entrada (redireciona para login/dashboard)
├── assets/                 # Recursos globais
│   ├── css/               
│   │   ├── styles.css     # Estilos globais
│   │   └── animations.css # Animações e transições
│   ├── js/
│   │   ├── api.js         # Comunicação com API (com JSDoc)
│   │   └── utils.js       # Utilitários gerais (sessões, notificações)
│   └── images/            # Imagens e logos
├── pages/                 # Páginas da aplicação
│   ├── login/            # Autenticação
│   │   ├── index.html    # Interface de login/registo
│   │   ├── index.js      # Lógica de autenticação
│   │   └── styles.css    # Estilos específicos
│   ├── dashboard/        # Painel principal
│   │   ├── index.html    # Interface do dashboard
│   │   ├── index.js      # Lógica e gráficos (ApexCharts)
│   │   └── styles.css    # Estilos do dashboard
│   ├── casinoaccounts/   # Gestão de contas
│   │   ├── index.html
│   │   ├── index.js
│   │   └── styles.css
│   ├── withdraw/         # Levantamentos
│   │   ├── index.html
│   │   ├── index.js
│   │   └── styles.css
│   └── rules/            # Regras e termos
│       ├── index.html
│       ├── index.js
│       └── styles.css
└── README.md
```

### 🗂 Descrição dos Diretórios

**`index.html`**  
Página de entrada que verifica autenticação e redireciona para login ou dashboard.

**`assets/`**  
Recursos partilhados por toda a aplicação:
- **CSS**: Estilos globais, variáveis CSS, animações
- **JS**: API client, utilitários, sistema de notificações
- **Images**: Logos, ícones, imagens

**`pages/`**  
Páginas individuais carregadas dinamicamente:
- **login**: Autenticação (login/registo/recuperação)
- **dashboard**: Visão geral com gráficos e estatísticas
- **casinoaccounts**: Gestão de contas de casino
- **withdraw**: Sistema de levantamentos (MBWAY/Transferência)
- **rules**: Regras e termos de utilização

---

## 🚀 Tecnologias Utilizadas

**Frontend**
- HTML5, CSS3, JavaScript ES6+
- ApexCharts (gráficos interativos)
- Font Awesome 6 (ícones)

**Compatibilidade**
- Web Browsers + Electron Desktop
- Storage Abstraction (LocalStorage / Encrypted)
- REST API com autenticação JWT

---

## 💻 Como Usar

### Instalação Web

1. Clone: `git clone https://github.com/carpete-americana/bci-frontend.git`
2. Sirva com servidor HTTP (Python, Node, PHP)
3. Aceda a `http://localhost:8000`

**⚠️ Importante:** Não alterar a estrutura de carregamento dos assets - é partilhada entre Web e Electron.

---

## 📊 Features

**Páginas**
- ✅ Landing page com redirecionamento inteligente
- ✅ Login/Registo/Recuperação de senha
- ✅ Dashboard com gráficos interativos
- ✅ Gestão de contas de casino
- ✅ Sistema de levantamentos (MBWAY)
- ✅ Regras e termos

**Funcionalidades**
- ✅ Autenticação JWT
- ✅ Sistema de notificações (5 tipos)
- ✅ Gráficos financeiros dinâmicos
- ✅ Validação em tempo real
- ✅ Responsive design

**Melhorias Recentes**
- ✅ SEO (meta tags, Open Graph)
- ✅ Acessibilidade (ARIA labels)
- ✅ Documentação JSDoc completa
- ✅ Error handling robusto

---

## 🔧 API Reference

Ver `assets/js/api.js` para documentação JSDoc completa.

```javascript
// Autenticação
await API.login({ username, password })
await API.register({ username, password, fullname, email, phone })

// Dados
await API.getUserData()
await API.getUserWithdrawals()
await API.withdraw(amount)
```

---

## 🤝 Contribuir

1. Branch: `git checkout -b feature/nova-funcionalidade`
2. Commit: `git commit -m 'Adiciona funcionalidade'`
3. Push: `git push origin feature/nova-funcionalidade`
4. Pull Request

**Guidelines:** Manter estrutura de assets, adicionar JSDoc, testar em Web e Electron.

---

**Última atualização**: Dezembro 2024 | **Versão**: 2.0.0 | **Maintainer**: @carpete-americana