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

// A table row's cells link to the row's page, so a click on any of them opens
// it. A <tr> cannot be a link, and Safari does not position a covering link
// against one. Only the `main` cell's link takes focus; Tab skips the others.
export const CellLink: React.FC<LinkProps> = ({ className = '', ...rest }) => (
    <Link tabIndex={-1} className={`block ${className}`} {...rest} />
);

// A <td> holding a CellLink; the padding goes on the link so all of it is clickable.
export const LinkCell: React.FC<LinkProps & { main?: boolean }> = ({ main, ...rest }) => (
    <td className="p-0">{main ? <Link {...rest} className={`block ${rest.className ?? ''}`} /> : <CellLink {...rest} />}</td>
);

export default Link;
