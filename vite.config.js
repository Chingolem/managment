import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Strong, modern security headers for the Vite dev and preview servers.
// In production, a reverse proxy / CDN (Cloudflare, Vercel, Netlify, Nginx, etc.)
// should also apply these headers.
const securityHeaders = {
  // Block rendering inside an <iframe> from a different origin
  'X-Frame-Options': 'DENY',
  // Prevent MIME-type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Force HTTPS for one year
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  // Strict referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Limit dangerous browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  // Modern CSP - allows inline styles/scripts used by React/3rd party libs but blocks remote content
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' data: blob: https:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests"
  ].join('; '),
  // Cross-origin isolation hints
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none'
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: securityHeaders
  },
  preview: {
    headers: securityHeaders
  }
})
