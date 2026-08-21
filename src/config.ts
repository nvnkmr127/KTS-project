export const config = {
  apiUrl:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
      ? 'https://kts.concept2designs.in/backend/public/api/v1'
      : 'http://127.0.0.1:8000/api/v1'),
};
