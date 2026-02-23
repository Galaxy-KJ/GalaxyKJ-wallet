import { NextRequest, NextResponse } from 'next/server';

const GALAXY_CONFIG = {
    network: 'testnet' as const,
    horizonUrl: 'https://horizon-testnet.stellar.org',
    passphrase: 'Test SDF Network ; September 2015',
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletId, encryptedSecret } = body;

        if (!walletId || !encryptedSecret) {
            return NextResponse.json(
                { error: 'Missing walletId or encryptedSecret' },
                { status: 400 }
            );
        }

        // Dynamic import
        const { InvisibleWalletService } = await import('@galaxy-kj/core-invisible-wallet/dist/invisible-wallet/index.js');
        const invisibleWalletService = new InvisibleWalletService(GALAXY_CONFIG);

        // Get wallet from DB
        const wallet = await invisibleWalletService.getWalletById(walletId);

        if (!wallet) {
            return NextResponse.json(
                { error: 'Wallet not found' },
                { status: 404 }
            );
        }

        // Verify the encrypted secret matches what we have in DB
        // This proves the user successfully unlocked it via Biometrics on the client
        if (wallet.encryptedPrivateKey !== encryptedSecret) {
            return NextResponse.json(
                { error: 'Invalid secret verification' },
                { status: 401 }
            );
        }

        // In a real app, we would create a session token here.
        // For the demo, we'll return the wallet info and a mock session token.
        return NextResponse.json({
            success: true,
            walletId: wallet.id,
            publicKey: wallet.publicKey,
            sessionToken: `bio_session_${Date.now()}`,
            message: 'Biometric session authorized'
        });

    } catch (error) {
        console.error('Session authorization error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Authorization failed' },
            { status: 500 }
        );
    }
}
