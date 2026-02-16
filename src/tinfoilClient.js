import { SecureClient } from 'tinfoil';

export const secureClient = new SecureClient();

export async function initializeTinfoil() {
    console.log('Initializing SecureClient...');
    await secureClient.ready();

    console.log('Verifying execution environment...');
    const verificationDoc = await secureClient.getVerificationDocument();

    if (!verificationDoc || verificationDoc.securityVerified === false) {
        throw new Error('Verification failed: No verification document received or security verification failed.');
    }

    console.log('Environment verified successfully.');
    console.log('Verification Document:', JSON.stringify(verificationDoc, null, 2));

    return secureClient;
}
