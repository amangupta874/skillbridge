import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Frontend Deployment Configuration', () => {
  const clientRoot = path.resolve(__dirname, '../../');

  it('provides a valid vercel.json with /api rewrite and SPA fallback', () => {
    const vercelPath = path.join(clientRoot, 'vercel.json');
    expect(fs.existsSync(vercelPath)).toBe(true);

    const content = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
    expect(content.rewrites).toBeDefined();
    expect(Array.isArray(content.rewrites)).toBe(true);

    const apiRewrite = content.rewrites.find((r) => r.source === '/api/:path*');
    expect(apiRewrite).toBeDefined();
    expect(apiRewrite.destination).toContain('/api/:path*');

    const spaFallback = content.rewrites.find((r) => r.source === '/(.*)');
    expect(spaFallback).toBeDefined();
    expect(spaFallback.destination).toBe('/index.html');
  });

  it('provides a valid Netlify _redirects with /api rewrite and SPA fallback', () => {
    const redirectsPath = path.join(clientRoot, 'public/_redirects');
    expect(fs.existsSync(redirectsPath)).toBe(true);

    const content = fs.readFileSync(redirectsPath, 'utf8');
    expect(content).toContain('/api/*');
    expect(content).toContain('/*  /index.html  200');
  });
});
