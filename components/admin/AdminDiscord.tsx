import React from 'react';
import { MessageSquare, RefreshCw, Send } from 'lucide-react';
import { EmptyState, ErrorState, Loading, secondaryButtonClass } from '../States';
import type { DiscordPost, useAdminDiscord } from '../../hooks/useAdminDiscord';

const KIND_LABEL: Record<DiscordPost['kind'], string> = { ping: 'It\'s on', recap: 'Recap' };
const STATUS_LABEL: Record<DiscordPost['status'], string> = { sent: 'Sent', pending: 'Waiting to retry', dropped: 'Dropped' };
const STATUS_CLASS: Record<DiscordPost['status'], string> = { sent: 'text-green-400', pending: 'text-yellow-400', dropped: 'text-red-400' };

interface AdminDiscordProps {
    discord: ReturnType<typeof useAdminDiscord>;
}

// The Discord webhook (S18): the URL masked or how to set it, the on/off
// switch, a test post and the latest posts.
const AdminDiscord: React.FC<AdminDiscordProps> = ({ discord }) => {
    const { status, failed, saveFailed, testing, testResult, fetchDiscord, setEnabled, sendTest } = discord;

    return (
        <section className="mt-8 max-w-2xl bg-surface-card border border-line rounded-card p-4 sm:p-6" aria-labelledby="admin-discord-title">
            <h3 id="admin-discord-title" className="text-xl font-bold mb-1 flex items-center gap-2">
                <MessageSquare className="text-brand" aria-hidden /> Discord
            </h3>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                Posts each fight night's recap after the 06:15 check, and an "it's on" message once a fight-night day when the server browser shows {status?.pingPilots ?? 6} or more pilots.
            </p>

            {failed ? (
                <ErrorState compact title="Could not load the Discord settings" onRetry={fetchDiscord} />
            ) : !status ? (
                <Loading compact label="Loading Discord settings..." />
            ) : (
                <div className="space-y-4">
                    <div className="bg-surface-raised border border-line rounded-control p-4">
                        <p className="font-bold text-white text-sm">Webhook URL</p>
                        {status.configured ? (
                            <p className="text-xs text-gray-300 font-mono break-all mt-1">{status.webhook}</p>
                        ) : (
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                Not set. Put <code className="font-mono text-gray-200">DISCORD_WEBHOOK_URL</code> in the server's <code className="font-mono text-gray-200">.env</code> and restart it.
                            </p>
                        )}
                        <p className="text-2xs text-gray-500 mt-2 break-all">Links in the posts open {status.siteUrl}.</p>
                    </div>

                    <div className="flex items-center justify-between gap-4 bg-surface-raised border border-line rounded-control p-4">
                        <div>
                            <p id="admin-discord-switch" className="font-bold text-white text-sm">Post to Discord</p>
                            <p className="text-xs text-gray-400">{!status.configured ? (status.enabled ? 'On, but nothing posts until a webhook URL is set.' : 'Set the webhook URL first.') : status.enabled ? 'On: recaps and the ping post to the channel.' : 'Off: nothing posts.'}</p>
                        </div>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={status.enabled}
                            aria-labelledby="admin-discord-switch"
                            disabled={!status.configured && !status.enabled}
                            onClick={() => setEnabled(!status.enabled)}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${status.enabled ? 'bg-brand' : 'bg-gray-600'}`}
                        >
                            <span aria-hidden className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${status.enabled ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                        </button>
                    </div>
                    {saveFailed && <p role="alert" className="text-xs text-red-400">Could not save the switch. Try again.</p>}

                    <div className="flex flex-wrap items-center gap-3">
                        <button type="button" onClick={sendTest} disabled={!status.configured || testing} className={`${secondaryButtonClass} disabled:opacity-40 disabled:cursor-not-allowed`}>
                            <Send className="w-4 h-4" aria-hidden /> {testing ? 'Sending...' : 'Send test post'}
                        </button>
                        <p role="status" className={`text-xs ${testResult?.ok ? 'text-green-400' : 'text-red-400'}`}>
                            {testResult && (testResult.ok ? 'Test post sent.' : testResult.message)}
                        </p>
                    </div>

                    <div>
                        <div className="flex items-center justify-between gap-4 mb-2">
                            <p className="font-bold text-white text-sm">Latest posts</p>
                            <button type="button" onClick={fetchDiscord} className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-white rounded-control">
                                <RefreshCw className="w-3 h-3" aria-hidden /> Refresh
                            </button>
                        </div>
                        {status.posts.length === 0 ? (
                            <EmptyState compact title="No posts yet" message="A recap or an &quot;it's on&quot; message shows up here once one has been tried." />
                        ) : (
                            <ul className="divide-y divide-line border border-line rounded-control text-xs">
                                {status.posts.map(post => (
                                    <li key={`${post.kind} ${post.key}`} className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-3 py-2">
                                        <span className="text-gray-200">{KIND_LABEL[post.kind]} <span className="font-mono text-gray-400">{post.key}</span></span>
                                        <span>
                                            <span className={STATUS_CLASS[post.status]}>{STATUS_LABEL[post.status]}</span>
                                            <span className="text-gray-500"> · {post.tries} {post.tries === 1 ? 'try' : 'tries'} · {new Date(post.updated_at).toLocaleString()}</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
};

export default AdminDiscord;
