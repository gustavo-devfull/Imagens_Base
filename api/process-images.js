// Handler simples para debug
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
    console.log('=== DEBUG API PROCESS-IMAGES ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    
    const { refs, customNames } = req.body;
    
    console.log('REFs recebidos:', refs);
    console.log('Nomes personalizados:', customNames);
    
    if (!refs || !Array.isArray(refs)) {
      console.log('ERRO: REFs inválidos');
      res.status(400).json({ error: 'Lista de REFs é obrigatória' });
      return;
    }
    
    // Verificar variáveis de ambiente
    const accessKey = process.env.DO_ACCESS_KEY;
    const secretKey = process.env.DO_SECRET_KEY;
    
    console.log('Variáveis de ambiente:');
    console.log('- DO_ACCESS_KEY presente:', !!accessKey);
    console.log('- DO_SECRET_KEY presente:', !!secretKey);
    
    if (!accessKey || !secretKey) {
      console.log('ERRO: Variáveis de ambiente não configuradas');
      res.status(500).json({
        success: false,
        error: 'Variáveis de ambiente não configuradas',
        accessKeyPresent: !!accessKey,
        secretKeyPresent: !!secretKey
      });
      return;
    }
    
    // Simular processamento sem fazer operações reais
    const results = refs.map((ref, index) => {
      const customName = customNames && customNames[index] ? customNames[index] : ref;
      
      console.log(`Simulando processamento: ${ref} -> ${customName}`);
      
      return {
        ref: ref,
        customName: customName,
        filename: `${customName}.jpg`,
        url: `https://moribr.nyc3.cdn.digitaloceanspaces.com/base-fotos/${customName}.jpg`,
        success: true,
        simulated: true
      };
    });
    
    console.log('Resultado simulado:', results);
    
    res.json({
      success: true,
      results: results,
      totalProcessed: results.length,
      successCount: results.length,
      errorCount: 0,
      message: 'Processamento simulado - variáveis de ambiente OK',
      debug: {
        accessKeyPresent: !!accessKey,
        secretKeyPresent: !!secretKey,
        refsCount: refs.length
      }
    });
    
  } catch (error) {
    console.error('ERRO GERAL:', error);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}