# 📦 BCI Frontend

O **BCI Frontend** é o repositório central que contém todas as páginas, assets e lógica do frontend utilizadas tanto no site público como nas apps desktop desenvolvidas em Electron.

Este repositório permite manter um único código-fonte totalmente compatível com Web e Electron, garantindo consistência, rapidez de desenvolvimento e zero duplicação de código.

---

## 🎯 Objetivo

Concentrar toda a interface do utilizador do projeto BCI num único local, permitindo:

- 🚀 Atualizações rápidas em Web e Desktop
- 🔁 Sincronização total entre plataformas
- 🧩 Partilha de componentes e lógica
- 📐 Design consistente
- ⚡ Desenvolvimento mais simples e eficiente

---

## 📁 Estrutura do Repositório

bci-frontend/
├── public/ # Ficheiros principais (HTML, CSS, JS)
├── pages/ # Páginas individuais do dashboard e módulos
├── components/ # Componentes JS reutilizáveis
├── assets/ # Imagens, icons, estilos globais, fontes, etc.
├── version.json # Indicação da versão atual (usada por Web & Electron)
└── README.md

### 🗂 Diretórios principais

**public/**  
Ficheiros principais carregados diretamente pelo site e pela app.

**pages/**  
Subpáginas como dashboard, login, gestão de contas, gráficos, etc.

**components/**  
Funções e componentes JavaScript reutilizáveis.

**assets/**  
Imagens, logos, CSS global, icons, fontes e outros recursos.

**version.json**  
Define a versão atual do frontend, permitindo que:
- o site valide updates
- a app Electron detete novas versões
- o sistema force refresh quando necessário

---