import React, { useState } from 'react';

// Define strict types for the component props
interface CheckoutModalProps {
  amountUSD: number;
  playerId: string;
  onBalanceUpdated: (newBalance: number) => void;
}

// Define strict type for the payment token payload
interface PaymentToken {
  id: string;
  type: 'apple_pay' | 'card';
  cardLast4?: string;
}

export default function CheckoutModal({ amountUSD, playerId, onBalanceUpdated }: CheckoutModalProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [cardNumber, setCardNumber] = useState<string>('');

  // 1. BACKEND API CALL
  const submitToBackend = async (paymentToken: PaymentToken) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5050/api/pay/direct-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          amountUSD,
          token: paymentToken
        })
      });

      const data = await res.json();
      if (data.success) {
        alert(`Success! $${amountUSD} added to balance.`);
        onBalanceUpdated(data.newBalance);
      } else {
        alert(data.message || 'Payment processing failed.');
      }
    } catch (err) {
      console.error('Payment Error:', err);
      alert('Connection error reaching payment server.');
    } finally {
      setLoading(false);
    }
  };

  // 2. MOCK APPLE PAY (Free $0 Local Testing)
  const handleApplePayMock = async () => {
    // Simulating native Apple Pay token generation
    const mockToken: PaymentToken = {
      id: `tok_apple_${Date.now()}`,
      type: 'apple_pay',
      cardLast4: '4242'
    };

    // Send to backend endpoint
    await submitToBackend(mockToken);
  };

  return (
    <div style={{ background: '#111', padding: '24px', borderRadius: '12px', color: '#fff', maxWidth: '400px', width: '100%', boxSizing: 'border-box' }}>
      <h3 style={{ marginTop: 0, color: '#ffc107' }}>Deposit ${amountUSD}</h3>

      {/* Mock Apple Pay Button */}
      <button 
        onClick={handleApplePayMock}
        disabled={loading}
        style={{ width: '100%', padding: '12px', background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '12px', fontWeight: 'bold' }}
      >
         Pay with Apple Pay (Dev Mode)
      </button>

      <div style={{ textAlign: 'center', margin: '12px 0', color: '#666', fontSize: '12px', fontWeight: 'bold' }}>OR CARD</div>

      {/* Manual Card Form */}
      <input 
        type="text" 
        placeholder="Card Number (•••• •••• •••• 4242)"
        value={cardNumber}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCardNumber(e.target.value)}
        style={{ width: '100%', padding: '10px', marginBottom: '12px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '6px', boxSizing: 'border-box' }}
      />

      <button 
        onClick={() => submitToBackend({ id: `tok_card_${Date.now()}`, type: 'card' })}
        disabled={loading}
        style={{ width: '100%', padding: '12px', background: loading ? '#555' : '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
      >
        {loading ? 'Processing...' : `Confirm $${amountUSD}`}
      </button>
    </div>
  );
}