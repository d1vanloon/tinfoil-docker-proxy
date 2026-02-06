import { jest } from '@jest/globals';

// Mock tinfoil dependency
const mockReady = jest.fn().mockResolvedValue(undefined);
const mockGetVerificationDocument = jest.fn().mockResolvedValue({ securityVerified: true });

jest.unstable_mockModule('tinfoil', () => ({
    SecureClient: jest.fn().mockImplementation(() => ({
        ready: mockReady,
        getVerificationDocument: mockGetVerificationDocument
    }))
}));

describe('resetLogic', () => {
    let initializeTinfoil, shouldReset, getLastResetTime, resetTinfoil;

    beforeAll(async () => {
        const mod = await import('../src/tinfoilClient.js');
        initializeTinfoil = mod.initializeTinfoil;
        shouldReset = mod.shouldReset;
        getLastResetTime = mod.getLastResetTime;
        resetTinfoil = mod.resetTinfoil;
    });

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    test('should track last reset time', async () => {
        await initializeTinfoil();
        expect(getLastResetTime()).toBe(new Date('2024-01-01T00:00:00Z').getTime());
    });

    test('shouldReset returns false if interval not exceeded', async () => {
        await initializeTinfoil();

        // Advance time by 30 minutes
        jest.advanceTimersByTime(30 * 60 * 1000);

        // Interval is 1 hour (in ms)
        expect(shouldReset(3600 * 1000)).toBe(false);
    });

    test('shouldReset returns true if interval exceeded', async () => {
        await initializeTinfoil();

        // Advance time by 61 minutes
        jest.advanceTimersByTime(61 * 60 * 1000);

        expect(shouldReset(3600 * 1000)).toBe(true);
    });

    test('resetTinfoil should update last reset time', async () => {
        await initializeTinfoil();
        const firstResetTime = getLastResetTime();

        // Advance time by 2 hours
        jest.advanceTimersByTime(2 * 60 * 60 * 1000);

        await resetTinfoil();

        expect(getLastResetTime()).toBeGreaterThan(firstResetTime);
        expect(getLastResetTime()).toBe(new Date('2024-01-01T02:00:00Z').getTime());
    });
});
