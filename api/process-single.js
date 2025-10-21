// Handler para processar uma única imagem
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
    const { ref, customName } = req.body;
    
    console.log('=== PROCESSAMENTO DE UMA IMAGEM ===');
    console.log('REF:', ref);
    console.log('Nome personalizado:', customName);
    
    if (!ref) {
      res.status(400).json({ error: 'REF é obrigatório' });
      return;
    }
    
    const finalName = customName || ref;
    const imageUrl = `https://ideolog.ia.br/images/products/${ref}.jpg`;
    const filename = `${finalName}.jpg`;
    
    console.log(`URL da imagem: ${imageUrl}`);
    console.log(`Nome do arquivo: ${filename}`);
    
    try {
      // Baixar imagem
      console.log('Iniciando download...');
      const axios = require('axios');
      const response = await axios({
        method: 'GET',
        url: imageUrl,
        responseType: 'arraybuffer',
        timeout: 10000,
        maxContentLength: 5 * 1024 * 1024, // Limite de 5MB
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log(`Download concluído: ${response.data.length} bytes`);
      
      // Upload para Spaces
      console.log('Iniciando upload para Spaces...');
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
        Body: response.data,
        ACL: 'public-read',
        ContentType: 'image/jpeg'
      };
      
      const uploadResult = await s3.upload(params).promise();
      console.log(`Upload concluído: ${uploadResult.Location}`);
      
      res.json({
        success: true,
        ref: ref,
        customName: finalName,
        filename: filename,
        url: uploadResult.Location,
        message: 'Imagem processada com sucesso'
      });
      
    } catch (error) {
      console.error(`Erro ao processar ${ref}:`, error.message);
      
      let errorMessage = error.message;
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Timeout no download da imagem';
      } else if (error.response && error.response.status === 404) {
        errorMessage = 'Imagem não encontrada no servidor';
      }
      
      res.status(500).json({
        success: false,
        ref: ref,
        customName: finalName,
        filename: filename,
        error: errorMessage
      });
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
    res.status(500).json({ error: error.message });
  }
}
