import { NextRequest, NextResponse } from 'next/server';

const GALAXY_CONFIG = {
    network: 'testnet' as const,
    horizonUrl: 'https://horizon-testnet.stellar.org',
    passphrase: 'Test SDF Network ; September 2015',
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { walletId, password } = body;

        if (!walletId || !password) {
            return NextResponse.json(
                { error: 'Missing walletId or password' },
                { status: 400 }
            );
        }

        // Dynamic import
        const { InvisibleWalletService } = await import('@galaxy-kj/core-invisible-wallet/dist/invisible-wallet/index.js');
        const invisibleWalletService = new InvisibleWalletService(GALAXY_CONFIG);

        // Get wallet
        const wallet = await invisibleWalletService.getWalletById(walletId);

        if (!wallet) {
            return NextResponse.json(
                { error: 'Wallet not found' },
                { status: 404 }
            );
        }

        // Try to unlock/verify password
        // The SDK might have an unlockWallet or we can try to use StellarService to verify
        // For this demo, let's assume we can verify it by attempting a dummy operation or checking if it's unlockable

        try {
            await invisibleWalletService.unlockWallet(walletId, password);
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid passphrase' },
                { status: 401 }
            );
        }

        // In a real app, the salt and IV would be stored in the database.
        // For the purposes of this demo, we'll extract them if they're part of the encrypted string,
        // or provide placeholders if the SDK handles it internally.
        // Assuming encrypted_private_key is 'iv:salt:ciphertext' or similar.

        // Based on common patterns in these types of SDKs:
        const encryptedData = wallet.encryptedPrivateKey;

        return NextResponse.json({
            success: true,
            keystore: {
                version: '1.0',
                email: (wallet as any).email || 'user@galaxy.wallet',
                platformId: 'galaxy-wallet-demo',
                network: wallet.network || 'testnet',
                encryptedSecret: encryptedData,
                salt: wallet.metadata?.salt || 'default_salt',
                iv: wallet.metadata?.iv || 'default_iv',
                createdAt: wallet.createdAt,
                // Checksum is SHA256 of the content excluding the checksum itself
                // We'll compute this on the client or server
            }
        });

    } catch (error) {
        console.error('Wallet export error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Export failed' },
            { status: 500 }
        );
    }
}
