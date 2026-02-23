# Examples & Use Cases

## 🚀 Real-World Examples

This document provides practical examples of how to integrate and use the Invisible Wallets system in various scenarios.

## 📱 Basic Integration Examples

### 1. Simple Wallet Creation

```typescript
'use client';

import React, { useState } from 'react';
import { useInvisibleWallet } from '@/hooks/use-invisible-wallet';

export function SimpleWalletCreator() {
  const { createWallet, isLoading, error } = useInvisibleWallet({
    platformId: 'simple-app-v1',
    defaultNetwork: 'testnet',
    debug: true,
  });

  const [email, setEmail] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [wallet, setWallet] = useState(null);

  const handleCreateWallet = async (e) => {
    e.preventDefault();
    try {
      const newWallet = await createWallet(email, passphrase, {
        metadata: { 
          appVersion: '1.0.0',
          userAgent: navigator.userAgent,
          createdFrom: 'simple-creator'
        }
      });
      setWallet(newWallet);
      console.log('Wallet created:', newWallet);
    } catch (err) {
      console.error('Failed to create wallet:', err);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Create Your Wallet</h2>
      
      {!wallet ? (
        <form onSubmit={handleCreateWallet} className="space-y-4">
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 border rounded-lg"
          />
          <input
            type="password"
            placeholder="Secure passphrase"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            required
            className="w-full p-3 border rounded-lg"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white p-3 rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Wallet'}
          </button>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
        </form>
      ) : (
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-green-800 font-semibold">✅ Wallet Created!</h3>
          <p className="text-sm text-green-600 mt-2">
            Your wallet is ready to use. Public key: {wallet.publicKey.slice(0, 8)}...
          </p>
        </div>
      )}
    </div>
  );
}
```

### 2. Wallet Recovery Component

```typescript
'use client';

import React, { useState } from 'react';
import { useInvisibleWallet } from '@/hooks/use-invisible-wallet';

export function WalletRecovery() {
  const { recoverWallet, getWallet, isLoading, error, clearError } = useInvisibleWallet({
    platformId: 'recovery-app-v1',
    defaultNetwork: 'testnet',
  });

  const [credentials, setCredentials] = useState({
    email: '',
    passphrase: '',
  });
  const [recoveredWallet, setRecoveredWallet] = useState(null);

  const handleRecover = async (e) => {
    e.preventDefault();
    clearError();
    
    try {
      // First, try to recover the wallet
      const wallet = await recoverWallet(
        credentials.email,
        credentials.passphrase,
        { network: 'testnet' }
      );
      
      // Then get the wallet with balance information
      const walletWithBalance = await getWallet(credentials.email, {
        network: 'testnet'
      });
      
      setRecoveredWallet(walletWithBalance);
    } catch (err) {
      console.error('Recovery failed:', err);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Recover Your Wallet</h2>
      
      {!recoveredWallet ? (
        <form onSubmit={handleRecover} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials(prev => ({
                ...prev,
                email: e.target.value
              }))}
              required
              className="w-full p-3 border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Passphrase</label>
            <input
              type="password"
              value={credentials.passphrase}
              onChange={(e) => setCredentials(prev => ({
                ...prev,
                passphrase: e.target.value
              }))}
              required
              className="w-full p-3 border rounded-lg"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 text-white p-3 rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Recovering...' : 'Recover Wallet'}
          </button>
          
          {error && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </form>
      ) : (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <h3 className="text-blue-800 font-semibold mb-3">🔓 Wallet Recovered!</h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Email:</strong> {recoveredWallet.email}
            </div>
            <div>
              <strong>Public Key:</strong> 
              <code className="block bg-white p-2 rounded mt-1 font-mono text-xs">
                {recoveredWallet.publicKey}
              </code>
            </div>
            <div>
              <strong>XLM Balance:</strong> {recoveredWallet.balance?.native || '0'} XLM
            </div>
            <div>
              <strong>Network:</strong> {recoveredWallet.network}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3. Transaction Signing Example

```typescript
'use client';

