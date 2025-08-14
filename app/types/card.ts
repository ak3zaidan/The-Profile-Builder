export interface CardAccount {
  id: string;
  name: string;
  balance: number;
  vccCount: number;
  maxVccLimit?: number;
}

export interface VCCCard {
  id: string;
  cardAccountId: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  creditLimit: number;
  availableCredit: number;
  recurrenceFrequency: RecurrenceFrequency;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  
}

export type RecurrenceFrequency = 'DAY' | 'WEEK' | 'MONTH';
export type VCCOption = 'existing' | 'create';

export interface CreateVCCRequest {
  accessToken: string;
  cardAccountId: string;
  creditLimit: number;
  recurrenceFrequency: RecurrenceFrequency;
}

export interface ExtendAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}