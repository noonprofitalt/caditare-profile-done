import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeamChat from '../TeamChat';

// Mock services
vi.mock('../../services/chatService', () => {
    const mockChatService = {
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
        getUsers: vi.fn().mockResolvedValue([]),
        sendMessage: vi.fn().mockResolvedValue({ id: 'new-msg' }),
        getDmChannelId: vi.fn().mockReturnValue('dm-1'),
        getChannelDisplay: vi.fn().mockReturnValue({ name: 'General', isUser: false }),
    };
    return {
        ChatService: mockChatService,
        default: mockChatService,
    };
});

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
            const generalChannels = screen.getAllByText('General');
            expect(generalChannels.length).toBeGreaterThan(0);
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
            const generalChannels = screen.getAllByText('General');
            expect(generalChannels.length).toBeGreaterThan(0);
        });

        const input = screen.getByPlaceholderText(/Message General/i);
        fireEvent.change(input, { target: { value: 'Test message' } });

        const sendButton = screen.getByRole('button', { name: /Send message/i });
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
            const generalChannels = screen.getAllByText('General');
            expect(generalChannels.length).toBeGreaterThan(0);
        });

        // Tab through interactive elements
        const generalChannels = screen.getAllByText('General');
        const firstChannel = generalChannels[0].closest('button');
        firstChannel?.focus();

        expect(document.activeElement).toBe(firstChannel);
    });
});
