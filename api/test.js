// API de teste ultra simples
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
    console.log('=== TESTE SIMPLES ===');
    
    res.json({
      success: true,
      message: 'API de teste funcionando',
      timestamp: new Date().toISOString(),
      method: req.method
    });
    
  } catch (error) {
    console.error('ERRO:', error);
    res.status(500).json({ error: error.message });
  }
}