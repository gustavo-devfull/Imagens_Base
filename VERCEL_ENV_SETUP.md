# Configuração das Variáveis de Ambiente no Vercel

## 🔧 Configuração Manual no Dashboard do Vercel

### Passo 1: Acessar o Dashboard
1. Acesse [vercel.com](https://vercel.com)
2. Faça login na sua conta
3. Selecione o projeto `imagens-base`

### Passo 2: Configurar Variáveis de Ambiente
1. Vá para **Settings** → **Environment Variables**
2. Adicione as seguintes variáveis:

#### Variável 1:
- **Name**: `DO_ACCESS_KEY`
- **Value**: `DO00U3TGARCUQ4BBXLUF`
- **Environment**: Production, Preview, Development

#### Variável 2:
- **Name**: `DO_SECRET_KEY`
- **Value**: `2UOswaN5G4JUnfv8wk/QTlO3KQU+5qywlnmoG8ho6kM`
- **Environment**: Production, Preview, Development

### Passo 3: Redeploy
1. Após adicionar as variáveis, vá para **Deployments**
2. Clique nos três pontos do último deployment
3. Selecione **Redeploy**

## 🔍 Verificação

### Teste a Conexão:
1. Acesse: `https://imagens-base.vercel.app/api/test-spaces`
2. Deve retornar JSON com `success: true`

### Se Ainda Der Erro:
1. Verifique se as variáveis foram salvas corretamente
2. Confirme que o redeploy foi feito
3. Verifique os logs em **Functions** → **Logs**

## 📋 Informações do DigitalOcean Spaces

- **Bucket**: moribr
- **Região**: nyc3
- **Endpoint**: nyc3.digitaloceanspaces.com
- **CDN**: moribr.nyc3.cdn.digitaloceanspaces.com

## 🚨 Troubleshooting

### Erro "InvalidAccessKeyId":
- Verifique se `DO_ACCESS_KEY` está correto
- Confirme que não há espaços extras

### Erro "SignatureDoesNotMatch":
- Verifique se `DO_SECRET_KEY` está correto
- Confirme que não há espaços extras

### Erro "NoSuchBucket":
- Verifique se o bucket `moribr` existe
- Confirme a região `nyc3`

### Erro "AccessDenied":
- Verifique as permissões da Access Key
- Confirme que tem acesso ao bucket
