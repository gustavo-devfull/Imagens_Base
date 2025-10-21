// Handler simples para teste de conectividade
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
    const { refs, customNames } = req.body;
    
    console.log('=== TESTE SIMPLES ===');
    console.log('Dados recebidos:', { refs, customNames });
    
    if (!refs || !Array.isArray(refs)) {
      res.status(400).json({ error: 'Lista de REFs é obrigatória' });
      return;
    }
    
    // Simular processamento sem fazer download/upload real
    const results = refs.map((ref, index) => {
      const customName = customNames && customNames[index] ? customNames[index] : ref;
      
      return {
        ref: ref,
        customName: customName,
        filename: `${customName}.jpg`,
        url: `https://moribr.nyc3.cdn.digitaloceanspaces.com/base-fotos/${customName}.jpg`,
        success: true,
        test: true
      };
    });
    
    console.log('Resultado do teste:', results);
    
    res.json({
      success: true,
      results: results,
      totalProcessed: results.length,
      successCount: results.length,
      errorCount: 0,
      test: true
    });
    
  } catch (error) {
    console.error('Erro no teste:', error);
    res.status(500).json({ error: error.message });
  }
}
