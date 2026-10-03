export default async function handler(req, res) {
  try {
    const symbol = String(req.query?.symbol || '').toUpperCase();
    const interval = String(req.query?.interval || '1m');

    const limitRaw = Number(req.query?.limit || 240);
    const limit = Math.min(
      1000,
      Math.max(
        40,
        Number.isFinite(limitRaw) ? Math.floor(limitRaw) : 240
      )
    );

    if (!/^[A-Z0-9]{5,20}$/.test(symbol)) {
      return res.status(400).json({ error: 'symbol inválido' });
    }

    if (!/^(1m|3m|5m|15m|30m|1h|2h|4h|6h|8h|12h|1d|3d|1w|1M)$/.test(interval)) {
      return res.status(400).json({ error: 'interval inválido' });
    }

    const bases = [
      'https://data-api.binance.vision/api/v3/klines',
      'https://data-api.binance.vision/api/v3/uiKlines',
      'https://api.binance.com/api/v3/klines',
      'https://api1.binance.com/api/v3/klines',
      'https://api2.binance.com/api/v3/klines',
      'https://api3.binance.com/api/v3/klines',
      'https://api4.binance.com/api/v3/klines'
    ];

    let last = 'sem resposta';

    for (const base of bases) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 9000);

      try {
        const url =
          `${base}?symbol=${encodeURIComponent(symbol)}` +
          `&interval=${encodeURIComponent(interval)}` +
          `&limit=${limit}`;

        const r = await fetch(url, {
          signal: controller.signal,
          headers: {
            accept: 'application/json'
          }
        });

        clearTimeout(timer);

        if (!r.ok) {
          last = `HTTP ${r.status}`;
          continue;
        }

        const data = await r.json();

        if (!Array.isArray(data) || data.length < 40) {
          last = 'resposta sem velas suficientes';
          continue;
        }

        res.setHeader('Cache-Control', 'no-store, max-age=0');

        return res.status(200).json(data);

      } catch (e) {
        clearTimeout(timer);

        last =
          e?.name === 'AbortError'
            ? 'timeout'
            : (e?.message || 'erro');
      }
    }

    return res.status(502).json({
      error: `Binance indisponível: ${last}`
    });

  } catch (e) {
    return res.status(500).json({
      error: e?.message || 'erro interno'
    });
  }
}
