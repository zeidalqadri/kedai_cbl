// Cloudflare Pages Function to proxy API requests to n8n backend
// This avoids CORS issues by making requests from the same origin

const N8N_BASE = 'https://alumist.alumga.com/webhook'

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url)
  const path = url.pathname.replace('/api', '')
  const targetUrl = `${N8N_BASE}${path}${url.search}`

  // Clone request and forward to n8n
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')

  // Forward auth headers
  const apiKey = context.request.headers.get('X-API-Key')
  const adminKey = context.request.headers.get('X-Admin-Key')
  if (apiKey) headers.set('X-API-Key', apiKey)
  if (adminKey) headers.set('X-Admin-Key', adminKey)

  // Read body as text to ensure it's fully consumed
  let body: string | undefined
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    body = await context.request.text()
  }

  const response = await fetch(targetUrl, {
    method: context.request.method,
    headers,
    body,
  })

  // Read response body and return with CORS headers
  const responseBody = await response.text()

  return new Response(responseBody, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Admin-Key',
    },
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
