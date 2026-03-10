import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { securityConstraints } from '../middleware/securityConstraints';

describe('Security Constraints Middleware', () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
        mockRequest = {
            ip: '123.456.789.000', // Our mocked office router IP
        };
        mockResponse = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn(),
        };
        nextFunction = vi.fn();

        // Let's set the office router IP in env
        process.env.OFFICE_ROUTER_IP = '123.456.789.000';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // Helper function to mock the current date and time
    const setMockTime = (dayOfWeek: number, hours: number) => {
        const mockDate = new Date();

        // Mock getDay()
        vi.spyOn(mockDate, 'getDay').mockReturnValue(dayOfWeek);

        // Mock getHours()
        vi.spyOn(mockDate, 'getHours').mockReturnValue(hours);

        // Replace global Date with a constructor that returns our mocked object
        const DummyDate = function () { return mockDate; } as unknown as typeof Date;
        DummyDate.now = Date.now;
        global.Date = DummyDate;
    };

    it('should bypass all checks if user is Admin', () => {
        mockRequest.user = { id: '1', email: 'test@example.com', name: 'Admin User', role: 'Admin' };

        // Even if it's Sunday at midnight outside the office
        setMockTime(0, 0);
        (mockRequest as any).ip = '1.1.1.1';

        securityConstraints(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should block Staff on Sundays', () => {
        mockRequest.user = { id: '2', email: 'staff@example.com', name: 'Staff User', role: 'Staff' };
        setMockTime(0, 10); // Sunday 10:00 AM

        securityConstraints(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'System is not accessible on Sundays.' });
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should block Staff before 8:00 AM', () => {
        mockRequest.user = { id: '2', email: 'staff@example.com', name: 'Staff User', role: 'Staff' };
        setMockTime(1, 7); // Monday 7:00 AM

        securityConstraints(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'System is only accessible between 08:00 and 18:00.' });
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should block Staff after 6:00 PM', () => {
        mockRequest.user = { id: '2', email: 'staff@example.com', name: 'Staff User', role: 'Staff' };
        setMockTime(3, 18); // Wednesday 6:00 PM (18:00)

        securityConstraints(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should block Staff from unauthorized IPs', () => {
        mockRequest.user = { id: '2', email: 'staff@example.com', name: 'Staff User', role: 'Staff' };
        setMockTime(2, 12); // Tuesday 12:00 PM
        (mockRequest as any).ip = '4.4.4.4'; // Random external IP

        securityConstraints(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(403);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'System is only accessible from the authorized office network.' });
        expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should allow Staff on a valid day, time, and IP', () => {
        mockRequest.user = { id: '2', email: 'staff@example.com', name: 'Staff User', role: 'Staff' };
        setMockTime(5, 14); // Friday 2:00 PM (14:00)
        (mockRequest as any).ip = '123.456.789.000'; // Authorized office IP

        securityConstraints(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(nextFunction).toHaveBeenCalled();
        expect(mockResponse.status).not.toHaveBeenCalled();
    });
});
