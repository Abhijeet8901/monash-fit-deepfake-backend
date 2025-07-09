export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { prompt, imageUrl, seed } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'Missing Gemini API key' });

  try {
    const imgBuffer = await fetch(imageUrl).then(r => r.arrayBuffer());
    const base64Image = Buffer.from(imgBuffer).toString('base64');

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Image,
                  },
                },
                { text: prompt },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            candidateCount: 1,
            seed,
          },
        }),
      }
    );

    const result = await geminiRes.json();
    const imageData = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

    res.status(200).json({
      generatedImageUrl: `data:image/jpeg;base64,${imageData}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}
