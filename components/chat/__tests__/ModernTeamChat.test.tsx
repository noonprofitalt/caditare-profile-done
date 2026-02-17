import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ModernTeamChat from '../ModernTeamChat';

// Mock Auth context
vi.mock('../../../context/AuthContext', () => ({
    useAuth: vi.fn().mockReturnValue({
        user: { id: 'test-user-id', name: 'Test User', role: 'Admin' },
        isAuthenticated: true,
        isLoading: false
    })
}));

// Mock services
vi.mock('../../../services/chatService', () => ({
    ChatService: {
        getChannels: vi.fn().mockResolvedValue([
            { id: 'c1', name: 'General', type: 'public', unreadCount: 0 },
            { id: 'c2', name: 'Random', type: 'public', unreadCount: 2 },
        ]),
        getMessages: vi.fn().mockResolvedValue({
            messages: [
                {
                    id: 'msg-1',
                    channelId: 'c1',
                    text: 'Hello world',
                    senderId: 'u1',
                    senderName: 'John Doe',
                    timestamp: new Date().toISOString(),
                    isMe: false
                },
            ],
            hasMore: false
        }),
        getUsers: vi.fn().mockResolvedValue([
            { id: 'u1', name: 'John Doe', status: 'online' },
            { id: 'u2', name: 'Jane Smith', status: 'offline' }
        ]),
        sendMessage: vi.fn().mockImplementation(async (channelId, text) => ({
            id: `msg-${Date.now()}`,
            channelId,
            text,
            senderId: 'current-user',
            senderName: 'You',
            timestamp: new Date().toISOString(),
            isMe: true
        })),
        createChannel: vi.fn().mockResolvedValue({ id: 'c3', name: 'new-channel', type: 'public', unreadCount: 0 }),
        getDmChannelId: vi.fn().mockReturnValue('dm-u1'),
        getChannelDisplay: vi.fn().mockReturnValue({ name: '# General', isUser: false }),
        on: vi.fn(),
        off: vi.fn(),
        subscribeToMessages: vi.fn().mockReturnValue(() => { }),
    }
}));

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

describe('ModernTeamChat Component', () => {
    const renderChat = () => {
        return render(
            <BrowserRouter>
                <ModernTeamChat />
            </BrowserRouter>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render the chat layout', async () => {
        renderChat();
        expect(await screen.findByText('Team Chat')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Jump to...')).toBeInTheDocument();
    });

    it('should display channels list', async () => {
        renderChat();
        expect(await screen.findByText('General')).toBeInTheDocument();
        expect(screen.getByText('Random')).toBeInTheDocument();
    });

    it('should show unread count badge', async () => {
        renderChat();
        const badge = await screen.findByText('2');
        expect(badge).toBeInTheDocument();
    });

    it('should allow sending a message', async () => {
        renderChat();

        // Wait for potential loading state
        await screen.findByText('General');

        const input = screen.getByPlaceholderText('Message...');
        fireEvent.change(input, { target: { value: 'New message' } });

        // Find the send button. It's the button inside the input area.
        const buttons = screen.getAllByRole('button');
        // Filter for the one with the Send icon (which is usually the last one in the DOM in this layout)
        const sendButton = buttons[buttons.length - 1];

        expect(sendButton).not.toBeDisabled();

        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(input).toHaveValue('');
        });
    });

    it('should show channel creation modal', async () => {
        renderChat();

        // The new button is the "plus" icon in the sidebar header. 
        // We can find it by the SVG or just get the first button in the sidebar.
        // Or better, let's update the sidebar code to have a title or accessible name if it failed before.
        // Assuming I can't update sidebar right now, let's try to finding buttons.
        const buttons = screen.getAllByRole('button');
        // The first one is typically the create channel button in the sidebar header
        const createButton = buttons[0];

        fireEvent.click(createButton);

        expect(await screen.findByText('Create a new channel')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. marketing-team')).toBeInTheDocument();
    });
});
