// /functions/api/gemini-edit-image.js

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}
export async function onRequestOptions() {
  return new Response(null, { headers: cors() });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { prompt, imageUrl, seed = 13 } = await request.json();

    if (!prompt || !imageUrl) {
      return new Response(JSON.stringify({ error: "prompt and imageUrl required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...cors() }
      });
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing Gemini API key" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...cors() }
      });
    }

    const googleRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: imageUrl
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.8,
            candidateCount: 1,
            seed,
            responseModalities: ["TEXT", "IMAGE"]
          }
        })
      }
    );

    const data = await googleRes.json();

    return new Response(
      JSON.stringify({
        result: data,
        error: data ? undefined : "No image returned from Gemini",
        // raw: data, // uncomment to inspect the full response
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...cors() } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...cors() }
    });
  }
}
