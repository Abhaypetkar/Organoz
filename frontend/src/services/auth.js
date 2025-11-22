// Simple auth helpers for demo (stores token in localStorage)
export function setAuthToken(token){
  localStorage.setItem('organoz_token', token);
}
export function getAuthToken(){
  return localStorage.getItem('organoz_token');
}
export function clearAuthToken(){
  localStorage.removeItem('organoz_token');
}
