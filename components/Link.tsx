import React from 'react';
import { navigate, isModifiedClick } from '../hooks/useLocation';

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    to: string;
}

// An internal link: a real <a href>, so middle, Ctrl and Cmd clicks open a new
// tab and the URL can be copied, while a plain click stays in the app.
const Link: React.FC<LinkProps> = ({ to, onClick, ...rest }) => (
    <a
        href={to}
        {...rest}
        onClick={e => {
            onClick?.(e);
            if (e.defaultPrevented || isModifiedClick(e) || rest.target) return;
            e.preventDefault();
            navigate(to);
        }}
    />
);

export default Link;
