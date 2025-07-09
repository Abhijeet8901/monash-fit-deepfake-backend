// export default async function handler(req, res) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   if (req.method === 'OPTIONS') {
//     return res.status(200).end();
//   }

//   if (req.method !== 'POST') {
//     return res.status(405).json({ error: 'Method Not Allowed' });
//   }

//   const { prompt, base64Image, seed } = req.body;
//   const apiKey = process.env.GEMINI_API_KEY;

//   if (!apiKey) {
//     return res.status(500).json({ error: 'Missing Gemini API key' });
//   }

//   try {
//     const geminiRes = await fetch(
//       `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
//       {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           contents: [
//             {
//               parts: [
//                 { text: prompt },
//                 {
//                   inlineData: {
//                     mimeType: 'image/jpeg',
//                     data: base64Image 
//                   }
//                 }
                
//               ]
//             }
//           ],
//           generationConfig: {
//             temperature: 0.8,
//             candidateCount: 1,
//             seed: seed,
//             responseModalities: ["TEXT", "IMAGE"]
//           }
//         })
//       }
//     );

//     const result = await geminiRes.json();
//     const imageData = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

//     res.status(200).json({
//       generatedImageUrl: `data:image/jpeg;base64,${imageData}`,
//       result: result,
//       req_body: req.body,

//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Something went wrong' });
//   }
// }

import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

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

  const { prompt, base64Image, seed } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing Gemini API key' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const contents = [
      { text: prompt },
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Image,
        },
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp-image-generation',
      contents: contents,
      config: {
        responseModality: [Modality.IMAGE , Modality.TEXT],
        seed: seed || undefined,
      },
    });

    const imagePart = response.candidates[0].content.parts.find(
      (part) => part.inlineData
    );

    if (!imagePart) {
      return res.status(500).json({ error: 'No image data returned' });
    }

    const imageData = imagePart.inlineData.data;

    res.status(200).json({
      generatedImageUrl: `data:image/jpeg;base64,${imageData}`,
      result: response,
      req_body: req.body

    });
  } catch (error) {
    console.error('Error during Gemini API call:', error);
    res.status(500).json({ error: 'Something went wrong with Gemini API' });
  }
}
