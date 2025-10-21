// API ultra simples sem dependências
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
    console.log('=== API PROCESS-IMAGES SIMPLES ===');
    console.log('Method:', req.method);
    console.log('Body:', req.body);
    
    const { refs, customNames } = req.body;
    
    if (!refs || !Array.isArray(refs)) {
      res.status(400).json({ error: 'Lista de REFs é obrigatória' });
      return;
    }
    
    // Simular processamento sem operações reais
    const results = refs.map((ref, index) => {
      const customName = customNames && customNames[index] ? customNames[index] : ref;
      
      return {
        ref: ref,
        customName: customName,
        filename: `${customName}.jpg`,
        url: `https://moribr.nyc3.cdn.digitaloceanspaces.com/base-fotos/${customName}.jpg`,
        success: true,
        simulated: true
      };
    });
    
    res.json({
      success: true,
      results: results,
      totalProcessed: results.length,
      successCount: results.length,
      errorCount: 0,
      message: 'Processamento simulado - API funcionando'
    });
    
  } catch (error) {
    console.error('ERRO:', error);
    res.status(500).json({ error: error.message });
  }
}