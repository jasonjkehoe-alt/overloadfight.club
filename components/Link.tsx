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

// A <td> holding a CellLink; the padding goes on the link and the link fills
// the row's height (`h-px` on the cell lets `h-full` resolve), so all of the
// cell is clickable. `content-center` keeps the content in the middle.
// `cellClassName` goes on the <td> (to hide a column at some widths).
export const LinkCell: React.FC<LinkProps & { main?: boolean; cellClassName?: string }> = ({ main, className = '', cellClassName = '', ...rest }) => (
    <td className={`p-0 h-px ${cellClassName}`}>{main ? <Link {...rest} className={`block h-full content-center ${className}`} /> : <CellLink {...rest} className={`h-full content-center ${className}`} />}</td>
);

export default Link;
