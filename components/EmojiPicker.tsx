import React, { useState, useRef } from 'react';

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    onClose: () => void;
}

const COMMON_EMOJIS = [
    '👍', '❤️', '😊', '😂', '🎉', '🔥', '👏', '✅',
    '😍', '🤔', '😎', '🙌', '💯', '⭐', '✨', '🚀',
    '👀', '💪', '🎯', '📌', '💡', '⚡', '🌟', '💼',
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
    const pickerRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={pickerRef}
            className="emoji-picker"
            style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                marginBottom: '8px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '12px',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                zIndex: 1000,
                width: '280px',
            }}
        >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
                {COMMON_EMOJIS.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => {
                            onEmojiSelect(emoji);
                            onClose();
                        }}
                        style={{
                            fontSize: '24px',
                            padding: '8px',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            borderRadius: '6px',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default EmojiPicker;
