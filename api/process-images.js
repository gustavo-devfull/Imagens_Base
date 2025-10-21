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
    
    const results = [];
    
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i];
      const customName = customNames && customNames[i] ? customNames[i] : ref;
      
      console.log(`\n--- Processando REF ${i + 1}/${refs.length} ---`);
      console.log(`REF: ${ref}`);
      console.log(`Nome personalizado: ${customName}`);
      
      try {
        const imageUrl = `https://ideolog.ia.br/images/products/${ref}.jpg`;
        const filename = `${customName}.jpg`;
        
        console.log(`URL da imagem: ${imageUrl}`);
        console.log(`Nome do arquivo: ${filename}`);
        
        // Baixar imagem
        console.log('Iniciando download...');
        const response = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        console.log(`Download concluído: ${response.data.length} bytes`);
        
        // Upload para Spaces
        console.log('Iniciando upload para Spaces...');
        const params = {
          Bucket: 'moribr',
          Key: `base-fotos/${filename}`,
          Body: response.data,
          ACL: 'public-read',
          ContentType: 'image/jpeg'
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
        console.error('Detalhes do erro:', error);
        
        results.push({
          ref: ref,
          customName: customName,
          filename: `${customName}.jpg`,
          error: error.message,
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
      errorCount: results.filter(r => !r.success).length
    });
    
  } catch (error) {
    console.error('=== ERRO GERAL ===');
    console.error('Erro no processamento:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
}