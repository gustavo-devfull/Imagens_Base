const AWS = require('aws-sdk');

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

// Handler principal
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  try {
    console.log('=== VERIFICAÇÃO DE IMAGEM ===');
    const { filename } = req.body;
    
    if (!filename) {
      res.status(400).json({ error: 'Nome do arquivo é obrigatório' });
      return;
    }
    
    const key = `base-fotos/${filename}`;
    console.log(`Verificando: ${key}`);
    
    // Verificar se o arquivo existe
    const params = {
      Bucket: 'moribr',
      Key: key
    };
    
    try {
      const result = await s3.headObject(params).promise();
      
      console.log('Arquivo encontrado:', result);
      
      res.json({
        success: true,
        exists: true,
        filename: filename,
        key: key,
        size: result.ContentLength,
        lastModified: result.LastModified,
        contentType: result.ContentType,
        publicUrl: `https://moribr.nyc3.cdn.digitaloceanspaces.com/${key}`
      });
      
    } catch (error) {
      if (error.code === 'NotFound' || error.code === 'NoSuchKey') {
        console.log('Arquivo não encontrado');
        
        res.json({
          success: true,
          exists: false,
          filename: filename,
          key: key,
          message: 'Arquivo não encontrado no Spaces'
        });
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('Erro na verificação:', error);
    res.status(500).json({ 
      success: false,
      error: error.message,
      code: error.code
    });
  }
}
