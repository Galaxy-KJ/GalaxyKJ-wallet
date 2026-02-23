/**
 * Invisible Wallet Demo Component
 * 
 * Demonstrates the functionality of the Invisible Wallet system
 * with a user-friendly interface for testing all features.
 */

'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInvisibleWallet } from '@/hooks/use-invisible-wallet';
import { NetworkType } from '@/types/invisible-wallet';
import { Loader2, CheckCircle, AlertCircle, Eye, EyeOff, Copy } from 'lucide-react';

/**
 * Demo component configuration
 */
const DEMO_CONFIG = {
  platformId: 'galaxy-smart-wallet-demo',
  defaultNetwork: 'testnet' as NetworkType,
  debug: true,
};

/**
 * Main demo component
 */
export function InvisibleWalletDemo() {
  const {
    wallet,
    isLoading,
    error,
    isInitialized,
    createWalletWithKeys,
    recoverWallet,
    getWallet,
    signTransaction,
    establishUSDCTrustline,
    sendUSDC,
    usdcBalance,
    validatePassphrase,
    clearError,
    refreshWallet,
  } = useInvisibleWallet(DEMO_CONFIG);

  const [activeTab, setActiveTab] = useState('create');
  const [formData, setFormData] = useState({
    email: '',
    passphrase: '',
    network: 'testnet' as NetworkType,
  });
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [transactionXDR, setTransactionXDR] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [signResult, setSignResult] = useState<any>(null);
  const [createdWallet, setCreatedWallet] = useState<{
    publicKey: string;
    secretKey: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    walletResponse: any;
  } | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);

  const [sendUSDCForm, setSendUSDCForm] = useState({ toAddress: '', amount: '' })
  const [usdcResult, setUsdcResult] = useState<string | null>(null)

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearError();
    // Clear created wallet when changing form data
    if (createdWallet) setCreatedWallet(null);
  };

  // Handle wallet creation
  const handleCreateWallet = async () => {
    try {
      const result = await createWalletWithKeys(formData.email, formData.passphrase, {
        network: formData.network,
        metadata: { source: 'demo', timestamp: new Date().toISOString() }
      });
      console.log('Wallet created:', result);

      // Store the created wallet info to display keys
      setCreatedWallet({
        publicKey: result.publicKey,
        secretKey: result.secretKey,
        walletResponse: result
      });
    } catch (error) {
      console.error('Failed to create wallet:', error);
    }
  };

  // Handle wallet recovery
  const handleRecoverWallet = async () => {
    try {
      const result = await recoverWallet(formData.email, formData.passphrase, {
        network: formData.network,
      });
      console.log('Wallet recovered:', result);
    } catch (error) {
      console.error('Failed to recover wallet:', error);
    }
  };

  // Handle wallet lookup
  const handleGetWallet = async () => {
    try {
      const result = await getWallet(formData.email, {
        network: formData.network,
      });
      console.log('Wallet retrieved:', result);
    } catch (error) {
      console.error('Failed to get wallet:', error);
    }
  };

  // Handle transaction signing
  const handleSignTransaction = async () => {
    if (!wallet || !transactionXDR.trim()) return;

    try {
      const result = await signTransaction(
        wallet.id,
        formData.email,
        formData.passphrase,
        transactionXDR.trim()
      );
      setSignResult(result);
      console.log('Transaction signed:', result);
    } catch (error) {
      console.error('Failed to sign transaction:', error);
    }
  };

  const handleEstablishTrustline = async () => {
    if (!wallet) return
    try {
      await establishUSDCTrustline(wallet.id, formData.email, formData.passphrase)
      setUsdcResult('Trustline established successfully!')
    } catch (error) {
      console.error('Failed to establish trustline:', error)
    }
  }

  const handleSendUSDC = async () => {
    if (!wallet) return
    try {
      const result = await sendUSDC({
        walletId: wallet.id,
        email: formData.email,
        passphrase: formData.passphrase,
        toAddress: sendUSDCForm.toAddress,
        amount: sendUSDCForm.amount,
      })
      setUsdcResult(`Sent! TX Hash: ${result.transactionHash}`)
    } catch (error) {
      console.error('Failed to send USDC:', error)
    }
  }

  // Copy to clipboard utility
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Passphrase validation
  const passphraseValidation = validatePassphrase(formData.passphrase);

  if (!isInitialized) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Initializing Invisible Wallet SDK...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-2">🔐 Invisible Wallet Demo</h1>
        <p className="text-gray-600">
          Test the Invisible Wallet system that abstracts Stellar blockchain complexity
        </p>
        <div className="flex gap-2 mt-4">
          <Badge variant="outline">Platform: {DEMO_CONFIG.platformId}</Badge>
          <Badge variant="outline">Network: {formData.network}</Badge>
          <Badge variant={isInitialized ? "default" : "destructive"}>
            {isInitialized ? "Ready" : "Not Ready"}
          </Badge>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <div>
            <strong>Error:</strong> {error}
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={clearError}
            >
              Clear
            </Button>
          </div>
        </Alert>
      )}

      {/* Created Wallet Keys Display */}
      {createdWallet && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-800">✅ Wallet Created Successfully!</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreatedWallet(null)}
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              Clear
            </Button>
          </div>
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="text-amber-600 mt-1">⚠️</div>
                <div>
                  <h4 className="font-semibold text-amber-800 mb-1">Security Warning</h4>
                  <p className="text-amber-700 text-sm">
                    These keys are shown for demo purposes only. In production, private keys should never be displayed or logged.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label className="text-sm font-medium text-green-800">Public Key (Safe to share)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs bg-white p-3 rounded border flex-1 font-mono">
                    {createdWallet.publicKey}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(createdWallet.publicKey)}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-sm font-medium text-green-800">Private Key (Keep Secret!)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="text-green-700 hover:bg-green-100"
                  >
                    {showSecretKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-white p-3 rounded border flex-1 font-mono">
                    {showSecretKey ? createdWallet.secretKey : '•'.repeat(56)}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(createdWallet.secretKey)}
                    disabled={!showSecretKey}
                    className="border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-sm font-medium text-green-800">Wallet ID</Label>
                  <code className="text-xs bg-white p-2 rounded border block mt-1 font-mono">
                    {createdWallet.walletResponse.id}
                  </code>
                </div>
                <div>
                  <Label className="text-sm font-medium text-green-800">Network</Label>
                  <Badge variant="outline" className="mt-1 border-green-300 text-green-700">
                    {createdWallet.walletResponse.network}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">How to verify your wallet:</h4>
              <ol className="text-blue-700 text-sm space-y-1 list-decimal list-inside">
                <li>Copy the public key above</li>
                <li>Go to <a href={`https://stellar.expert/explorer/${formData.network}/account/${createdWallet.publicKey}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Stellar Expert</a> or <a href={`https://stellarchain.io/accounts/${createdWallet.publicKey}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">StellarChain</a></li>
                <li>Search for your account to see it exists</li>
                <li>If on testnet, the account should be funded automatically</li>
              </ol>
            </div>
          </div>
        </Card>
      )}

      {/* Current Wallet Display */}
      {wallet && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Current Wallet</h3>
            <Button variant="outline" size="sm" onClick={refreshWallet}>
              Refresh Balance
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Public Key</Label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-gray-100 p-2 rounded flex-1">
                  {wallet.publicKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(wallet.publicKey)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Wallet ID</Label>
              <code className="text-xs bg-gray-100 p-2 rounded block mt-1">
                {wallet.id}
              </code>
            </div>
            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="mt-1">
                <Badge variant={wallet.accountExists ? "default" : "secondary"}>
                  {wallet.accountExists ? "Account Exists" : "Account Not Found"}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Balances</Label>
              <div className="mt-1 space-y-1">
                {wallet.balances.length > 0 ? (
                  wallet.balances.map((balance, index) => (
                    <div key={index} className="text-sm">
                      <Badge variant="outline">
                        {balance.balance} {balance.assetCode || 'XLM'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No balances</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Main Interface */}
      <Card className="p-6">
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          // Clear created wallet when changing tabs
          if (createdWallet) setCreatedWallet(null);
        }}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">Create Wallet</TabsTrigger>
            <TabsTrigger value="recover">Recover Wallet</TabsTrigger>
            <TabsTrigger value="lookup">Lookup Wallet</TabsTrigger>
            <TabsTrigger value="sign">Sign Transaction</TabsTrigger>
            <TabsTrigger value="usdc">USDC</TabsTrigger>
          </TabsList>

          {/* Common Form Fields */}
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="network">Network</Label>
                <select
                  id="network"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.network}
                  onChange={(e) => handleInputChange('network', e.target.value as NetworkType)}
                >
                  <option value="testnet">Testnet</option>
                  <option value="mainnet">Mainnet</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="passphrase">Passphrase</Label>
              <div className="relative">
                <Input
                  id="passphrase"
                  type={showPassphrase ? "text" : "password"}
                  placeholder="Enter a strong passphrase"
                  value={formData.passphrase}
                  onChange={(e) => handleInputChange('passphrase', e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                >
                  {showPassphrase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>

              {/* Passphrase Validation */}
              {formData.passphrase && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    {passphraseValidation.isValid ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`text-sm ${passphraseValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {passphraseValidation.isValid ? 'Strong passphrase' : 'Weak passphrase'}
                    </span>
                  </div>
                  {!passphraseValidation.isValid && passphraseValidation.errors.length > 0 && (
                    <ul className="text-xs text-red-600 space-y-1">
                      {passphraseValidation.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          <TabsContent value="create">
            <div className="mt-6">
              <Button
                onClick={handleCreateWallet}
                disabled={isLoading || !formData.email || !formData.passphrase || !passphraseValidation.isValid}
                className="w-full"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Invisible Wallet
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                Creates a new Stellar wallet encrypted with your passphrase.
                On testnet, the account will be automatically funded.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="recover">
            <div className="mt-6">
              <Button
                onClick={handleRecoverWallet}
                disabled={isLoading || !formData.email || !formData.passphrase}
                className="w-full"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Recover Wallet
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                Recovers an existing wallet using your email and passphrase.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="lookup">
            <div className="mt-6">
              <Button
                onClick={handleGetWallet}
                disabled={isLoading || !formData.email}
                className="w-full"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Lookup Wallet
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                Retrieves wallet information and balance without requiring passphrase.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="sign">
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="transaction-xdr">Transaction XDR</Label>
                <textarea
                  id="transaction-xdr"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md h-32"
                  placeholder="Paste Stellar transaction XDR here..."
                  value={transactionXDR}
                  onChange={(e) => setTransactionXDR(e.target.value)}
                />
              </div>

              <Button
                onClick={handleSignTransaction}
                disabled={isLoading || !wallet || !transactionXDR.trim() || !formData.passphrase}
                className="w-full"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sign Transaction
              </Button>

              {/* Sign Result */}
              {signResult && (
                <div className="mt-4 p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Signing Result</h4>
                  <div className="space-y-2">
                    <div>
                      <Badge variant={signResult.success ? "default" : "destructive"}>
                        {signResult.success ? "Success" : "Failed"}
                      </Badge>
                    </div>
                    {signResult.success ? (
                      <>
                        <div>
                          <Label className="text-sm">Transaction Hash</Label>
                          <code className="text-xs bg-gray-100 p-2 rounded block mt-1">
                            {String(signResult.transactionHash || '')}
                          </code>
                        </div>
                        <div>
                          <Label className="text-sm">Signed XDR</Label>
                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded-md h-20 text-xs"
                            value={String(signResult.signedXDR || '')}
                            readOnly
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-red-600 text-sm">
                        Error: {String(signResult.error || 'Unknown error')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-600">
                Signs a Stellar transaction with the wallet&apos;s private key.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="usdc">
            <div className="mt-6 space-y-6">

              {/* USDC Balance */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Label className="font-medium text-blue-800">USDC Balance</Label>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {usdcBalance ?? <span className="text-sm font-normal text-blue-600">No trustline — USDC not enabled</span>}
                  {usdcBalance && ' USDC'}
                </p>
              </div>

              {/* Establish Trustline */}
              <div className="space-y-2">
                <h4 className="font-medium">Step 1: Add USDC Trustline</h4>
                <p className="text-sm text-gray-600">
                  Required before your wallet can receive USDC. Only needed once per wallet.
                </p>
                <Button
                  onClick={handleEstablishTrustline}
                  disabled={isLoading || !wallet || !formData.passphrase}
                  variant="outline"
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add USDC Trustline
                </Button>
              </div>

              {/* Send USDC */}
              <div className="space-y-3">
                <h4 className="font-medium">Step 2: Send USDC</h4>
                <div>
                  <Label htmlFor="usdc-to">Destination Address</Label>
                  <Input
                    id="usdc-to"
                    placeholder="G..."
                    value={sendUSDCForm.toAddress}
                    onChange={(e) => setSendUSDCForm(prev => ({ ...prev, toAddress: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="usdc-amount">Amount</Label>
                  <Input
                    id="usdc-amount"
                    type="number"
                    placeholder="10.00"
                    value={sendUSDCForm.amount}
                    onChange={(e) => setSendUSDCForm(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={handleSendUSDC}
                  disabled={isLoading || !wallet || !sendUSDCForm.toAddress || !sendUSDCForm.amount || !formData.passphrase}
                  className="w-full"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Send USDC
                </Button>
              </div>

              {/* Result */}
              {usdcResult && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <div>{usdcResult}</div>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* SDK Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">SDK Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <Label className="font-medium">Platform ID</Label>
            <p className="text-gray-600">{DEMO_CONFIG.platformId}</p>
          </div>
          <div>
            <Label className="font-medium">Default Network</Label>
            <p className="text-gray-600">{DEMO_CONFIG.defaultNetwork}</p>
          </div>
          <div>
            <Label className="font-medium">Debug Mode</Label>
            <p className="text-gray-600">{DEMO_CONFIG.debug ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
