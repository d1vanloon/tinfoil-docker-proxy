import { jest } from '@jest/globals';

// Mock the SecureClient class
const mockReady = jest.fn();
const mockGetVerificationDocument = jest.fn();
const mockGetBaseURL = jest.fn();
const mockFetch = jest.fn();

jest.unstable_mockModule('tinfoil', () => ({
    SecureClient: jest.fn().mockImplementation(() => ({
        ready: mockReady,
        getVerificationDocument: mockGetVerificationDocument,
        getBaseURL: mockGetBaseURL,
        fetch: mockFetch,
    })),
}));

// Import the module under test AFTER mocking
const { initializeTinfoil, secureClient } = await import('../src/tinfoilClient.js');
const { SecureClient } = await import('tinfoil');

describe('TinfoilClient', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('initializeTinfoil should complete successfully when verification passes', async () => {
        // Arrange
        mockReady.mockResolvedValue(undefined);
        mockGetVerificationDocument.mockResolvedValue({ some: 'doc' });

        // Act
        const result = await initializeTinfoil();

        // Assert
        expect(mockReady).toHaveBeenCalled();
        expect(mockGetVerificationDocument).toHaveBeenCalled();
        expect(result).toBe(secureClient);
    });

    test('initializeTinfoil should throw error when verification fails', async () => {
        // Arrange
        mockReady.mockResolvedValue(undefined);
        mockGetVerificationDocument.mockResolvedValue(null);

        // Act & Assert
        await expect(initializeTinfoil()).rejects.toThrow('Verification failed: No verification document received or security verification failed.');
    });

    test('initializeTinfoil should throw error when securityVerified is false', async () => {
        // Arrange
        mockReady.mockResolvedValue(undefined);
        mockGetVerificationDocument.mockResolvedValue({ securityVerified: false });

        // Act & Assert
        await expect(initializeTinfoil()).rejects.toThrow('Verification failed: No verification document received or security verification failed.');
    });
});
