export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, imageUrl, seed } = req.body;

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing Gemini API key' });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { 
                  text: prompt 
                },
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: imageUrl 
                  }
                }                
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            candidateCount: 1,
            seed: seed,
            responseModalities: ["TEXT", "IMAGE"]
          }
        })
      }
    );

    const result = await geminiRes.json();
    
    res.status(200).json({
      result: result,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}