import React from 'react';

interface SkipLinkProps {
    targetId: string;
    children: React.ReactNode;
}

/**
 * Skip link component for keyboard accessibility
 * Allows users to skip navigation and jump directly to main content
 */
export const SkipLink: React.FC<SkipLinkProps> = ({ targetId, children }) => {
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const target = document.getElementById(targetId);
        if (target) {
            target.focus();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <a
            href={`#${targetId}`}
            onClick={handleClick}
            className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
        >
            {children}
        </a>
    );
};

export default SkipLink;
