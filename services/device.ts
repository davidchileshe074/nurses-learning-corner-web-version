
/**
 * Web Device ID Service
 * Mimics mobile functionality for device binding
 */

const DEVICE_ID_KEY = 'nlc_web_device_id';

export const getWebDeviceId = (): string => {
    if (typeof window === 'undefined') return 'server_side';

    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
        // Generate a simple UUID-like string for web
        deviceId = 'web-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
};
