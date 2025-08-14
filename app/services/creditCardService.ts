import { UserCreditCard } from '../types/profile';

export async function verifyCard(card: UserCreditCard): Promise<boolean> {
  const response = await fetch('/api/verify-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(card)
  });

  if (!response.ok) {
    throw new Error('Verification failed');
  }

  const { valid } = await response.json();
  return valid;
}