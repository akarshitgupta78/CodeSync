import api from './api';

export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: string;
  username: string;
  email: string;
}

export const authService = {
  async login(usernameOrEmail: string, password: string):Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/login', { usernameOrEmail, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data));
    return res.data;
  },

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/auth/register', { username, email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data));
    return res.data;
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};
