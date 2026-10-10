import React, { memo } from 'react';
import { Award } from 'lucide-react';
import { Loading, ErrorState } from '../States';
import Link from '../Link';
import TierPips, { tierName } from '../belts/TierPips';
import { urlFor } from '../../server/lib/siteRoutes.js';
import { ACHIEVEMENTS, ACHIEVEMENT_HINT, TIERS } from '../../server/lib/gameParse.js';
import { championLine, count, dayLabel, plural } from '../../server/lib/matchResult.js';
import { BeltReign, PilotAchievement, PilotAchievements } from '../../services/apiService';

const BY_ID = new Map(ACHIEVEMENTS.map(a => [a.id, a]));

// A reign the pilot held: the belt they hold now, or one they lost.
const Reign: React.FC<{ reign: BeltReign }> = ({ reign }) => (
    <li className={`flex items-start gap-2 text-sm font-mono ${reign.until ? 'text-gray-400' : 'text-white'}`}>
        <Award size={14} className={`mt-0.5 shrink-0 ${reign.until ? 'text-gray-600' : 'text-brand'}`} aria-hidden />
        <span>
            {reign.until
                ? <>{reign.label} champion from {dayLabel(reign.since)} to <Link to={urlFor('game-detail', reign.lost_game ?? reign.game)} className="underline decoration-gray-700 hover:text-brand">{dayLabel(reign.until)}</Link>, {plural(reign.defenses, 'defense', 'defenses')}</>
                : <><strong className="text-brand">{championLine(reign)}</strong> ({plural(reign.days, 'day', 'days')})</>}
        </span>
    </li>
);

// One achievement: earned ones with their tier and the day and match the tier
// came on; the rest greyed. Below the top tier, the progress to the next one.
const Tile: React.FC<{ a: PilotAchievement }> = ({ a }) => {
    const def = BY_ID.get(a.id)!;
    const earned = a.tier > 0;
    const share = a.next ? Math.min(1, a.value / a.next) : 1;
    return (
        <li className={`bg-surface-raised border rounded-card p-3 min-w-0 ${earned ? 'border-brand/40' : 'border-line opacity-70'}`} data-achievement={a.id} data-tier={a.tier}>
            <div className="flex items-center justify-between gap-2">
                <span className={`font-bold brand-font truncate ${earned ? 'text-white' : 'text-gray-400'}`}>{def.name}</span>
                <span className="flex items-center gap-1.5 text-2xs uppercase font-bold text-gray-400 shrink-0"><TierPips tier={a.tier} />{tierName(a.tier)}</span>
            </div>
            <p className="text-xs font-mono text-gray-400 mt-1">
                {a.next ? `${count(a.value)} of ${count(a.next)}` : count(a.value)} {def.counts}
            </p>
            {a.next !== null && (
                <div className="h-1.5 mt-2 rounded-full bg-surface-card overflow-hidden" role="presentation">
                    <div className="h-full bg-brand" style={{ width: `${Math.round(share * 100)}%` }} />
                </div>
            )}
            {earned && a.earned && (
                <p className="text-2xs font-mono text-gray-500 mt-2">
                    {tierName(a.tier)} on {a.game ? <Link to={urlFor('game-detail', a.game)} className="underline decoration-gray-700 hover:text-brand">{dayLabel(a.earned)}</Link> : dayLabel(a.earned)}
                </p>
            )}
        </li>
    );
};

// The pilot's belts and achievements (S21), from /api/pilot/:name/achievements:
// the belts they hold and held (nothing for a pilot who never held one), then
// every achievement, the ones not yet earned greyed with their progress.
const AchievementsCard: React.FC<{ load: { data: PilotAchievements | null; failed: boolean; retry: () => void } }> = ({ load: { data, failed, retry } }) => {
    let body: React.ReactNode;
    if (failed) {
        body = <ErrorState compact title="Achievements unavailable" message="Could not load the belts and achievements." onRetry={retry} />;
    } else if (!data) {
        body = <Loading compact label="Loading achievements..." />;
    } else {
        const earned = data.achievements.reduce((n, a) => n + a.tier, 0);
        body = (
            <>
                {data.belts.length > 0 && <ul className="space-y-1.5 mb-4">{data.belts.map(r => <Reign key={`${r.mode}:${r.reign}`} reign={r} />)}</ul>}
                <p className="text-xs font-mono text-gray-400 mb-3">{plural(earned, 'tier', 'tiers')} earned of {count(ACHIEVEMENTS.length * TIERS.length)}.</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">{data.achievements.map(a => <Tile key={a.id} a={a} />)}</ul>
                <p className="text-2xs text-gray-500 mt-3">{ACHIEVEMENT_HINT} <Link to={urlFor('belts')} className="text-brand hover:text-brand-hover underline">Belts and every achievement</Link></p>
            </>
        );
    }
    return (
        <section className="bg-surface-card border border-line p-4 rounded-card" aria-labelledby="pilot-achievements-title">
            <h3 id="pilot-achievements-title" className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"><Award size={14} className="text-brand" aria-hidden /> Belts and achievements</h3>
            {body}
        </section>
    );
};

// memo: the pilot page re-renders on every mode change
export default memo(AchievementsCard);
