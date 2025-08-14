import { NextApiRequest, NextApiResponse } from 'next';
import { CardAccount, ExtendAPIResponse } from '../../types/card';

interface ExtendCardAccountsRequest extends NextApiRequest {
  body: {
    accessToken: string;
  };
}

interface ExtendCardAccountResponse {
  id: string;
  name: string;
  balance: number;
  status: string;
  currency: string;
}

interface ExtendCardsResponse {
  cards: Array<{
    id: string;
    cardAccountId: string;
    status: string;
  }>;
}

export default async function handler(
  req: ExtendCardAccountsRequest,
  res: NextApiResponse<ExtendAPIResponse<{ cardAccounts: CardAccount[] }>>
): Promise<void> {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ success: false, error: 'Access token is required' });
  }

  try {
    const response = await fetch(`${process.env.EXTEND_API_BASE_URL}/card-accounts`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch card accounts: ${response.status}`);
    }

    const data: { cardAccounts: ExtendCardAccountResponse[] } = await response.json();
    
    // Transform the data to include VCC count
    const cardAccounts: CardAccount[] = await Promise.all(
      data.cardAccounts.map(async (account: ExtendCardAccountResponse): Promise<CardAccount> => {
        try {
          // Get existing VCC count for this account
          const vccResponse = await fetch(
            `${process.env.EXTEND_API_BASE_URL}/cards?cardAccountId=${account.id}`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
          
          const vccData: ExtendCardsResponse = vccResponse.ok 
            ? await vccResponse.json() 
            : { cards: [] };
          
          return {
            id: account.id,
            name: account.name,
            balance: account.balance,
            vccCount: vccData.cards ? vccData.cards.length : 0,
            maxVccLimit: 500,
          };
        } catch (error) {
          console.error(`Error fetching VCC count for account ${account.id}:`, error);
          return {
            id: account.id,
            name: account.name,
            balance: account.balance,
            vccCount: 0,
            maxVccLimit: 500,
          };
        }
      })
    );

    res.status(200).json({ success: true, data: { cardAccounts } });
  } catch (error) {
    console.error('Error fetching card accounts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch card accounts' 
    });
  }
}
