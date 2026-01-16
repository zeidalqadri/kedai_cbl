// Cloudflare Pages Function to proxy API requests to n8n backend
// This avoids CORS issues by making requests from the same origin

const N8N_BASE = 'https://alumist.alumga.com/webhook'

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url)
  const path = url.pathname.replace('/api', '')
  const targetUrl = `${N8N_BASE}${path}${url.search}`

  // Clone request and forward to n8n
  const headers = new Headers(context.request.headers)
  headers.delete('host')

  const response = await fetch(targetUrl, {
    method: context.request.method,
    headers,
    body: context.request.method !== 'GET' ? context.request.body : undefined,
  })

  // Clone response and add CORS headers
  const responseHeaders = new Headers(response.headers)
  responseHeaders.set('Access-Control-Allow-Origin', '*')
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Admin-Key')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

// Handle CORS preflight
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Admin-Key',
      'Access-Control-Max-Age': '86400',
    },
  })
}
