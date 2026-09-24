# 🎛️ GarageStudio — Spotify to GarageBand Stem DAW

> **Transforme qualquer link do Spotify ou arquivo de áudio em uma estação de trabalho de áudio digital (DAW) multitrack estilo Apple GarageBand diretamente no navegador.**

[![Deploy to GitHub Pages](https://github.com/actions/workflows/deploy.yml/badge.svg)](https://github.com)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Web Audio API](https://img.shields.io/badge/Web_Audio_API-Hardware_Accelerated-ff5722)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)

---

## 🌟 Visão Geral

**GarageStudio** é uma DAW (Digital Audio Workstation) web completa e moderna inspirada na interface e na experiência de usuário do Apple GarageBand e Logic Pro. O aplicativo permite importar links do Spotify ou arquivos locais de áudio (MP3/WAV), decompor a música em faixas isoladas (*stems* como vocal, bateria, baixo, sintetizadores e guitarras), e manipulá-las em uma timeline profissional com equalizador paramétrico, rack de efeitos, mixer analógico, automação e instrumentos virtuais.

---

## ✨ Principais Funcionalidades

### 🎵 1. Importação & Extração de Stems do Spotify
- **Decomposição em Stems:** Divide a música em canais independentes (Vocal Principal, Bateria & Percussão, Baixo & Sub, Teclados & Sintetizadores, Guitarras, Cordas & FX).
- **Sincronização com Áudio de Alta Fidelidade:** Pré-escuta de estúdio combinada com síntese polifônica via Web Audio API.
- **Upload de Áudio Local:** Carregue arquivos MP3, WAV ou OGG do seu computador para processamento e filtragem de frequências em tempo real.
- **Músicas Demo Embutidas:** Carregue instantaneamente projetos de demonstração prontos:
  - *The Weeknd — Blinding Lights* (Synthwave / 171 BPM)
  - *Tom Jobim — Garota de Ipanema* (Bossa Nova / 128 BPM)
  - *Queen — Bohemian Rhapsody* (Classic Rock / 144 BPM)

### ⏱️ 2. Tap Tempo & Controle de Andamento
- **Detecção em Tempo Real:** Botão `TAP` na Barra de Transporte e no Console LCD que calcula o BPM exato com base nos intervalos entre cliques utilizando marcas de tempo de alta precisão (`performance.now()`).
- **Média Móvel Inteligente:** Média ponderada com eliminação de ruído (filtro contra toques duplos acidentais `< 120ms`) e reinicialização automática após 2,2s de inatividade.
- **Feedback Visual & Contagem:** Indicador animado com contagem de toques em tempo real e pulso rítmico.
- **Edição Manual de BPM:** Edite o valor numérico com duplo clique para digitação direta (40 a 240 BPM).

### 🎼 3. Linha do Tempo Estilo GarageBand (Multitrack Timeline)
- **Visualização de Formas de Onda (Waveforms):** Renderização vetorial dinâmica por faixa e por clipe.
- **Cursor de Reprodução (Playhead):** Deslocamento suave com scrub interativo e marcações de compasso (1/4, 1/8, 1/16).
- **Regiões de Loop:** Definição visual de pontos de entrada (In) e saída (Out) para repetição contínua.
- **Marcadores de Arranjo:** Seções estruturais da música (*Intro*, *Verso*, *Pré-Refrão*, *Refrão*, *Ponte/Solo*, *Outro*).
- **Edição de Pistas:** Mute individual, Solo exclusivo, Armação para gravação, ajuste de volume e pan em cada cabeçalho de faixa.

### 🎚️ 4. Mesa de Mixagem Analógica (Mixer Console)
- **Faders de Volume de Alta Resolução:** Controle de ganho por canal em decibéis (dB) com resposta logarítmica.
- **VU Meters Estéreo:** Medição de pico em tempo real via `AnalyserNode` com alertas de saturação (clipping).
- **Potenciômetros de Panorâmica (Pan):** Espacialização estéreo L/R independente por instrumento.
- **Canal Master:** Fader e medidor geral com controle estéreo de saída.

### 📈 5. Equalizador Paramétrico de 5 Bandas (Parametric EQ)
- Curva de resposta em frequência renderizada em SVG com arraste interativo de nós:
  1. **Low Shelf:** Graves e subgraves (20Hz – 250Hz).
  2. **Low-Mid Peak:** Corpo e controle de "embolamento" (150Hz – 800Hz).
  3. **Mid Peak:** Médios e presença instrumental (500Hz – 3kHz).
  4. **High-Mid Peak:** Clareza e articulação (1.5kHz – 8kHz).
  5. **High Shelf:** Ar e brilho acústico (5kHz – 20kHz).
- Processamento com nós nativos `BiquadFilterNode` de 64 bits.

### 🎛️ 6. Rack de Efeitos de Estúdio (FX Rack)
- **Studio Reverb:** Reverberador com emulação de salas, ajuste de tamanho do espaço e decaimento (*decay*).
- **Stereo Delay:** Eco com sincronização rítmica ao BPM, tempo de atraso e realimentação (*feedback*).
- **Tube Distortion / Overdrive:** Saturação harmônica analógica com ganho ajustável.
- **Stereo Chorus:** Modulação de afinação para espessura e textura estéreo.
- **Resonant Filter:** Filtro passa-baixa e passa-alta com ressonância (Q) ajustável.

### 🎹 7. Instrumentos Virtuais & MPC Drum Pads
- **Teclado de Piano Polifônico:** Teclas sensíveis ao clique e atalhos de teclado (QWERTY), gerando timbres analógicos em tempo real.
- **Drum Machine (16 Pads MPC):** Bateria eletrônica com Kick, Snare, Hi-Hats, Clap, Toms, Rimshot e Pratos.
- **Gravação em Tempo Real:** Grave suas performances de teclado ou bateria diretamente em uma nova pista da timeline.

### 📉 8. Linhas de Automação (Automation Lanes)
- Curvas visuais de automação de **Volume** e **Pan** ao longo do tempo.
- Adicione, mova e remova pontos-chave de automação para criar transições, fades e dinâmicas expressivas.

### 🤖 9. Engenheiro de Som AI (Mix Advisor)
- Diagnóstico acústico das pistas ativas com recomendações cirúrgicas de frequências (Hz/dB), compressão e abertura de campo estéreo para atingir qualidade comercial.

### 💾 10. Exportação & Compartilhamento
- **Exportar Mixagem Master:** Renderização direta para arquivo de áudio WAV estéreo em 44.1kHz / 16-bit.
- **Exportar Stems Isoladas:** Download das pistas individuais para uso em outras DAWs (Logic, Ableton, Pro Tools, FL Studio).
- **Salvar / Carregar Projeto:** Exportação e importação completa da sessão em formato JSON.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior.
- Gerenciador de pacotes npm, yarn ou pnpm.

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/garage-studio.git
cd garage-studio
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente (Opcional)
Crie um arquivo `.env` na raiz do projeto com sua chave da API Google Gemini (para análise semântica avançada):
```env
GEMINI_API_KEY=sua_chave_gemini_aqui
PORT=3000
```
> *Nota: O GarageStudio possui modelos de heurística acústica embutidos. O aplicativo funciona perfeitamente mesmo sem a chave de API.*

### 4. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse a aplicação no navegador em: **`http://localhost:3000`**

### 5. Compilar para Produção
```bash
npm run build
```
Os arquivos otimizados e prontos para publicação estática serão gerados no diretório `dist/`.

---

## 🌐 Publicação no GitHub Pages (Deployment)

O GarageStudio foi configurado com caminhos de ativos relativos (`base: './'`) e fallbacks estáticos no cliente, tornando-o **100% compatível com o GitHub Pages** sem necessidade de configurações adicionais.

### Opção A: Deploy Automático via GitHub Actions (Recomendado)

O repositório já inclui o arquivo `.github/workflows/deploy.yml`. Para ativar:

1. No seu repositório no GitHub, acesse a aba **Settings** (Configurações).
2. Na barra lateral esquerda, clique em **Pages**.
3. Em **Build and deployment > Source**, selecione **GitHub Actions**.
4. Faça qualquer `git push` para a branch `main` ou `master`:
   ```bash
   git add .
   git commit -m "feat: deploy to github pages"
   git push origin main
   ```
5. O workflow compilará e publicará automaticamente a aplicação no endereço:
   `https://<seu-usuario>.github.io/<nome-do-repositorio>/`

---

### Opção B: Deploy Manual com o pacote `gh-pages`

O script de publicação já está configurado no `package.json`:

1. No `package.json`, certifique-se de que a URL do seu GitHub Pages está indicada (opcional):
   ```json
   "homepage": "https://<seu-usuario>.github.io/<nome-do-repositorio>"
   ```

2. Execute o comando de deploy:
   ```bash
   npm run deploy
   ```
   *Este comando compila o projeto com `npm run build` e envia o diretório `dist` automaticamente para a branch `gh-pages`.*

3. No GitHub em **Settings > Pages**, certifique-se de que a branch selecionada seja **`gh-pages`** (pasta `/root`).

---

## 📂 Estrutura do Projeto

```text
├── .github/
│   └── workflows/
│       └── deploy.yml          # Fluxo de CI/CD para deploy no GitHub Pages
├── public/                     # Arquivos estáticos e ícones
├── src/
│   ├── audio/
│   │   └── audioEngine.ts      # Motor Web Audio API (filtros, efeitos, sintetizador, mixer)
│   ├── components/
│   │   ├── AutomationLaneView.tsx  # Editor gráfico de automação (Volume/Pan)
│   │   ├── ExportModal.tsx         # Modal de exportação de WAV, Stems e JSON
│   │   ├── FXRack.tsx              # Rack de efeitos (Reverb, Delay, Distortion, Chorus, Filter)
│   │   ├── Header.tsx              # Barra de transporte, LCD, controles de reprodução e Tap Tempo
│   │   ├── InstrumentModal.tsx     # Teclado de sintetizador virtual e bateria MPC
│   │   ├── MixAdvisorModal.tsx     # Assistente acústico e recomendações de mixagem
│   │   ├── MixerConsole.tsx        # Mesa de som com faders analógicos, pan e VU meters
│   │   ├── ParametricEQ.tsx        # Equalizador paramétrico visual de 5 bandas
│   │   ├── SpotifyImportModal.tsx  # Importador de músicas do Spotify, upload local e demos
│   │   └── Timeline.tsx            # Linha do tempo multitrack com formas de onda e loops
│   ├── data/
│   │   └── defaultProjects.ts  # Projetos de demonstração pré-carregados
│   ├── types/
│   │   └── daw.ts              # Definições de tipos TypeScript da DAW
│   ├── utils/
│   │   └── automation.ts       # Cálculos matemáticos e interpolação de curvas
│   ├── App.tsx                 # Componente principal do GarageStudio
│   ├── index.css               # Estilos globais e Tailwind CSS
│   └── main.tsx                # Ponto de entrada React
├── server.ts                   # Servidor Node/Express (proxy opcional para APIs)
├── package.json                # Dependências e scripts de automação
├── tsconfig.json               # Configurações do compilador TypeScript
├── vite.config.ts              # Configuração do Vite com suporte ao GitHub Pages
└── README.md                   # Documentação completa
```

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) com fontes Google Fonts (*Plus Jakarta Sans* e *JetBrains Mono*)
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Motor de Áudio:** [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) nativa do navegador (AudioContext, GainNode, StereoPannerNode, BiquadFilterNode, ConvolverNode, AnalyserNode, AudioBufferSourceNode)
- **Deploy:** [GitHub Actions](https://github.com/features/actions) & [gh-pages](https://www.npmjs.com/package/gh-pages)
- **IA e Análise:** [@google/genai](https://github.com/google/generative-ai-js) (Google Gemini Flash) com heurística analítica de reserva

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte `LICENSE` para mais detalhes.

---

<p align="center">
  Criado com paixão por áudio e tecnologia. Dê uma ⭐ no repositório se você curtiu o GarageStudio!
</p>