import React, { useState } from 'react';
import { useInvisibleWallet } from '@/hooks/use-invisible-wallet';
import { TransactionBuilder, Account, Operation, Asset, Networks } from '@stellar/stellar-sdk';

export function PaymentSender() {
  const { wallet, signTransaction, getWallet, isLoading } = useInvisibleWallet({
    platformId: 'payment-app-v1',
    defaultNetwork: 'testnet',
  });

  const [paymentData, setPaymentData] = useState({
    email: '',
    passphrase: '',
    destination: '',
    amount: '',
  });
  const [result, setResult] = useState(null);

  const handleSendPayment = async (e) => {
    e.preventDefault();
    
    try {
      // First, get the wallet with current balance
      const currentWallet = await getWallet(paymentData.email, {
        network: 'testnet'
      });
      
      if (!currentWallet) {
        throw new Error('Wallet not found');
      }

      // Create a payment transaction
      const account = new Account(currentWallet.publicKey, '0'); // Sequence will be fetched automatically
      
      const transaction = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: Networks.TESTNET,
      })
      .addOperation(Operation.payment({
        destination: paymentData.destination,
        asset: Asset.native(),
        amount: paymentData.amount,
      }))
      .setTimeout(300)
      .build();

      const transactionXDR = transaction.toXDR();

      // Sign the transaction
      const signResult = await signTransaction(
        currentWallet.id,
        paymentData.email,
        paymentData.passphrase,
        transactionXDR
      );

      setResult(signResult);
    } catch (err) {
      console.error('Payment failed:', err);
      setResult({ success: false, error: err.message });
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Send Payment</h2>
      
      {!result ? (
        <form onSubmit={handleSendPayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Your Email</label>
            <input
              type="email"
              value={paymentData.email}
              onChange={(e) => setPaymentData(prev => ({
                ...prev,
                email: e.target.value
              }))}
              required
              className="w-full p-3 border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Your Passphrase</label>
            <input
              type="password"
              value={paymentData.passphrase}
              onChange={(e) => setPaymentData(prev => ({
                ...prev,
                passphrase: e.target.value
              }))}
              required
              className="w-full p-3 border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Destination Address</label>
            <input
              type="text"
              placeholder="GDESTINATION..."
              value={paymentData.destination}
              onChange={(e) => setPaymentData(prev => ({
                ...prev,
                destination: e.target.value
              }))}
              required
              className="w-full p-3 border rounded-lg font-mono text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Amount (XLM)</label>
            <input
              type="number"
              step="0.0000001"
              min="0.0000001"
              value={paymentData.amount}
              onChange={(e) => setPaymentData(prev => ({
                ...prev,
                amount: e.target.value
              }))}
              required
              className="w-full p-3 border rounded-lg"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-500 text-white p-3 rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Payment'}
          </button>
        </form>
      ) : (
        <div className={`border p-4 rounded-lg ${
          result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <h3 className={`font-semibold mb-3 ${
            result.success ? 'text-green-800' : 'text-red-800'
          }`}>
            {result.success ? '✅ Payment Sent!' : '❌ Payment Failed'}
          </h3>
          
          {result.success ? (
            <div className="space-y-2 text-sm text-green-700">
              <div>
                <strong>Transaction Hash:</strong>
                <code className="block bg-white p-2 rounded mt-1 font-mono text-xs">
                  {result.transactionHash}
                </code>
              </div>
              <div>
                <strong>Status:</strong> {result.submittedToNetwork ? 'Submitted to Network' : 'Signed Only'}
              </div>
            </div>
          ) : (
            <div className="text-red-700 text-sm">
              <strong>Error:</strong> {result.error}
            </div>
          )}
          
          <button
            onClick={() => setResult(null)}
            className="mt-3 text-sm underline"
          >
            Send Another Payment
          </button>
        </div>
      )}
    </div>
  );
}
```

## 🏪 E-commerce Integration

### 1. Checkout with Invisible Wallets

```typescript
'use client';

import React, { useState } from 'react';
import { useInvisibleWallet } from '@/hooks/use-invisible-wallet';

export function CheckoutWithWallet() {
  const { createWallet, getWallet, signTransaction, isLoading } = useInvisibleWallet({
    platformId: 'ecommerce-store-v1',
    defaultNetwork: 'testnet',
  });

  const [checkoutStep, setCheckoutStep] = useState('login'); // login, create, pay, complete
  const [orderData] = useState({
    items: [
      { name: 'Premium Widget', price: 10, quantity: 1 },
      { name: 'Shipping', price: 2.5, quantity: 1 }
    ],
    total: 12.5,
    merchantAddress: 'GMERCHANT7EXAMPLE8ADDRESS9HERE0123456789ABCDEFGHIJ',
  });
  
  const [userCredentials, setUserCredentials] = useState({
    email: '',
    passphrase: '',
  });
  
  const [paymentResult, setPaymentResult] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    try {
      // Try to get existing wallet
      const existingWallet = await getWallet(userCredentials.email, {
        network: 'testnet'
      });
      
      if (existingWallet) {
        setCheckoutStep('pay');
      } else {
        setCheckoutStep('create');
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleCreateWallet = async () => {
    try {
      await createWallet(userCredentials.email, userCredentials.passphrase, {
        metadata: { 
          source: 'ecommerce-checkout',
          orderId: `order-${Date.now()}`
        }
      });
      setCheckoutStep('pay');
    } catch (err) {
      console.error('Wallet creation failed:', err);
    }
  };

  const handlePayment = async () => {
    try {
      const wallet = await getWallet(userCredentials.email, {
        network: 'testnet'
      });
      
      if (!wallet) throw new Error('Wallet not found');

      // Create payment transaction (simplified)
      const transactionXDR = await createPaymentTransaction(
        wallet.publicKey,
        orderData.merchantAddress,
        orderData.total.toString()
      );

      const result = await signTransaction(
        wallet.id,
        userCredentials.email,
        userCredentials.passphrase,
        transactionXDR
      );

      setPaymentResult(result);
      if (result.success) {
        setCheckoutStep('complete');
      }
    } catch (err) {
      console.error('Payment failed:', err);
      setPaymentResult({ success: false, error: err.message });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Checkout</h2>
        
        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-3">Order Summary</h3>
          {orderData.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm mb-1">
              <span>{item.name} x {item.quantity}</span>
              <span>{item.price} XLM</span>
            </div>
          ))}
          <div className="border-t pt-2 mt-2 font-semibold">
            <div className="flex justify-between">
              <span>Total</span>
              <span>{orderData.total} XLM</span>
            </div>
          </div>
        </div>

        {/* Login Step */}
        {checkoutStep === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <h3 className="text-lg font-semibold">Login or Create Wallet</h3>
            <input
              type="email"
              placeholder="Your email"
              value={userCredentials.email}
              onChange={(e) => setUserCredentials(prev => ({
                ...prev,
                email: e.target.value
              }))}
              required
              className="w-full p-3 border rounded-lg"
            />
            <input
              type="password"
              placeholder="Your passphrase"
              value={userCredentials.passphrase}
              onChange={(e) => setUserCredentials(prev => ({
                ...prev,
                passphrase: e.target.value
              }))}
              required
              className="w-full p-3 border rounded-lg"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white p-3 rounded-lg disabled:opacity-50"
            >
              {isLoading ? 'Checking...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Create Wallet Step */}
        {checkoutStep === 'create' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Create Your Wallet</h3>
            <p className="text-gray-600">
              We'll create a secure wallet for you to complete this purchase.
            </p>
            <button
              onClick={handleCreateWallet}
              disabled={isLoading}
              className="w-full bg-green-500 text-white p-3 rounded-lg disabled:opacity-50"
            >
              {isLoading ? 'Creating Wallet...' : 'Create Wallet & Continue'}
            </button>
          </div>
        )}

        {/* Payment Step */}
        {checkoutStep === 'pay' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Complete Payment</h3>
            <p className="text-gray-600">
              Click below to sign and submit your payment of {orderData.total} XLM.
            </p>
            <button
              onClick={handlePayment}
              disabled={isLoading}
              className="w-full bg-purple-500 text-white p-3 rounded-lg disabled:opacity-50"
            >
              {isLoading ? 'Processing Payment...' : `Pay ${orderData.total} XLM`}
            </button>
            
            {paymentResult && !paymentResult.success && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <p className="text-red-800 text-sm">
                  Payment failed: {paymentResult.error}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Complete Step */}
        {checkoutStep === 'complete' && (
          <div className="text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h3 className="text-xl font-semibold text-green-800">Payment Successful!</h3>
            <p className="text-gray-600">
              Your order has been confirmed and will be processed shortly.
            </p>
            {paymentResult?.transactionHash && (
              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>Transaction ID:</strong>
                </p>
                <code className="text-xs font-mono bg-white p-2 rounded block mt-1">
                  {paymentResult.transactionHash}
                </code>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to create payment transaction
async function createPaymentTransaction(
  sourcePublicKey: string,
  destinationAddress: string,
  amount: string
): Promise<string> {
  // This is a simplified example - in reality, you'd need to:
  // 1. Fetch the account sequence number
  // 2. Build the transaction properly
  // 3. Handle errors appropriately
  
  const { TransactionBuilder, Account, Operation, Asset, Networks } = await import('@stellar/stellar-sdk');
  
  const account = new Account(sourcePublicKey, '0'); // Sequence would be fetched
  
  const transaction = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
  .addOperation(Operation.payment({
    destination: destinationAddress,
    asset: Asset.native(),
    amount: amount,
  }))
  .setTimeout(300)
  .build();

  return transaction.toXDR();
}
```

## 🎮 Gaming Integration

### 1. In-Game Wallet System

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useInvisibleWallet } from '@/hooks/use-invisible-wallet';

export function GameWallet() {
  const { 
    createWallet, 
    getWallet, 
    signTransaction, 
    wallet, 
    isLoading 
  } = useInvisibleWallet({
    platformId: 'space-game-v1',
    defaultNetwork: 'testnet',
    debug: true,
  });

  const [gameState, setGameState] = useState({
    playerName: '',
    email: '',
    passphrase: '',
    isLoggedIn: false,
    credits: 0,
    items: [],
  });

  const [marketPlace] = useState([
    { id: 1, name: 'Laser Cannon', price: 5, description: 'Powerful weapon upgrade' },
    { id: 2, name: 'Shield Generator', price: 3, description: 'Defensive upgrade' },
    { id: 3, name: 'Fuel Cells', price: 1, description: 'Extend your range' },
  ]);

  // Initialize player wallet
  const initializePlayer = async (playerName: string, email: string, passphrase: string) => {
    try {
      // Try to get existing wallet first
      let playerWallet = await getWallet(email, { network: 'testnet' });
      
      if (!playerWallet) {
        // Create new wallet for new player
        await createWallet(email, passphrase, {
          metadata: { 
            playerName,
            gameVersion: '1.0',
            characterClass: 'explorer'
          }
        });
        playerWallet = await getWallet(email, { network: 'testnet' });
      }

      setGameState(prev => ({
        ...prev,
        playerName,
        email,
        passphrase,
        isLoggedIn: true,
        credits: parseFloat(playerWallet?.balance?.native || '0'),
      }));
    } catch (err) {
      console.error('Failed to initialize player:', err);
    }
  };

  // Purchase item from marketplace
  const purchaseItem = async (item: any) => {
    if (gameState.credits < item.price) {
      alert('Insufficient credits!');
      return;
    }

    try {
      // In a real game, this would be a transaction to a game server
      // For demo, we'll just simulate the purchase
      console.log(`Purchasing ${item.name} for ${item.price} credits`);
      
      setGameState(prev => ({
        ...prev,
        credits: prev.credits - item.price,
        items: [...prev.items, item],
      }));
      
      alert(`Successfully purchased ${item.name}!`);
    } catch (err) {
      console.error('Purchase failed:', err);
    }
  };

  // Earn credits (simulate gameplay reward)
  const earnCredits = async (amount: number) => {
    setGameState(prev => ({
      ...prev,
      credits: prev.credits + amount,
    }));
  };

  if (!gameState.isLoggedIn) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600">🚀 Space Explorer</h1>
          <p className="text-gray-600">Create your pilot account</p>
        </div>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          initializePlayer(gameState.playerName, gameState.email, gameState.passphrase);
        }} className="space-y-4">
          <input
            type="text"
            placeholder="Pilot Name"
            value={gameState.playerName}
            onChange={(e) => setGameState(prev => ({
              ...prev,
              playerName: e.target.value
            }))}
            required
            className="w-full p-3 border rounded-lg"
          />
          <input
            type="email"
            placeholder="Email"
            value={gameState.email}
            onChange={(e) => setGameState(prev => ({
              ...prev,
              email: e.target.value
            }))}
            required
            className="w-full p-3 border rounded-lg"
          />
          <input
            type="password"
            placeholder="Secure Passphrase"
            value={gameState.passphrase}
            onChange={(e) => setGameState(prev => ({
              ...prev,
              passphrase: e.target.value
            }))}
            required
            className="w-full p-3 border rounded-lg"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white p-3 rounded-lg disabled:opacity-50"
          >
            {isLoading ? 'Initializing...' : 'Start Game'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 text-white p-6 rounded-lg mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {gameState.playerName}! 🚀</h1>
            <p className="text-blue-200">Pilot License: {wallet?.publicKey.slice(0, 8)}...</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{gameState.credits.toFixed(1)} ⭐</div>
            <div className="text-blue-200">Credits</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gameplay Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Mission Control</h2>
          <div className="space-y-3">
            <button
              onClick={() => earnCredits(2)}
              className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600"
            >
              🌟 Complete Mission (+2 Credits)
            </button>
            <button
              onClick={() => earnCredits(5)}
              className="w-full bg-yellow-500 text-white p-3 rounded-lg hover:bg-yellow-600"
            >
              💎 Find Rare Mineral (+5 Credits)
            </button>
            <button
              onClick={() => earnCredits(10)}
              className="w-full bg-purple-500 text-white p-3 rounded-lg hover:bg-purple-600"
            >
              👽 Defeat Boss (+10 Credits)
            </button>
          </div>
        </div>

        {/* Marketplace */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Marketplace</h2>
          <div className="space-y-3">
            {marketPlace.map((item) => (
              <div key={item.id} className="border p-3 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{item.price} ⭐</div>
                    <button
                      onClick={() => purchaseItem(item)}
                      disabled={gameState.credits < item.price}
                      className="mt-1 bg-blue-500 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                    >
                      Buy
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inventory */}
      {gameState.items.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-bold mb-4">Your Inventory</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {gameState.items.map((item, index) => (
              <div key={index} className="bg-gray-100 p-3 rounded-lg text-center">
                <div className="font-semibold">{item.name}</div>
                <div className="text-sm text-gray-600">Owned</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

## 📊 Analytics Dashboard

### 1. Wallet Analytics Component

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useInvisibleWallet } from '@/hooks/use-invisible-wallet';

export function WalletAnalytics() {
  const { sdk } = useInvisibleWallet({
    platformId: 'analytics-dashboard-v1',
    defaultNetwork: 'testnet',
  });

  const [analytics, setAnalytics] = useState({
    totalWallets: 0,
    totalTransactions: 0,
    totalVolume: 0,
    recentActivity: [],
    networkStats: {
      testnet: 0,
      mainnet: 0,
    },
  });

  useEffect(() => {
    if (!sdk) return;

    // Set up event listeners for real-time analytics
    const handleWalletCreated = (data: any) => {
      setAnalytics(prev => ({
        ...prev,
        totalWallets: prev.totalWallets + 1,
        networkStats: {
          ...prev.networkStats,
          [data.network]: prev.networkStats[data.network] + 1,
        },
        recentActivity: [
          {
            type: 'wallet_created',
            timestamp: new Date().toISOString(),
            details: `New wallet created: ${data.publicKey.slice(0, 8)}...`,
          },
          ...prev.recentActivity.slice(0, 9), // Keep last 10 activities
        ],
      }));
    };

    const handleTransactionSigned = (data: any) => {
      setAnalytics(prev => ({
        ...prev,
        totalTransactions: prev.totalTransactions + 1,
        recentActivity: [
          {
            type: 'transaction_signed',
            timestamp: new Date().toISOString(),
            details: `Transaction signed: ${data.transactionHash.slice(0, 8)}...`,
          },
          ...prev.recentActivity.slice(0, 9),
        ],
      }));
    };

    sdk.on('walletCreated', handleWalletCreated);
    sdk.on('transactionSigned', handleTransactionSigned);

    return () => {
      sdk.off('walletCreated', handleWalletCreated);
      sdk.off('transactionSigned', handleTransactionSigned);
    };
  }, [sdk]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Invisible Wallets Analytics</h1>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="text-3xl font-bold text-blue-600">{analytics.totalWallets}</div>
          <div className="text-blue-800 font-medium">Total Wallets</div>
        </div>
        
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="text-3xl font-bold text-green-600">{analytics.totalTransactions}</div>
          <div className="text-green-800 font-medium">Transactions</div>
        </div>
        
        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="text-3xl font-bold text-purple-600">{analytics.totalVolume.toFixed(2)}</div>
          <div className="text-purple-800 font-medium">Volume (XLM)</div>
        </div>
        
        <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
          <div className="text-3xl font-bold text-orange-600">
            {analytics.networkStats.testnet + analytics.networkStats.mainnet}
          </div>
          <div className="text-orange-800 font-medium">Active Networks</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Network Distribution</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Testnet</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${(analytics.networkStats.testnet / Math.max(analytics.totalWallets, 1)) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm font-medium">{analytics.networkStats.testnet}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Mainnet</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${(analytics.networkStats.mainnet / Math.max(analytics.totalWallets, 1)) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm font-medium">{analytics.networkStats.mainnet}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {analytics.recentActivity.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent activity</p>
            ) : (
              analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'wallet_created' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <div className="text-sm">{activity.details}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Live Demo Section */}
      <div className="bg-gray-50 p-6 rounded-lg mt-8">
        <h2 className="text-xl font-bold mb-4">Test Analytics (Demo)</h2>
        <p className="text-gray-600 mb-4">
          Create wallets or sign transactions to see real-time analytics updates.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => {
              // Simulate wallet creation for demo
              const mockData = {
                publicKey: `GDEMO${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                network: Math.random() > 0.5 ? 'testnet' : 'mainnet',
              };
              setAnalytics(prev => ({
                ...prev,
                totalWallets: prev.totalWallets + 1,
                networkStats: {
                  ...prev.networkStats,
                  [mockData.network]: prev.networkStats[mockData.network] + 1,
                },
                recentActivity: [
                  {
                    type: 'wallet_created',
                    timestamp: new Date().toISOString(),
                    details: `Demo wallet created: ${mockData.publicKey.slice(0, 8)}...`,
                  },
                  ...prev.recentActivity.slice(0, 9),
                ],
              }));
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Simulate Wallet Creation
          </button>
          
          <button
            onClick={() => {
              const mockHash = `TX${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
              setAnalytics(prev => ({
                ...prev,
                totalTransactions: prev.totalTransactions + 1,
                totalVolume: prev.totalVolume + Math.random() * 100,
                recentActivity: [
                  {
                    type: 'transaction_signed',
                    timestamp: new Date().toISOString(),
                    details: `Demo transaction: ${mockHash}...`,
                  },
                  ...prev.recentActivity.slice(0, 9),
                ],
              }));
            }}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
          >
            Simulate Transaction
          </button>
        </div>
      </div>
    </div>
  );
}
```

## 🔧 Advanced Usage Patterns

### 1. Custom Storage Implementation

```typescript
import { WalletStorage, InvisibleWallet, AuditLogEntry } from '@/types/invisible-wallet';

// Custom storage implementation using localStorage (for demo only)
class LocalStorageWalletStorage implements WalletStorage {
  private readonly WALLETS_KEY = 'invisible-wallets';
  private readonly AUDIT_LOGS_KEY = 'invisible-wallet-audit-logs';

  async saveWallet(wallet: InvisibleWallet): Promise<void> {
    const wallets = this.getWallets();
    wallets[this.getWalletKey(wallet.email, wallet.platformId, wallet.network)] = wallet;
    localStorage.setItem(this.WALLETS_KEY, JSON.stringify(wallets));
  }

  async getWallet(email: string, platformId: string, network: NetworkType): Promise<InvisibleWallet | null> {
    const wallets = this.getWallets();
    const key = this.getWalletKey(email, platformId, network);
    return wallets[key] || null;
  }

  async getWalletById(id: string): Promise<InvisibleWallet | null> {
    const wallets = this.getWallets();
    for (const wallet of Object.values(wallets)) {
      if (wallet.id === id) {
        return wallet as InvisibleWallet;
      }
    }
    return null;
  }

  async deleteWallet(id: string): Promise<void> {
    const wallets = this.getWallets();
    for (const [key, wallet] of Object.entries(wallets)) {
      if ((wallet as InvisibleWallet).id === id) {
        delete wallets[key];
        break;
      }
    }
    localStorage.setItem(this.WALLETS_KEY, JSON.stringify(wallets));
  }

  async saveAuditLog(entry: AuditLogEntry): Promise<void> {
    const logs = this.getAuditLogs();
    logs.push(entry);
    // Keep only last 1000 entries
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }
    localStorage.setItem(this.AUDIT_LOGS_KEY, JSON.stringify(logs));
  }

  private getWallets(): Record<string, InvisibleWallet> {
    const stored = localStorage.getItem(this.WALLETS_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  private getAuditLogs(): AuditLogEntry[] {
    const stored = localStorage.getItem(this.AUDIT_LOGS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private getWalletKey(email: string, platformId: string, network: NetworkType): string {
    return `${email}:${platformId}:${network}`;
  }
}

// Usage with custom storage
const customConfig = {
  platformId: 'my-app-custom-storage',
  defaultNetwork: 'testnet' as NetworkType,
  storage: new LocalStorageWalletStorage(),
};

export function CustomStorageExample() {
  const { createWallet, wallet } = useInvisibleWallet(customConfig);
  
  // Rest of component implementation...
}
```

### 2. Multi-Platform Wallet Management

```typescript
'use client';

import React, { useState } from 'react';
import { useInvisibleWallet } from '@/hooks/use-invisible-wallet';

export function MultiPlatformWalletManager() {
  const [selectedPlatform, setSelectedPlatform] = useState('platform-a');
  
  const platforms = {
    'platform-a': { name: 'E-commerce Store', id: 'ecommerce-v1' },
    'platform-b': { name: 'Gaming Platform', id: 'gaming-v1' },
    'platform-c': { name: 'DeFi App', id: 'defi-v1' },
  };

  const { createWallet, getWallet, wallet, isLoading } = useInvisibleWallet({
    platformId: platforms[selectedPlatform].id,
    defaultNetwork: 'testnet',
  });

  const [credentials, setCredentials] = useState({
    email: '',
    passphrase: '',
  });

  const handlePlatformChange = (platformId: string) => {
    setSelectedPlatform(platformId);
    // Wallet will automatically update due to platformId change
  };

  const handleGetWallet = async () => {
    if (!credentials.email) return;
    
    try {
      await getWallet(credentials.email, { network: 'testnet' });
    } catch (err) {
      console.error('Failed to get wallet:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Multi-Platform Wallet Manager</h1>
      
      {/* Platform Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Platform</label>
        <select
          value={selectedPlatform}
          onChange={(e) => handlePlatformChange(e.target.value)}
          className="w-full p-3 border rounded-lg"
        >
          {Object.entries(platforms).map(([key, platform]) => (
            <option key={key} value={key}>
              {platform.name} ({platform.id})
            </option>
          ))}
        </select>
      </div>

      {/* Credentials */}
      <div className="space-y-4 mb-6">
        <input
          type="email"
          placeholder="Email"
          value={credentials.email}
          onChange={(e) => setCredentials(prev => ({
            ...prev,
            email: e.target.value
          }))}
          className="w-full p-3 border rounded-lg"
        />
        <input
          type="password"
          placeholder="Passphrase"
          value={credentials.passphrase}
          onChange={(e) => setCredentials(prev => ({
            ...prev,
            passphrase: e.target.value
          }))}
          className="w-full p-3 border rounded-lg"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={async () => {
            await createWallet(credentials.email, credentials.passphrase, {
              metadata: { platform: platforms[selectedPlatform].name }
            });
          }}
          disabled={isLoading || !credentials.email || !credentials.passphrase}
          className="flex-1 bg-blue-500 text-white p-3 rounded-lg disabled:opacity-50"
        >
          Create Wallet
        </button>
        
        <button
          onClick={handleGetWallet}
          disabled={isLoading || !credentials.email}
          className="flex-1 bg-green-500 text-white p-3 rounded-lg disabled:opacity-50"
        >
          Get Wallet
        </button>
      </div>

      {/* Current Wallet Info */}
      {wallet && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">
            Current Wallet - {platforms[selectedPlatform].name}
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Email:</strong> {wallet.email}
            </div>
            <div>
              <strong>Platform ID:</strong> {wallet.platformId}
            </div>
            <div>
              <strong>Public Key:</strong>
              <code className="block bg-white p-2 rounded mt-1 font-mono text-xs">
                {wallet.publicKey}
              </code>
            </div>
            <div>
              <strong>Balance:</strong> {wallet.balance?.native || '0'} XLM
            </div>
            <div>
              <strong>Network:</strong> {wallet.network}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

These examples demonstrate the flexibility and power of the Invisible Wallets system across different use cases, from simple integrations to complex multi-platform applications. Each example includes proper error handling, user feedback, and follows React best practices.

## USDC Examples

### Add USDC Trustline (component example)

```tsx
// inside a React client component using the hook
const handleAddTrustline = async () => {
  if (!wallet) return;
  try {
    await establishUSDCTrustline(wallet.id, email, passphrase);
    alert('USDC trustline established');
  } catch (err) {
    console.error('Trustline failed', err);
  }
}
```

### Send USDC (component example)

```tsx
const handleSendUSDC = async () => {
  if (!wallet) return;
  try {
    const res = await sendUSDC({
      walletId: wallet.id,
      email,
      passphrase,
      toAddress: 'G...RECIPIENT',
      amount: '10.00'
    });
    console.log('USDC sent, tx:', res.transactionHash);
  } catch (err) {
    console.error('SendUSDC failed', err);
  }
}
```

These snippets show the minimal flow to enable USDC and perform token transfers from a client-based integration.
