import { openDB } from "idb"

const DB_NAME = "wallet-db"
const STORE_NAME = "encrypted-wallet"

/**
 * Encrypts a private key using password-based encryption with enhanced security measures
 * 
 * SECURITY LIMITATION WARNING:
 * Both the secretKey and password parameters are JavaScript strings, which are IMMUTABLE
 * and CANNOT be securely wiped from memory. Despite the clearing of Uint8Array buffers
 * in the finally block, the original string data may persist in memory until garbage
 * collection occurs, and even then, memory may not be immediately overwritten.
 * 
 * SECURITY IMPLICATIONS:
 * - Original string parameters remain in memory as immutable data
 * - Memory dumps could potentially expose sensitive data
 * - Garbage collection timing is not guaranteed
 * - Swap files may contain sensitive data
 * 
 * RECOMMENDATIONS:
 * - Only use in secure, trusted environments
 * - Avoid shared or potentially compromised systems
 * - Consider the entire application lifecycle for security planning
 * - Implement additional application-level security measures
 * 
 * @param secretKey - Private key to encrypt (WARNING: immutable string, cannot be securely wiped)
 * @param password - Password for encryption (WARNING: immutable string, cannot be securely wiped) 
 * @returns Promise resolving to encrypted data as JSON string
 */
export async function encryptPrivateKey(secretKey: string, password: string): Promise<string> {
  const enc = new TextEncoder()
  
  let keyMaterial: CryptoKey | null = null
  let derivedKey: CryptoKey | null = null
  let ciphertext: ArrayBuffer | null = null
  let passwordBytes: Uint8Array | null = null
  let secretKeyBytes: Uint8Array | null = null

  try {
    passwordBytes = enc.encode(password)
    secretKeyBytes = enc.encode(secretKey)
    
    keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      passwordBytes,
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    )

    const salt = window.crypto.getRandomValues(new Uint8Array(16))
    const iv = window.crypto.getRandomValues(new Uint8Array(12))

    derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    )

    ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      derivedKey,
      secretKeyBytes
    )

    const encryptedData = {
      ciphertext: Array.from(new Uint8Array(ciphertext)),
      salt: Array.from(salt),
      iv: Array.from(iv),
    }

    return JSON.stringify(encryptedData)
  } finally {
    // NOTE: These buffer clearing operations provide limited security benefit
    // because the original string parameters (password, secretKey) remain
    // in memory as immutable data and cannot be securely wiped
    if (passwordBytes) {
      passwordBytes.fill(0)
    }
    
    if (secretKeyBytes) {
      secretKeyBytes.fill(0)
    }
    
    if (ciphertext) {
      new Uint8Array(ciphertext).fill(0)
    }
    
    keyMaterial = null
    derivedKey = null
    ciphertext = null
    
    // Attempt garbage collection - timing not guaranteed
    if (typeof global !== 'undefined' && global.gc) {
      global.gc()
    }
  }
}

/**
 * Update an existing encrypted wallet
 * 
 * @param walletId - Wallet identifier
 * @param encrypted - New encrypted wallet data
 * @param keyHash - Hash of the new encryption key (optional)
 */
