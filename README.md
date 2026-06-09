# Nossos Missionários
### Estaca SP BR Taboão — Igreja de Jesus Cristo dos Santos dos Últimos Dias

Painel web responsivo para acompanhamento dos missionários da Estaca SP BR Taboão.

---

## Funcionalidades

- Mural de fotos com status de cada missionário (A caminho / Em campo / Retornou)
- Contador de missionários por status
- Cadastro progressivo via modal (informações podem ser adicionadas aos poucos)
- Tratamento automático de foto: nitidez, iluminação e resolução 4K
- Mapa do país da missão com estrela na localização e nome oficial da missão
- Múltiplas opções de ordenação: cronológica, nome, ala, status
- Totalmente responsivo: desktop, tablet e celular

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind CSS |
| Banco de dados | Supabase (PostgreSQL) |
| Armazenamento de fotos | Supabase Storage |
| Hospedagem | Vercel |
| Tratamento de imagem | Python (Pillow + OpenCV) |

---

## Configuração

### 1. Clone o repositório

```bash
git clone https://github.com/ilcileyjunior01/nossos-missionarios.git
cd nossos-missionarios
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preencha `.env.local` com suas chaves do Supabase.

### 4. Configure o banco de dados

Execute o arquivo `supabase_schema.sql` no SQL Editor do seu projeto Supabase.

### 5. Instale as dependências Python (para tratamento de foto)

```bash
pip install -r python/requirements.txt
```

### 6. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## Estrutura do Projeto

```
nossos-missionarios/
├── src/
│   ├── app/              # Páginas e rotas (Next.js App Router)
│   ├── components/       # Componentes React reutilizáveis
│   ├── lib/              # Utilitários (Supabase, status, helpers)
│   └── types/            # Tipos TypeScript
├── python/
│   ├── image_processing.py   # Tratamento de imagem
│   └── requirements.txt
├── public/               # Arquivos estáticos
├── supabase_schema.sql   # Schema do banco de dados
└── .env.local.example    # Modelo de variáveis de ambiente
```
