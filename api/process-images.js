// Handler que faz upload real para DigitalOcean Spaces
export default async function handler(req, res) {
  try {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    console.log('=== PROCESSAMENTO REAL DE IMAGENS ===');
    console.log('Method:', req.method);
    console.log('Body:', req.body);
    
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Método não permitido' });
      return;
    }

    const { refs, customNames } = req.body;
    
    console.log('REFs recebidos:', refs);
    console.log('Nomes personalizados:', customNames);
    
    if (!refs || !Array.isArray(refs)) {
      res.status(400).json({ error: 'Lista de REFs é obrigatória' });
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
      
      // Download real da imagem
      console.log(`[DOWNLOAD] Baixando: ${imageUrl}`);
      
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ImagemBase/1.0)',
          'Accept': 'image/jpeg, image/png, image/gif, image/webp, */*',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const imageBuffer = await response.arrayBuffer();
      console.log(`[DOWNLOAD] Download concluído. Tamanho: ${imageBuffer.byteLength} bytes`);
      
      // Upload real para Spaces
      console.log(`[UPLOAD] Fazendo upload de ${filename} para Spaces`);
      
      const AWS = require('aws-sdk');
      const spacesEndpoint = new AWS.Endpoint('nyc3.digitaloceanspaces.com');
      const s3 = new AWS.S3({
        endpoint: spacesEndpoint,
        accessKeyId: process.env.DO_ACCESS_KEY || 'DO00U3TGARCUQ4BBXLUF',
        secretAccessKey: process.env.DO_SECRET_KEY || '2UOswaN5G4JUnfv8wk/QTlO3KQU+5qywlnmoG8ho6kM',
        region: 'nyc3',
        s3ForcePathStyle: false,
        signatureVersion: 'v4'
      });
      
      const params = {
        Bucket: 'moribr',
        Key: `base-fotos/${filename}`,
        Body: Buffer.from(imageBuffer),
        ACL: 'public-read',
        ContentType: 'image/jpeg'
      };
      
      const uploadResult = await s3.upload(params).promise();
      console.log(`[UPLOAD] Upload concluído: ${uploadResult.Location}`);
      
      results.push({
        ref: ref,
        customName: customName,
        filename: filename,
        url: uploadResult.Location,
        success: true,
        downloaded: true,
        uploaded: true
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
    
    const response = {
      success: true,
      results: results,
      totalProcessed: results.length,
      successCount: results.filter(r => r.success).length,
      errorCount: results.filter(r => !r.success).length,
      message: 'Processamento real - Imagem baixada e enviada para Spaces'
    };
    
    console.log('Resposta:', response);
    
    res.status(200).json(response);
    
  } catch (error) {
    console.error('ERRO CRÍTICO:', error);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}