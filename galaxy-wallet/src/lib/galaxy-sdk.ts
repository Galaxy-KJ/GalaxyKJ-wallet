// Configuration according to SDK requirements
export const GALAXY_CONFIG = {
    network: 'testnet' as const,
    horizonUrl: 'https://horizon-testnet.stellar.org',
    passphrase: 'Test SDF Network ; September 2015',
};

// Lazy initialization for client-safe Stellar service
let stellarServiceInstance: any = null;

export async function getStellarService() {
    if (!stellarServiceInstance) {
        const { StellarService } = await import('@galaxy-kj/core-stellar-sdk');
        stellarServiceInstance = new StellarService(GALAXY_CONFIG);
    }
    return stellarServiceInstance;
}
