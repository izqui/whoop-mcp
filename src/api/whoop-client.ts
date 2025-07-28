import { TokenValidator } from '../auth/index';
import type { Sleep, Cycle, Recovery, PaginatedResponse, WhoopError } from './types';

const WHOOP_API_BASE = 'https://api.prod.whoop.com/developer';

export class WhoopAPIClient {
  private static instance: WhoopAPIClient;

  private constructor() {}

  static getInstance(): WhoopAPIClient {
    if (!this.instance) {
      this.instance = new WhoopAPIClient();
    }
    return this.instance;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await TokenValidator.requireAuth();
    
    const url = `${WHOOP_API_BASE}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    return response.json();
  }

  private async handleError(response: Response): Promise<never> {
    let errorMessage = `WHOOP API Error: ${response.status} ${response.statusText}`;
    
    try {
      const error: WhoopError = await response.json();
      if (error.message) {
        errorMessage = `WHOOP API Error: ${error.message}`;
      } else if (error.error) {
        errorMessage = `WHOOP API Error: ${error.error}`;
      }
    } catch {
      // If response isn't JSON, use default message
    }

    switch (response.status) {
      case 401:
        throw new Error(`Authentication failed: ${errorMessage}. Please run "pnpm auth" to re-authenticate.`);
      case 404:
        throw new Error(`Resource not found: ${errorMessage}`);
      case 429:
        throw new Error(`Rate limit exceeded: ${errorMessage}. Please try again later.`);
      default:
        throw new Error(errorMessage);
    }
  }

  // Sleep endpoints
  async getSleepById(sleepId: string): Promise<Sleep> {
    return this.request<Sleep>(`/v2/activity/sleep/${sleepId}`);
  }

  async getSleepCollection(params?: {
    limit?: number;
    start?: string;
    end?: string;
    nextToken?: string;
  }): Promise<PaginatedResponse<Sleep>> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.start) queryParams.append('start', params.start);
    if (params?.end) queryParams.append('end', params.end);
    if (params?.nextToken) queryParams.append('nextToken', params.nextToken);
    
    const queryString = queryParams.toString();
    const endpoint = `/v2/activity/sleep${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PaginatedResponse<Sleep>>(endpoint);
  }

  // Cycle endpoints
  async getCycleById(cycleId: number): Promise<Cycle> {
    return this.request<Cycle>(`/v2/cycle/${cycleId}`);
  }

  async getCycleCollection(params?: {
    limit?: number;
    start?: string;
    end?: string;
    nextToken?: string;
  }): Promise<PaginatedResponse<Cycle>> {
    const queryParams = new URLSearchParams();
    
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.start) queryParams.append('start', params.start);
    if (params?.end) queryParams.append('end', params.end);
    if (params?.nextToken) queryParams.append('nextToken', params.nextToken);
    
    const queryString = queryParams.toString();
    const endpoint = `/v2/cycle${queryString ? `?${queryString}` : ''}`;
    
    return this.request<PaginatedResponse<Cycle>>(endpoint);
  }

  // Recovery endpoints
  async getRecoveryForCycle(cycleId: number): Promise<Recovery> {
    return this.request<Recovery>(`/v2/cycle/${cycleId}/recovery`);
  }

  // Sleep endpoints related to cycles
  async getSleepForCycle(cycleId: number): Promise<Sleep> {
    return this.request<Sleep>(`/v2/cycle/${cycleId}/sleep`);
  }
}