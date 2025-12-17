import { SecureClient } from 'tinfoil/secure-client';

export const secureClient = new SecureClient();

export async function initializeTinfoil() {
    console.log('Initializing SecureClient...');
    await secureClient.ready();

    console.log('Verifying execution environment...');
    const verificationDoc = await secureClient.getVerificationDocument();

    if (!verificationDoc) {
        throw new Error('Verification failed: No verification document received.');
    }

    console.log('Environment verified successfully.');
    console.log('Verification Document:', JSON.stringify(verificationDoc, null, 2));
    return secureClient;
}
