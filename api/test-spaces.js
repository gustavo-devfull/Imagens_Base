const AWS = require('aws-sdk');

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

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Método não permitido' });
    return;
  }

  try {
    // Verificar variáveis de ambiente
    const accessKey = process.env.DO_ACCESS_KEY;
    const secretKey = process.env.DO_SECRET_KEY;
    
    console.log('=== TESTE DE CONEXÃO SPACES ===');
    console.log('Access Key presente:', !!accessKey);
    console.log('Secret Key presente:', !!secretKey);
    console.log('Access Key (primeiros 10 chars):', accessKey ? accessKey.substring(0, 10) + '...' : 'NÃO DEFINIDA');
    
    if (!accessKey || !secretKey) {
      return res.status(500).json({
        success: false,
        error: 'Variáveis de ambiente não configuradas',
        details: {
          DO_ACCESS_KEY: !!accessKey,
          DO_SECRET_KEY: !!secretKey
        }
      });
    }
    
    // Configuração do DigitalOcean Spaces
    const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
    const s3 = new AWS.S3({
      endpoint: spacesEndpoint,
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      region: 'nyc3',
      s3ForcePathStyle: false,
      signatureVersion: 'v4'
    });
    
    console.log('Tentando conectar ao bucket moribr...');
    
    const params = {
      Bucket: 'moribr',
      Prefix: 'base-fotos/',
      MaxKeys: 1
    };
    
    const result = await s3.listObjectsV2(params).promise();
    
    console.log('Conexão bem-sucedida!');
    console.log('Objetos encontrados:', result.Contents ? result.Contents.length : 0);
    
    res.json({ 
      success: true, 
      message: 'Conexão com DigitalOcean Spaces OK',
      bucketContents: result.Contents ? result.Contents.length : 0,
      bucketName: 'moribr',
      region: 'nyc3',
      endpoint: 'nyc3.digitaloceanspaces.com'
    });
    
  } catch (error) {
    console.error('Erro na conexão:', error);
    
    let errorMessage = error.message;
    let errorCode = error.code;
    
    if (error.code === 'InvalidAccessKeyId') {
      errorMessage = 'Access Key inválida';
    } else if (error.code === 'SignatureDoesNotMatch') {
      errorMessage = 'Secret Key inválida';
    } else if (error.code === 'NoSuchBucket') {
      errorMessage = 'Bucket moribr não encontrado';
    } else if (error.code === 'AccessDenied') {
      errorMessage = 'Acesso negado ao bucket';
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      code: errorCode,
      details: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode
      }
    });
  }
}