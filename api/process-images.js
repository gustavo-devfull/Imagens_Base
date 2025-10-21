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

// Função para baixar imagem
async function downloadImage(url) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer'
    });
    
    return response.data;
  } catch (error) {
    throw new Error(`Erro ao baixar imagem: ${error.message}`);
  }
}

// Função para fazer upload para DigitalOcean Spaces
async function uploadToSpaces(imageBuffer, key) {
  try {
    const params = {
      Bucket: 'moribr',
      Key: `base-fotos/${key}`,
      Body: imageBuffer,
      ACL: 'public-read',
      ContentType: 'image/jpeg'
    };
    
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    throw new Error(`Erro ao fazer upload: ${error.message}`);
  }
}

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
    
    console.log('Dados recebidos:', { refs, customNames });
    
    if (!refs || !Array.isArray(refs)) {
      res.status(400).json({ error: 'Lista de REFs é obrigatória' });
      return;
    }
    
    const results = [];
    
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i];
      const customName = customNames && customNames[i] ? customNames[i] : ref;
      
      console.log(`Processando REF ${ref} -> Nome personalizado: ${customName}`);
      
      try {
        const imageUrl = `https://ideolog.ia.br/images/products/${ref}.jpg`;
        const filename = `${customName}.jpg`;
        
        // Baixar imagem
        const imageBuffer = await downloadImage(imageUrl);
        
        // Upload para Spaces usando o nome personalizado
        const spacesUrl = await uploadToSpaces(imageBuffer, filename);
        
        console.log(`Sucesso: ${ref} -> ${filename} -> ${spacesUrl}`);
        
        results.push({
          ref: ref,
          customName: customName,
          filename: filename,
          url: spacesUrl,
          success: true
        });
        
      } catch (error) {
        console.error(`Erro ao processar ${ref}:`, error.message);
        results.push({
          ref: ref,
          customName: customName,
          filename: `${customName}.jpg`,
          error: error.message,
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
    console.error('Erro no processamento:', error);
    res.status(500).json({ error: error.message });
  }
}

export default handler;
