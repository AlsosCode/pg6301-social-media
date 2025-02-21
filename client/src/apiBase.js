const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? '' // same origin in production
    : 'http://localhost:3001'; // dev server

export default API_BASE_URL;
