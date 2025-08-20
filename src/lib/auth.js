import { verifyToken } from './jwt';

export function getTokenFromRequest(request) {
  // Cek dari Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Cek dari cookie
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {});
    return cookies.token;
  }
  
  return null;
}

export function getUserFromToken(token) {
  if (!token) return null;
  return verifyToken(token);
}