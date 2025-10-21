const AWS = require('aws-sdk');
const axios = require('axios');

// Configuração do DigitalOcean Spaces
const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
const s3 = new AWS.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_ACCESS_KEY || 'DO00U3TGARCUQ4BBXLUF',
  secretAccessKey: process.env.DO_SECRET_KEY || '2UOswaN5G4JUnfv8wk/QTlO3KQU+5qywlnmoG8ho6kM',
  region: 'nyc3',
  s3ForcePathStyle: false,
  signatureVersion: 'v4'
});

// Middleware para CORS
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Handler principal
export default async function handler(req, res) {
  // Configurar CORS
  setCorsHeaders(res);
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  try {
    const { refs, customNames } = req.body;
    
    console.log('=== INÍCIO DO PROCESSAMENTO ===');
    console.log('Dados recebidos:', { refs, customNames });
    
    if (!refs || !Array.isArray(refs)) {
      console.log('ERRO: Lista de REFs inválida');
      res.status(400).json({ error: 'Lista de REFs é obrigatória' });
      return;
    }
    
    // Limitar a 1 imagem por vez para evitar timeout
    const refsToProcess = refs.slice(0, 1);
    console.log(`Processando apenas ${refsToProcess.length} imagem(s) para evitar timeout`);
    
    const results = [];
    
    for (let i = 0; i < refsToProcess.length; i++) {
      const ref = refsToProcess[i];
      const customName = customNames && customNames[i] ? customNames[i] : ref;
      
      console.log(`\n--- Processando REF ${i + 1}/${refsToProcess.length} ---`);
      console.log(`REF: ${ref}`);
      console.log(`Nome personalizado: ${customName}`);
      
      try {
        const imageUrl = `https://ideolog.ia.br/images/products/${ref}.jpg`;
        const filename = `${customName}.jpg`;
        
        console.log(`URL da imagem: ${imageUrl}`);
        console.log(`Nome do arquivo: ${filename}`);
        
        // Baixar imagem com configurações otimizadas
        console.log('Iniciando download...');
        const response = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'arraybuffer',
          timeout: 15000, // Reduzido para 15 segundos
          maxContentLength: 10 * 1024 * 1024, // Limite de 10MB
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/jpeg,image/jpg,image/png,*/*'
          }
        });
        
        console.log(`Download concluído: ${response.data.length} bytes`);
        
        // Verificar se a imagem é válida
        if (response.data.length === 0) {
          throw new Error('Imagem vazia ou não encontrada');
        }
        
        // Upload para Spaces
        console.log('Iniciando upload para Spaces...');
        const params = {
          Bucket: 'moribr',
          Key: `base-fotos/${filename}`,
          Body: response.data,
          ACL: 'public-read',
          ContentType: 'image/jpeg',
          Metadata: {
            'original-ref': ref,
            'custom-name': customName
          }
        };
        
        const uploadResult = await s3.upload(params).promise();
        console.log(`Upload concluído: ${uploadResult.Location}`);
        
        results.push({
          ref: ref,
          customName: customName,
          filename: filename,
          url: uploadResult.Location,
          success: true
        });
        
        console.log(`✅ Sucesso: ${ref} -> ${filename}`);
        
      } catch (error) {
        console.error(`❌ Erro ao processar ${ref}:`, error.message);
        
        // Determinar tipo de erro
        let errorMessage = error.message;
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Timeout no download da imagem';
        } else if (error.response && error.response.status === 404) {
          errorMessage = 'Imagem não encontrada no servidor';
        } else if (error.code === 'ENOTFOUND') {
          errorMessage = 'Erro de conexão com o servidor';
        }
        
        results.push({
          ref: ref,
          customName: customName,
          filename: `${customName}.jpg`,
          error: errorMessage,
          success: false
        });
      }
    }
    
    console.log('\n=== RESULTADO FINAL ===');
    console.log(`Total processado: ${results.length}`);
    console.log(`Sucessos: ${results.filter(r => r.success).length}`);
    console.log(`Erros: ${results.filter(r => !r.success).length}`);
    
    res.json({
      success: true,
      results: results,
      totalProcessed: results.length,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length,
      message: refs.length > 1 ? `Processado apenas 1 de ${refs.length} imagens para evitar timeout` : 'Processamento concluído'
    });
    
  } catch (error) {
    console.error('=== ERRO GERAL ===');
    console.error('Erro no processamento:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
}