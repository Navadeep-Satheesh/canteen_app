import { jwtDecode } from 'jwt-decode';


// Save token to localStorage
export const saveToken = (token) => {
  localStorage.setItem('token', token);
};

// Retrieve token from localStorage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Remove token from localStorage
export const clearToken = () => {
  localStorage.removeItem('token');
};

// Decode token to get user info (like rollno)
export const decodeToken = () => {
  const token = getToken();
  if (!token) return null;
  try {
    return jwtDecode(token); // Example: { rollno: "12345", exp: ..., iat: ... }
  } catch (e) {
    console.error("Invalid token:", e);
    return null;
  }
};
