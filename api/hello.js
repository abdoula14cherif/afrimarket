// api/hello.js - Test API Vercel
export default function handler(request, response) {
  return response.status(200).json({
    success: true,
    message: '✅ API AFRIMARKET fonctionne !',
    timestamp: new Date().toISOString(),
    endpoints: {
      main: '/',
      api: '/api/hello',
      health: '/api/health'
    }
  });
}
