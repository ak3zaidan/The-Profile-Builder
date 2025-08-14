// pages/api/extend/create-vcc.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { VCCCard, RecurrenceFrequency, ExtendAPIResponse } from '../../types/card';

interface CreateVCCRequest extends NextApiRequest {
  body: {
    accessToken: string;
    cardAccountId: string;
    creditLimit: number;
    recurrenceFrequency: RecurrenceFrequency;
  };
}

interface ExtendCreateVCCResponse {
  card: {
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
  };
}

export default async function handler(
  req: CreateVCCRequest,
  res: NextApiResponse<ExtendAPIResponse<{ vccCard: VCCCard }>>
): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { accessToken, cardAccountId, creditLimit, recurrenceFrequency } = req.body;

  if (!accessToken || !cardAccountId || !creditLimit || !recurrenceFrequency) {
    return res.status(400).json({ 
      success: false, 
      error: 'All fields are required' 
    });
  }

  // Validate credit limit
  if (creditLimit < 1 || creditLimit > 50000) {
    return res.status(400).json({ 
      success: false, 
      error: 'Credit limit must be between 1 and 50,000' 
    });
  }

  try {
    // First, check current VCC count
    const existingVCCResponse = await fetch(
      `${process.env.EXTEND_API_BASE_URL}/cards?cardAccountId=${cardAccountId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (existingVCCResponse.ok) {
      const existingData: { cards: any[] } = await existingVCCResponse.json();
      if (existingData.cards && existingData.cards.length >= 500) {
        return res.status(400).json({ 
          success: false,
          error: 'Card account has reached the maximum limit of 500 VCC cards' 
        });
      }
    }

    // Create new VCC
    const createResponse = await fetch(`${process.env.EXTEND_API_BASE_URL}/cards`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cardAccountId,
        creditLimit: creditLimit * 100, // Convert to cents
        recurrenceFrequency: recurrenceFrequency.toUpperCase(),
        // Add other required fields based on Extend API documentation
      }),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(errorData.message || 'Failed to create VCC');
    }

    const vccData: ExtendCreateVCCResponse = await createResponse.json();
    
    // Transform the data to match our VCCCard interface
    const vccCard: VCCCard = {
      id: vccData.card.id,
      cardAccountId: vccData.card.cardAccountId,
      cardNumber: vccData.card.cardNumber,
      expiryDate: vccData.card.expiryDate,
      cvv: vccData.card.cvv,
      creditLimit: vccData.card.creditLimit,
      availableCredit: vccData.card.availableCredit,
      recurrenceFrequency: vccData.card.recurrenceFrequency as RecurrenceFrequency,
      status: vccData.card.status as any,
      createdAt: vccData.card.createdAt,
    };
    
    res.status(200).json({ success: true, data: { vccCard } });
  } catch (error) {
    console.error('Error creating VCC:', error);
    
    // Handle specific Extend API errors
    if (error instanceof Error && error.message.includes('limit exceeded')) {
      return res.status(400).json({ 
        success: false,
        error: 'Unable to create VCC: Account limit exceeded' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create VCC card' 
    });
  }
}