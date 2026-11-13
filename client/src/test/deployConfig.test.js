import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Vercel deployment config', () => {
  it('has the API rewrite and single page fallback', () => {
    const config = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8'));
    const apiRewrite = config.rewrites.find((rewrite) => rewrite.source === '/api/:path*');
    const pageFallback = config.rewrites.find((rewrite) => rewrite.source === '/(.*)');

    expect(apiRewrite.destination.endsWith('/api/:path*')).toBe(true);
    expect(apiRewrite.destination).not.toContain('YOUR-API-HOST');
    expect(pageFallback.destination).toBe('/index.html');
  });
});
