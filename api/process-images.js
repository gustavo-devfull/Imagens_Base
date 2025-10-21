const AWS = require('aws-sdk');
const axios = require('axios');

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
    
    // Verificar variáveis de ambiente primeiro
    const accessKey = process.env.DO_ACCESS_KEY;
    const secretKey = process.env.DO_SECRET_KEY;
    
    console.log('Verificando variáveis de ambiente...');
    console.log('Access Key presente:', !!accessKey);
    console.log('Secret Key presente:', !!secretKey);
    
    if (!accessKey || !secretKey) {
      console.log('ERRO: Variáveis de ambiente não configuradas');
      res.status(500).json({
        success: false,
        error: 'Variáveis de ambiente do DigitalOcean Spaces não configuradas',
        details: {
          DO_ACCESS_KEY: !!accessKey,
          DO_SECRET_KEY: !!secretKey
        }
      });
      return;
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
    
    // Testar conexão primeiro
    console.log('Testando conexão com Spaces...');
    try {
      await s3.headBucket({ Bucket: 'moribr' }).promise();
      console.log('✅ Conexão com Spaces OK');
    } catch (error) {
      console.error('❌ Erro na conexão com Spaces:', error.message);
      res.status(500).json({
        success: false,
        error: 'Erro na conexão com DigitalOcean Spaces',
        details: error.message
      });
      return;
    }
    
    // Processar apenas a primeira imagem para teste
    const refsToProcess = refs.slice(0, 1);
    console.log(`Processando ${refsToProcess.length} imagem(s) para teste`);
    
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
        
        // Baixar imagem
        console.log('Iniciando download...');
        const response = await axios({
          method: 'GET',
          url: imageUrl,
          responseType: 'arraybuffer',
          timeout: 10000,
          maxContentLength: 5 * 1024 * 1024, // Limite de 5MB
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'image/jpeg,image/jpg,image/png,*/*'
          }
        });
        
        console.log(`Download concluído: ${response.data.length} bytes`);
        
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
      message: refs.length > 1 ? `Processado apenas 1 de ${refs.length} imagens para teste` : 'Processamento concluído'
    });
    
  } catch (error) {
    console.error('=== ERRO GERAL ===');
    console.error('Erro no processamento:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: error.message });
  }
}