import { Injectable, Inject, InjectionToken } from '@angular/core';

export const API_URL = new InjectionToken<string>('API_URL');

@Injectable({
  providedIn: 'root'
})
export class ApiConfigService {
  private apiBaseUrl: string;

  constructor(@Inject(API_URL) private apiUrl: string) {
    this.apiBaseUrl = this.apiUrl;
  }

  getApiUrl(endpoint: string): string {
    return `${this.apiBaseUrl}/api/${endpoint}`;
  }

  getBaseUrl(): string {
    return this.apiBaseUrl;
  }

  getWebSocketUrl(): string {
    const hostname = window.location.hostname;
    const port = 8087;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${wsProtocol}://localhost:${port}/ws-notifications`;
    } else {
      return `${wsProtocol}://${hostname}:${port}/ws-notifications`;
    }
  }
}
