import { CardAccount, VCCCard, RecurrenceFrequency } from '../types/card';

export class ExtendAPI {
  private accessToken: string;
  private baseURL: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.baseURL = process.env.EXTEND_API_BASE_URL || 'https://api.extend.com/v1';
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getCardAccounts(): Promise<{ cardAccounts: CardAccount[] }> {
    return this.makeRequest<{ cardAccounts: CardAccount[] }>('/card-accounts');
  }

  async getVCCCards(cardAccountId: string): Promise<{ cards: VCCCard[] }> {
    return this.makeRequest<{ cards: VCCCard[] }>(`/cards?cardAccountId=${cardAccountId}`);
  }

  async createVCC(
    cardAccountId: string, 
    creditLimit: number, 
    recurrenceFrequency: RecurrenceFrequency
  ): Promise<{ card: VCCCard }> {
    return this.makeRequest<{ card: VCCCard }>('/cards', {
      method: 'POST',
      body: JSON.stringify({
        cardAccountId,
        creditLimit: creditLimit * 100, // Convert to cents
        recurrenceFrequency: recurrenceFrequency.toUpperCase(),
      }),
    });
  }

  async checkVCCLimit(cardAccountId: string): Promise<{
    current: number;
    limit: number;
    canCreate: boolean;
  }> {
    const vccData = await this.getVCCCards(cardAccountId);
    const currentCount = vccData.cards ? vccData.cards.length : 0;
    
    return {
      current: currentCount,
      limit: 500,
      canCreate: currentCount < 500,
    };
  }

  async validateCardAccount(cardAccountId: string): Promise<boolean> {
    try {
      const cardAccounts = await this.getCardAccounts();
      return cardAccounts.cardAccounts.some(account => account.id === cardAccountId);
    } catch (error) {
      console.error('Error validating card account:', error);
      return false;
    }
  }
}

// Custom hook for Extend API
import { useState, useCallback } from 'react';

export const useExtendAPI = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const executeRequest = useCallback(async <T>(
    request: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await request();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, executeRequest };
};
