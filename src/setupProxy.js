const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Прокси для всех API-запросов, начинающихся с /api
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:3001', // URL вашего бэкенда
      changeOrigin: true,
    })
  );

  // Прокси специально для папки с загрузками
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: 'http://localhost:3001', // URL вашего бэкенда
      changeOrigin: true,
    })
  );
};