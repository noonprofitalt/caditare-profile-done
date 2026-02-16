import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeamChat from '../TeamChat';

// Mock services
vi.mock('../../services/chatService', () => ({
    default: {
        getChannels: vi.fn().mockResolvedValue([
            { id: '1', name: 'General', type: 'public', unreadCount: 0 },
            { id: '2', name: 'Random', type: 'public', unreadCount: 2 },
        ]),
        getMessages: vi.fn().mockResolvedValue({
            messages: [
                {
                    id: 'msg-1',
                    text: 'Hello world',
                    senderName: 'John Doe',
                    timestamp: new Date(),
                },
            ],
        }),
        sendMessage: vi.fn().mockResolvedValue({ id: 'new-msg' }),
    },
}));

vi.mock('../../services/socketService', () => ({
    default: {
        connect: vi.fn(),
        disconnect: vi.fn(),
        on: vi.fn(),
        emit: vi.fn(),
    },
}));

describe('TeamChat Component', () => {
    const renderTeamChat = () => {
        return render(
            <BrowserRouter>
                <TeamChat />
            </BrowserRouter>
        );
    };

    it('should render without crashing', () => {
        renderTeamChat();
        expect(screen.getByText('Messages')).toBeInTheDocument();
    });

    it('should display channels list', async () => {
        renderTeamChat();

        await waitFor(() => {
            expect(screen.getByText('General')).toBeInTheDocument();
            expect(screen.getByText('Random')).toBeInTheDocument();
        });
    });

    it('should show unread count badge', async () => {
        renderTeamChat();

        await waitFor(() => {
            const badge = screen.getByText('2');
            expect(badge).toBeInTheDocument();
        });
    });

    it('should allow sending a message', async () => {
        renderTeamChat();

        await waitFor(() => {
            expect(screen.getByText('General')).toBeInTheDocument();
        });

        const input = screen.getByPlaceholderText(/type a message/i);
        fireEvent.change(input, { target: { value: 'Test message' } });

        const sendButton = screen.getByRole('button', { name: /send/i });
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(input).toHaveValue('');
        });
    });

    it('should handle keyboard shortcuts', () => {
        renderTeamChat();

        // Test Ctrl+K for search
        fireEvent.keyDown(document, { key: 'k', ctrlKey: true });

        // Verify search modal opens (implementation dependent)
        // This is a placeholder for actual search modal test
    });

    it('should be accessible via keyboard', async () => {
        renderTeamChat();

        await waitFor(() => {
            expect(screen.getByText('General')).toBeInTheDocument();
        });

        // Tab through interactive elements
        const firstChannel = screen.getByText('General').closest('button');
        firstChannel?.focus();

        expect(document.activeElement).toBe(firstChannel);
    });
});
