# Deploy no Vercel

## 🚀 Configuração para Vercel

Este projeto foi adaptado para funcionar no Vercel como Serverless Functions.

### 📁 Estrutura para Vercel:

```
Imagem_Base/
├── api/
│   └── index.js          # Serverless Function principal
├── public/
│   └── index.html        # Interface web
├── vercel.json           # Configuração do Vercel
├── package.json          # Dependências
└── README.md             # Documentação
```

### 🔧 Principais Mudanças:

1. **Serverless Function**: Código movido para `/api/index.js`
2. **Multer Memory Storage**: Upload de arquivos em memória (sem filesystem)
3. **Buffer Processing**: Processamento de planilhas e imagens em buffer
4. **Environment Variables**: Credenciais via variáveis de ambiente
5. **API Routes**: Todas as rotas agora usam `/api/` prefix

### 🌐 Deploy:

1. **Conecte o repositório ao Vercel**
2. **Configure as variáveis de ambiente**:
   - `DO_ACCESS_KEY`: DO00U3TGARCUQ4BBXLUF
   - `DO_SECRET_KEY`: 2UOswaN5G4JUnfv8wk/QTlO3KQU+5qywlnmoG8ho6kM

3. **Deploy automático** será feito pelo Vercel

### ⚡ Funcionalidades Mantidas:

- ✅ Upload de planilhas Excel/CSV
- ✅ Detecção automática de campo REF
- ✅ Download de imagens
- ✅ Upload para DigitalOcean Spaces
- ✅ Modal para personalizar nomes
- ✅ Botão para salvar REFs personalizados
- ✅ Interface web responsiva

### 🔍 URLs das APIs:

- `POST /api/upload-spreadsheet` - Upload de planilha
- `POST /api/process-images` - Processar imagens
- `GET /api/test-spaces` - Testar conexão

### 📊 Limitações do Vercel:

- **Timeout**: 10 segundos para Hobby, 60 segundos para Pro
- **Memory**: 1024MB máximo
- **Payload**: 4.5MB máximo para upload

### 🚨 Solução de Problemas:

Se ainda houver erro 500, verifique:
1. Variáveis de ambiente configuradas
2. Dependências instaladas corretamente
3. Logs do Vercel para detalhes do erro
