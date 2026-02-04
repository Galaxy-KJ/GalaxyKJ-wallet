import { NextRequest, NextResponse } from 'next/server';

const GALAXY_CONFIG = {
    network: 'testnet' as const,
    horizonUrl: 'https://horizon-testnet.stellar.org',
    passphrase: 'Test SDF Network ; September 2015',
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletId, destination, amount, asset, memo, password } = body;

        if (!walletId || !destination || !amount || !password) {
            return NextResponse.json(
                { error: 'Missing required fields: walletId, destination, amount, password' },
                { status: 400 }
            );
        }

        // Dynamic import for Turbopack compatibility
        const { InvisibleWalletService } = await import(
            '@galaxy-kj/core-invisible-wallet/dist/invisible-wallet/index.js'
        );
        const invisibleWalletService = new InvisibleWalletService(GALAXY_CONFIG);

        // Get wallet using SDK's method (handles Supabase internally)
        const wallet = await invisibleWalletService.getWalletById(walletId);

        if (!wallet) {
            return NextResponse.json(
                { error: 'Wallet not found' },
                { status: 404 }
            );
        }

        // Use SDK's StellarService for sending payment
        const { StellarService } = await import(
            '@galaxy-kj/core-invisible-wallet/dist/stellar-sdk/src/services/stellar-service.js'
        );
        const stellarService = new StellarService(GALAXY_CONFIG);

        // Create wallet object in the format StellarService expects
        const stellarWallet = {
            id: wallet.id,
            publicKey: wallet.publicKey,
            privateKey: wallet.encryptedPrivateKey,
            network: GALAXY_CONFIG,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
            metadata: wallet.metadata || {},
        };

        // Send payment using the SDK
        const result = await stellarService.sendPayment(
            stellarWallet,
            {
                destination,
                amount: amount.toString(),
                asset: asset || 'XLM',
                memo: memo || undefined,
            },
            password
        );

        return NextResponse.json({
            success: true,
            hash: result.hash,
            status: result.status,
            ledger: result.ledger,
        });
    } catch (error) {
        console.error('Send payment error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Payment failed' },
            { status: 500 }
        );
    }
}
