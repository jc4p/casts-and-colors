import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return Response.json({ error: 'FID parameter is required' }, { status: 400 });
    }

    const neynarApiKey = process.env.NEYAR_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!neynarApiKey || !geminiApiKey) {
      return Response.json({ error: 'API keys not configured' }, { status: 500 });
    }

    // Function to fetch a single page of casts
    async function fetchCastsPage(cursor = null) {
      const baseUrl = 'https://api.neynar.com/v2/farcaster/feed/user/casts';
      const params = new URLSearchParams({
        fid: fid,
        limit: '150',
        include_replies: 'false'
      });
      
      if (cursor) {
        params.append('cursor', cursor);
      }

      const response = await fetch(`${baseUrl}?${params.toString()}`, {
        headers: {
          'accept': 'application/json',
          'x-api-key': neynarApiKey
        }
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      return response.json();
    }

    // Fetch two pages of casts
    const firstPage = await fetchCastsPage();
    let allCasts = [...firstPage.casts];
    
    if (firstPage.next && firstPage.next.cursor) {
      const secondPage = await fetchCastsPage(firstPage.next.cursor);
      allCasts = [...allCasts, ...secondPage.casts];
    }

    // Extract and concatenate all text content
    const castsText = allCasts
      .map(cast => cast.text)
      .filter(text => text) // Remove any null or empty texts
      .join('\n');

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    const prompt = `Based on the following social media posts, analyze the user's personality and determine a matching HEX color.
    For stronger or more direct personalities, use orange-red shades.
    For nicer/friendlier personalities, use blue-pink range.
    
    Respond in the following XML format only:
    <color_analysis>
      <hex>#XXXXXX</hex>
      <explanation>Your reasoning for choosing this color based on their personality traits</explanation>
    </color_analysis>
    
    Here are the posts:
    ${castsText}`;

    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(prompt);
    const response = result.response.text().trim();

    // Parse the XML response
    const hexMatch = response.match(/<hex>(#[A-Fa-f0-9]{6})<\/hex>/);
    const explanationMatch = response.match(/<explanation>(.*?)<\/explanation>/s);

    if (!hexMatch || !explanationMatch) {
      throw new Error('Failed to parse color analysis response');
    }

    const colorHex = hexMatch[1];
    const explanation = explanationMatch[1].trim();

    return Response.json({ 
      color: colorHex,
      explanation: explanation,
      totalCasts: allCasts.length
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
} 