export async function updateEncryptedWallet(
  walletId: string,
  encrypted: string,
  keyHash?: string
): Promise<void> {
  try {
    // Generate key hash if not provided
    const hash = keyHash || await generateKeyHash(encrypted);
    
    // Update using the robust database manager
    await databaseManager.updateWallet(walletId, encrypted, hash);
    
    console.log(`Wallet ${walletId} updated successfully`);
  } catch (error) {
    console.error('Failed to update encrypted wallet:', error);
    throw new Error('Failed to update wallet: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Delete an encrypted wallet
 * 
 * @param walletId - Wallet identifier
 */
export async function deleteEncryptedWallet(walletId: string): Promise<void> {
  try {
    await databaseManager.deleteWallet(walletId);
    console.log(`Wallet ${walletId} deleted successfully`);
  } catch (error) {
    console.error('Failed to delete encrypted wallet:', error);
    throw new Error('Failed to delete wallet: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * List all available wallets
 * 
 * @returns Array of wallet metadata
 */
export async function listEncryptedWallets(): Promise<Array<{
  id: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  backupCount: number;
}>> {
  try {
    const wallets = await databaseManager.listWallets();
    return wallets.map(wallet => ({
      id: wallet.id,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt,
      version: wallet.version,
      backupCount: wallet.backupCount,
    }));
  } catch (error) {
    console.error('Failed to list encrypted wallets:', error);
    throw new Error('Failed to list wallets: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Create a backup of an encrypted wallet
 * 
 * @param walletId - Wallet identifier
 * @param backupType - Type of backup ('manual' | 'automatic' | 'rotation')
 * @returns Backup identifier
 */
export async function createWalletBackup(
  walletId: string,
  backupType: 'manual' | 'automatic' | 'rotation' = 'manual'
): Promise<string> {
  try {
    const backupId = await databaseManager.createBackup(walletId, backupType);
    console.log(`Backup ${backupId} created for wallet ${walletId}`);
    return backupId;
  } catch (error) {
    console.error('Failed to create wallet backup:', error);
    throw new Error('Failed to create backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Restore a wallet from backup
 * 
 * @param backupId - Backup identifier
 */
export async function restoreWalletFromBackup(backupId: string): Promise<void> {
  try {
    await databaseManager.restoreFromBackup(backupId);
    console.log(`Wallet restored from backup ${backupId}`);
  } catch (error) {
    console.error('Failed to restore wallet from backup:', error);
    throw new Error('Failed to restore from backup: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Enable encryption key rotation for enhanced security
 * 
 * @param walletId - Wallet identifier
 * @param oldPassword - Current password
 * @param newPassword - New password
 */
export async function rotateEncryptionKey(
  walletId: string,
  oldPassword: string,
  newPassword: string
): Promise<void> {
  try {
    // Get current wallet
    const walletData = await getEncryptedWallet(walletId);
    if (!walletData) {
      throw new Error('Wallet not found for key rotation');
    }
    
    // Create backup before rotation
    await createWalletBackup(walletId, 'rotation');
    
    // Decrypt with old password
    const decryptedData = await decryptPrivateKey(walletData.encryptedData, oldPassword);
    
    // Re-encrypt with new password
    const reencryptedData = await encryptPrivateKey(decryptedData, newPassword);
    
    // Generate new key hash
    const newKeyHash = await generateKeyHash(reencryptedData);
    
    // Update wallet with new encrypted data
    await updateEncryptedWallet(walletId, reencryptedData, newKeyHash);
    
    console.log(`Encryption key rotated successfully for wallet ${walletId}`);
  } catch (error) {
    console.error('Failed to rotate encryption key:', error);
    throw new Error('Failed to rotate encryption key: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Generate a hash of the encryption parameters for validation
 * 
 * @param encryptedData - Encrypted data to hash
 * @returns SHA-256 hash string
 */
export async function generateKeyHash(encryptedData: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(encryptedData);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('Failed to generate key hash:', error);
    throw new Error('Failed to generate key hash');
  }
}

/**
 * Validate wallet data integrity
 * 
 * @param wallet - Wallet data to validate
 * @returns True if integrity check passes
 */
export async function validateWalletIntegrity(wallet: {
  encryptedData: string;
  checksumSHA256: string;
}): Promise<boolean> {
  try {
    const calculatedChecksum = await generateKeyHash(wallet.encryptedData);
    return calculatedChecksum === wallet.checksumSHA256;
  } catch (error) {
    console.error('Failed to validate wallet integrity:', error);
    return false;
  }
}

/**
 * Get database storage status
 * 
 * @returns Storage status information
 */
export async function getStorageStatus(): Promise<{
  isAvailable: boolean;
  storageUsed: number;
  storageQuota: number;
  walletCount: number;
  backupCount: number;
}> {
  try {
    const status = await databaseManager.getStatus();
    return {
      isAvailable: status.isAvailable,
      storageUsed: status.storageUsed,
      storageQuota: status.storageQuota,
      walletCount: status.walletCount,
      backupCount: status.backupCount,
    };
  } catch (error) {
    console.error('Failed to get storage status:', error);
    return {
      isAvailable: false,
      storageUsed: 0,
      storageQuota: 0,
      walletCount: 0,
      backupCount: 0,
    };
  }
}

/**
 * Clean up expired backups
 * 
 * @returns Number of backups cleaned up
 */
export async function cleanupExpiredBackups(): Promise<number> {
  try {
    const deletedCount = await databaseManager.cleanupExpiredBackups();
    console.log(`Cleaned up ${deletedCount} expired backups`);
    return deletedCount;
  } catch (error) {
    console.error('Failed to cleanup expired backups:', error);
    return 0;
  }
}

/**
 * Save encrypted wallet using the robust database system
 * 
 * @param encrypted - Encrypted wallet data
 * @param keyHash - Hash of the encryption key for validation (optional)
 * @param walletId - Wallet identifier (optional, will generate if not provided)
 */
export async function saveEncryptedWallet(
  encrypted: string, 
  keyHash?: string, 
  walletId?: string
): Promise<string> {
  try {
    // Generate wallet ID if not provided
    const id = walletId || `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate key hash if not provided
    const hash = keyHash || await generateKeyHash(encrypted);
    
    // Store using the robust database manager
    await databaseManager.storeWallet(id, encrypted, hash);
    
    console.log(`Wallet saved successfully with ID: ${id}`);
    return id;
  } catch (error) {
    console.error('Failed to save encrypted wallet:', error);
    throw new Error('Failed to save wallet: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Get encrypted wallet data using the robust database system
 * 
 * @param walletId - Wallet identifier (optional, gets most recent if not provided)
 * @returns Encrypted wallet data or null if not found
 */
export async function getEncryptedWallet(walletId?: string): Promise<{
  encryptedData: string;
  keyHash: string;
  id: string;
  version: number;
} | null> {
  try {
    let wallet;
    
    if (walletId) {
      // Get specific wallet
      wallet = await databaseManager.getWallet(walletId);
    } else {
      // Get the most recent wallet
      const wallets = await databaseManager.listWallets();
      wallet = wallets.length > 0 ? wallets[0] : null;
    }
    
    if (!wallet) {
      console.log('No wallet found');
      return null;
    }
    
    // Validate data integrity
    const isValid = await validateWalletIntegrity(wallet);
    if (!isValid) {
      console.warn(`Wallet ${wallet.id} failed integrity check`);
      throw new Error('Wallet data integrity check failed');
    }
    
    return {
      encryptedData: wallet.encryptedData,
      keyHash: wallet.keyHash,
      id: wallet.id,
      version: wallet.version,
    };
  } catch (error) {
    console.error('Failed to get encrypted wallet:', error);
    throw new Error('Failed to retrieve wallet: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

/**
 * Decrypts a private key using password-based decryption with security limitations
 * 
 * SECURITY LIMITATION WARNING:
 * The password parameter is a JavaScript string, which is IMMUTABLE and CANNOT be 
 * securely wiped from memory. Despite clearing Uint8Array buffers in the finally 
 * block, the original password string may persist in memory until garbage collection
 * occurs, and memory may not be immediately overwritten.
 * 
 * ADDITIONAL SECURITY CONCERNS:
 * - The decrypted private key is returned as a string, creating another immutable
 *   copy in memory that cannot be securely wiped
 * - Both input and output sensitive data remain in memory as immutable strings
 * - Memory dumps could potentially expose both encrypted keys and passwords
 * 
 * SECURITY IMPLICATIONS:
 * - Original password parameter remains in memory as immutable data
 * - Returned private key string cannot be securely wiped by caller
 * - Multiple copies of sensitive data may exist in memory simultaneously
 * - Timing of garbage collection is not guaranteed
 * 
 * RECOMMENDATIONS:
 * - Only use in secure, trusted environments
 * - Minimize the lifetime of returned private key data
 * - Consider the entire application security model
 * - Implement additional safeguards at the application level
 * 
 * @param encryptedStr - Encrypted private key data as JSON string
 * @param password - Password for decryption (WARNING: immutable string, cannot be securely wiped)
 * @returns Promise resolving to decrypted private key (WARNING: immutable string, cannot be securely wiped)
 */
export async function decryptPrivateKey(encryptedStr: string, password: string): Promise<string> {
  const enc = new TextEncoder()
  const dec = new TextDecoder()
  
  let keyMaterial: CryptoKey | null = null
  let derivedKey: CryptoKey | null = null
  let decrypted: ArrayBuffer | null = null
  let passwordBytes: Uint8Array | null = null

  try {
    console.log("Starting decryption process...")
    const encrypted = JSON.parse(encryptedStr)
    console.log("JSON parsed successfully")
    
    const salt = new Uint8Array(encrypted.salt as number[])
    const iv = new Uint8Array(encrypted.iv as number[])
    const data = new Uint8Array(encrypted.ciphertext as number[])
    console.log("Encrypted data extracted:", { saltLength: salt.length, ivLength: iv.length, dataLength: data.length })

    passwordBytes = enc.encode(password)
    console.log("Password encoded")
    console.log("Importing key material...")
    keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      passwordBytes,
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    )
    console.log("Key material imported successfully")

    console.log("Deriving key...")
    derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    )
    console.log("Key derived successfully")

    console.log("Attempting to decrypt data...")
    decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      derivedKey,
      data
    )
    console.log("Data decrypted successfully")

    const result = dec.decode(decrypted)
    console.log("Result decoded successfully")
    return result
  } finally {
    // NOTE: These buffer clearing operations provide limited security benefit
    // because the original password string parameter remains in memory as
    // immutable data and cannot be securely wiped. Additionally, the returned
    // private key string will also be immutable and cannot be wiped by the caller.
    if (passwordBytes) {
      passwordBytes.fill(0)
    }
    
    if (decrypted) {
      new Uint8Array(decrypted).fill(0)
    }
    
    keyMaterial = null
    derivedKey = null
    decrypted = null
    
    // Attempt garbage collection - timing not guaranteed
    if (typeof global !== 'undefined' && global.gc) {
      global.gc()
    }
  }
}
