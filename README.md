# Sistema de Processamento de Imagens

Este sistema permite processar planilhas Excel/CSV, identificar campos REF e fazer download automático de imagens para armazenamento no DigitalOcean Spaces.

## 🚀 Funcionalidades

- **Upload de Planilhas**: Suporte para arquivos Excel (.xlsx, .xls) e CSV
- **Detecção Automática**: Identifica automaticamente o campo REF na planilha
- **Download de Imagens**: Baixa imagens automaticamente de `https://ideolog.ia.br/images/products/{REF}.jpg`
- **Armazenamento**: Upload automático para DigitalOcean Spaces na pasta `base-fotos`
- **Personalização**: Modal para alterar nomes dos arquivos antes do processamento
- **Interface Moderna**: Interface web responsiva e intuitiva

## 📋 Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn
- Conta no DigitalOcean Spaces

## 🛠️ Instalação

1. Clone ou baixe o projeto
2. Instale as dependências:
```bash
npm install
```

3. Configure as credenciais do DigitalOcean Spaces no arquivo `index.js`:
```javascript
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: 'SUA_ACCESS_KEY',
  secretAccessKey: 'SUA_SECRET_KEY',
  region: 'nyc3'
});
```

## 🚀 Como Usar

1. Inicie o servidor:
```bash
npm start
```

2. Acesse `http://localhost:3000` no seu navegador

3. **Passo 1**: Faça upload da sua planilha (Excel ou CSV)
4. **Passo 2**: Revise os REFs encontrados
5. **Passo 3**: Personalize os nomes dos arquivos (opcional)
6. **Passo 4**: Processe as imagens
7. **Passo 5**: Visualize os resultados

## 📁 Estrutura do Projeto

```
Imagem_Base/
├── index.js              # Servidor principal
├── package.json          # Dependências do projeto
├── public/
│   └── index.html       # Interface web
├── uploads/             # Arquivos temporários de upload
└── temp/                # Imagens temporárias durante processamento
```

## 🔧 Configuração do DigitalOcean Spaces

O sistema está configurado para usar:
- **Bucket**: moribr
- **Pasta**: base-fotos
- **Endpoint**: moribr.nyc3.digitaloceanspaces.com
- **CDN**: moribr.nyc3.cdn.digitaloceanspaces.com

## 📊 Formato da Planilha

A planilha deve conter uma coluna com campo REF. O sistema detecta automaticamente colunas com nomes como:
- REF
- Referencia
- Código
- Code
- ID

## 🎯 Exemplo de Uso

1. Prepare uma planilha com uma coluna REF:
```
REF     | Nome        | Preço
ABC123  | Produto A   | 29.90
DEF456  | Produto B   | 39.90
```

2. Faça upload da planilha
3. O sistema encontrará as REFs: ABC123, DEF456
4. Baixará as imagens:
   - `https://ideolog.ia.br/images/products/ABC123.jpg`
   - `https://ideolog.ia.br/images/products/DEF456.jpg`
5. Salvará no Spaces como:
   - `base-fotos/ABC123.jpg`
   - `base-fotos/DEF456.jpg`

## 🔍 Monitoramento

O sistema fornece:
- Progresso em tempo real
- Logs detalhados de sucessos e erros
- URLs das imagens salvas
- Estatísticas do processamento

## 🛡️ Segurança

- Validação de tipos de arquivo
- Sanitização de nomes de arquivos
- Tratamento de erros robusto
- Limpeza automática de arquivos temporários

## 📝 Logs

O sistema registra:
- Uploads de planilhas
- Downloads de imagens
- Uploads para Spaces
- Erros e exceções

## 🔄 Desenvolvimento

Para modo de desenvolvimento com auto-reload:
```bash
npm run dev
```

## 📞 Suporte

Em caso de problemas:
1. Verifique a conexão com DigitalOcean Spaces
2. Confirme se as credenciais estão corretas
3. Verifique se o formato da planilha está correto
4. Consulte os logs do servidor para detalhes dos erros

