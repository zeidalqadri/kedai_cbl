// Cloudflare Pages Function to proxy API requests to n8n webhooks
// Catches all /api/* requests and forwards them to the n8n server

const N8N_BASE_URL = 'https://alumist.alumga.com/webhook'

export const onRequest: PagesFunction = async (context) => {
  const { request, params } = context

  // Get the path after /api/
  const path = Array.isArray(params.path) ? params.path.join('/') : params.path || ''

  // Build the target URL
  const targetUrl = `${N8N_BASE_URL}/${path}`

  // Clone the request with the new URL
  const url = new URL(targetUrl)

  // Copy query parameters
  const originalUrl = new URL(request.url)
  originalUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value)
  })

  // Create new headers, forwarding relevant ones
  const headers = new Headers()

  // Forward important headers
  const forwardHeaders = [
    'content-type',
    'x-api-key',
    'x-admin-key',
    'accept',
    'authorization',
  ]

  forwardHeaders.forEach(header => {
    const value = request.headers.get(header)
    if (value) {
      headers.set(header, value)
    }
  })

  // Make the proxied request
  const proxyRequest = new Request(url.toString(), {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD'
      ? await request.text()
      : undefined,
  })

  try {
    const response = await fetch(proxyRequest)

    // Create response with CORS headers
    const responseHeaders = new Headers(response.headers)
    responseHeaders.set('Access-Control-Allow-Origin', '*')
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, X-Admin-Key, Authorization')

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Proxy error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

// Handle CORS preflight requests
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, X-Admin-Key, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
