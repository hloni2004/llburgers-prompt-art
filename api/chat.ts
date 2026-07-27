export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-10-21';

  if (!endpoint || !apiKey || !deployment) {
    res.status(500).json({
      error: 'Azure OpenAI environment variables are not configured.',
    });
    return;
  }

  try {
    const body = await new Promise<string>((resolve, reject) => {
      let data = '';
      req.on('data', chunk => {
        data += chunk;
      });
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    const { message } = JSON.parse(body || '{}') as { message?: string };

    if (!message || typeof message !== 'string' || !message.trim()) {
      res.status(400).json({ error: 'A message is required.' });
      return;
    }

    const url = new URL(`${endpoint.replace(/\/$/, '')}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions`);
    url.searchParams.set('api-version', apiVersion);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful support assistant for LL Burgers. Answer briefly, warmly, and clearly.',
          },
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error?.message || 'Azure OpenAI request failed.';
      res.status(response.status).json({ error: errorMessage });
      return;
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      res.status(502).json({ error: 'Azure OpenAI returned an empty reply.' });
      return;
    }

    res.status(200).json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
}
