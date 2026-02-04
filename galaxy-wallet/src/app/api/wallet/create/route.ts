import { NextRequest, NextResponse } from 'next/server';

const GALAXY_CONFIG = {
    network: 'testnet' as const,
    horizonUrl: 'https://horizon-testnet.stellar.org',
    passphrase: 'Test SDF Network ; September 2015',
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, email, network, password } = body;

        if (!userId || !email || !password) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Dynamic import for Turbopack compatibility
        const { InvisibleWalletService, NetworkUtils } = await import('@galaxy-kj/core-invisible-wallet/dist/invisible-wallet/index.js');
        const invisibleWalletService = new InvisibleWalletService(GALAXY_CONFIG);
        const networkUtils = new NetworkUtils();

        // Create wallet using the official SDK
        const result = await invisibleWalletService.createWallet(
            {
                userId,
                email,
                network: network || 'testnet',
            },
            password
        );

        // Fund wallet with Friendbot on testnet
        let funded = false;
        if ((network || 'testnet') === 'testnet') {
            try {
                await networkUtils.fundTestnetAccount(result.wallet.publicKey);
                funded = true;
            } catch (friendbotError) {
                console.warn('Friendbot funding error:', friendbotError);
            }
        }

        return NextResponse.json({
            success: true,
            walletId: result.wallet.id,
            publicKey: result.wallet.publicKey,
            funded,
        });
    } catch (error) {
        console.error('Wallet creation error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Wallet creation failed' },
            { status: 500 }
        );
    }
}
