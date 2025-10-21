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
  console.log(`[DOWNLOAD] Iniciando download de: ${url}`);
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      timeout: 15000, // 15 segundos de timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImagemBase/1.0)',
        'Accept': 'image/jpeg, image/png, image/gif, image/webp, */*',
      }
    });
    console.log(`[DOWNLOAD] Download concluído. Tamanho: ${response.data.length} bytes`);
    return response.data;
  } catch (error) {
    console.error(`[DOWNLOAD ERROR] Erro ao baixar imagem ${url}:`, error.message);
    if (error.code === 'ECONNABORTED') {
      throw new Error(`Download da imagem ${url} excedeu o tempo limite (15s).`);
    }
    throw new Error(`Erro ao baixar imagem ${url}: ${error.message}`);
  }
}

// Função para fazer upload para DigitalOcean Spaces
async function uploadToSpaces(imageBuffer, filename) {
  console.log(`[UPLOAD] Iniciando upload de ${filename} para Spaces.`);
  const params = {
    Bucket: 'moribr', // Seu bucket
    Key: `base-fotos/${filename}`, // Pasta e nome do arquivo
    Body: imageBuffer,
    ACL: 'public-read', // Torna o arquivo público
    ContentType: 'image/jpeg', // Assumindo JPEG, pode ser dinâmico
    Metadata: {
      'original-filename': filename,
      'uploaded-by': 'ImagemBaseSystem'
    }
  };

  try {
    const data = await s3.upload(params).promise();
    console.log(`[UPLOAD] Upload concluído para: ${data.Location}`);
    return data.Location;
  } catch (error) {
    console.error(`[UPLOAD ERROR] Erro ao fazer upload de ${filename} para Spaces:`, error);
    throw new Error(`Erro ao fazer upload para DigitalOcean Spaces: ${error.message}`);
  }
}

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

  console.log('[PROCESS-IMAGES] Requisição recebida.');
  try {
    const { refs, customNames } = req.body;
    
    console.log('[PROCESS-IMAGES] Dados recebidos:', { refs, customNames });
    
    if (!refs || !Array.isArray(refs) || refs.length === 0) {
      res.status(400).json({ error: 'Lista de REFs é obrigatória e não pode ser vazia' });
      return;
    }
    
    const results = [];
    
    // Processar apenas a primeira imagem para evitar timeout do Vercel
    const ref = refs[0];
    const customName = customNames && customNames[0] ? customNames[0] : ref;
    
    console.log(`[PROCESS-IMAGES] Processando REF ${ref} -> Nome personalizado: ${customName}`);
    
    try {
      const imageUrl = `https://ideolog.ia.br/images/products/${ref}.jpg`;
      const filename = `${customName}.jpg`;
      
      // Baixar imagem
      const imageBuffer = await downloadImage(imageUrl);
      
      // Upload para Spaces usando o nome personalizado
      const spacesUrl = await uploadToSpaces(imageBuffer, filename);
      
      console.log(`[PROCESS-IMAGES] Sucesso: ${ref} -> ${filename} -> ${spacesUrl}`);
      
      results.push({
        ref: ref,
        customName: customName,
        filename: filename,
        url: spacesUrl,
        success: true
      });
      
    } catch (error) {
      console.error(`[PROCESS-IMAGES ERROR] Erro ao processar ${ref}:`, error.message, error.stack);
      results.push({
        ref: ref,
        customName: customName,
        filename: `${customName}.jpg`,
        error: error.message,
        success: false
      });
    }
    
    res.json({
      success: true,
      results: results,
      totalProcessed: results.length,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length
    });
    
  } catch (error) {
    console.error('[PROCESS-IMAGES ERROR] Erro no processamento geral:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
}