// pages/api/extend/existing-vcc.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { VCCCard, ExtendAPIResponse } from '../../types/card';

interface ExistingVCCRequest extends NextApiRequest {
  body: {
    accessToken: string;
    cardAccountId: string;
  };
}

interface ExtendVCCResponse {
  cards: Array<{
    id: string;
    cardAccountId: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    creditLimit: number;
    availableCredit: number;
    recurrenceFrequency: string;
    status: string;
    createdAt: string;
  }>;
}

export default async function handler(
  req: ExistingVCCRequest,
  res: NextApiResponse<ExtendAPIResponse<{ vccCards: VCCCard[] }>>
): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { accessToken, cardAccountId } = req.body;

  if (!accessToken || !cardAccountId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Access token and card account ID are required' 
    });
  }

  try {
    const response = await fetch(
      `${process.env.EXTEND_API_BASE_URL}/cards?cardAccountId=${cardAccountId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch VCC cards: ${response.status}`);
    }

    const data: ExtendVCCResponse = await response.json();
    
    if (!data.cards || data.cards.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No VCC cards found on this account' 
      });
    }

    // Transform the data to match our VCCCard interface
    const vccCards: VCCCard[] = data.cards.map((card) => ({
      id: card.id,
      cardAccountId: card.cardAccountId,
      cardNumber: card.cardNumber,
      expiryDate: card.expiryDate,
      cvv: card.cvv,
      creditLimit: card.creditLimit,
      availableCredit: card.availableCredit,
      recurrenceFrequency: card.recurrenceFrequency as any,
      status: card.status as any,
      createdAt: card.createdAt,
    }));

    res.status(200).json({ success: true, data: { vccCards } });
  } catch (error) {
    console.error('Error fetching existing VCC:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch existing VCC cards' 
    });
  }
}
