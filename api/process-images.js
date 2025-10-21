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
    
    console.log('=== PROCESSAMENTO DE IMAGENS ===');
    console.log('REFs:', refs);
    console.log('Nomes personalizados:', customNames);
    
    if (!refs || !Array.isArray(refs)) {
      res.status(400).json({ error: 'Lista de REFs é obrigatória' });
      return;
    }
    
    // Verificar variáveis de ambiente
    const accessKey = process.env.DO_ACCESS_KEY;
    const secretKey = process.env.DO_SECRET_KEY;
    
    if (!accessKey || !secretKey) {
      res.status(500).json({
        success: false,
        error: 'Variáveis de ambiente não configuradas'
      });
      return;
    }
    
    const results = [];
    
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i];
      const customName = customNames && customNames[i] ? customNames[i] : ref;
      
      console.log(`Processando: ${ref} -> ${customName}`);
      
      try {
        const imageUrl = `https://ideolog.ia.br/images/products/${ref}.jpg`;
        const filename = `${customName}.jpg`;
        
        // Baixar imagem
        console.log(`Baixando: ${imageUrl}`);
        const response = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'arraybuffer',
          timeout: 15000,
          maxContentLength: 10 * 1024 * 1024, // Limite de 10MB
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        console.log(`Download concluído: ${response.data.length} bytes`);
        
        // Upload para Spaces com permissão pública
        console.log(`Fazendo upload: ${filename}`);
        const params = {
          Bucket: 'moribr',
          Key: `base-fotos/${filename}`,
          Body: response.data,
          ACL: 'public-read', // Permissão de leitura pública
          ContentType: 'image/jpeg',
          CacheControl: 'public, max-age=31536000', // Cache por 1 ano
          Metadata: {
            'original-ref': ref,
            'custom-name': customName,
            'uploaded-at': new Date().toISOString()
          }
        };
        
        const uploadResult = await s3.upload(params).promise();
        
        // URL pública da imagem
        const publicUrl = `https://moribr.nyc3.cdn.digitaloceanspaces.com/base-fotos/${filename}`;
        
        console.log(`Upload concluído: ${publicUrl}`);
        
        results.push({
          ref: ref,
          customName: customName,
          filename: filename,
          url: publicUrl, // URL pública via CDN
          success: true
        });
        
      } catch (error) {
        console.error(`Erro ao processar ${ref}:`, error.message);
        
        let errorMessage = error.message;
        if (error.code === 'ECONNABORTED') {
          errorMessage = 'Timeout no download da imagem';
        } else if (error.response && error.response.status === 404) {
          errorMessage = 'Imagem não encontrada no servidor';
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
    
    res.json({
      success: true,
      results: results,
      totalProcessed: results.length,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length
    });
    
  } catch (error) {
    console.error('Erro geral:', error);
    res.status(500).json({ error: error.message });
  }
}