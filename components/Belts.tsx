import React, { useMemo } from 'react';
import { Award } from 'lucide-react';
import { Loading, EmptyState, ErrorState } from './States';
import Link from './Link';
import BeltLineage from './belts/BeltLineage';
import AchievementList from './belts/AchievementList';
import { urlFor } from '../server/lib/siteRoutes.js';
import { ACHIEVEMENT_HINT, BELT_HINT, FIGHT_NIGHT_DAY_TEXT } from '../server/lib/gameParse.js';
import { dayLabel, plural } from '../server/lib/matchResult.js';
import { Belts as BeltsAnswer, fetchBelts } from '../services/apiService';
import { useLoad } from '../hooks/useLoad';

type Mode = BeltsAnswer['modes'][number];

// A mode's champion: who holds the belt, since when, for how many days, their
// defenses and who they took it from; "Vacant" before the mode's first
// decisive match.
const ChampionCard: React.FC<{ mode: Mode }> = ({ mode: { mode, label, holder } }) => (
    <div className={`bg-surface-card border rounded-card p-4 min-w-0 ${holder ? 'border-brand/40' : 'border-line'}`} data-mode={mode}>
        <div className="text-2xs uppercase tracking-wider font-bold text-brand flex items-center gap-1.5"><Award size={12} aria-hidden /> {label}</div>
        {holder ? (
            <>
                <Link to={urlFor('pilot', holder.name)} className="block mt-1 text-xl sm:text-2xl font-black text-white hover:underline truncate brand-font" title={`Open ${holder.name}'s page`}>{holder.name}</Link>
                <p className="text-xs font-mono text-gray-400 mt-2">
                    Since {dayLabel(holder.since)}: {plural(holder.days, 'day', 'days')}, <span className="text-brand font-bold">{plural(holder.defenses, 'defense', 'defenses')}</span>
                </p>
                <p className="text-xs font-mono text-gray-500 mt-1">
                    {holder.from ? <>Took it from <Link to={urlFor('pilot', holder.from.name)} className="text-gray-300 hover:text-brand">{holder.from.name}</Link></> : 'The first champion'}
                    {' '}in <Link to={urlFor('game-detail', holder.game)} className="underline decoration-gray-700 hover:text-brand">match {holder.game}</Link>.
                </p>
            </>
        ) : (
            <>
                <div className="mt-1 text-xl sm:text-2xl font-black text-gray-600 brand-font">Vacant</div>
                <p className="text-xs font-mono text-gray-500 mt-2">No rated {label} match has had an outright winner yet.</p>
            </>
        )}
    </div>
);

// /belts (S21): each mode's lineal champion and line of holders, and every
// achievement with how many pilots hold each tier. The stats refresh decides
// both; this page only reads them.
const Belts: React.FC = () => {
    const { data, failed, retry } = useLoad(fetchBelts, []);
    const pilots = useMemo(() => new Map(data?.achievements.map(a => [a.id, a.pilots]) ?? []), [data]);

    let body: React.ReactNode;
    if (failed) {
        body = <ErrorState title="Belts unavailable" message="Could not load the belts." onRetry={retry} />;
    } else if (!data) {
        body = <Loading label="Loading the belts..." />;
    } else {
        const decided = data.modes.filter(m => m.reigns > 0);
        body = (
            <>
                <section aria-labelledby="belts-champions" className="space-y-3">
                    <h2 id="belts-champions" className="text-gray-500 font-bold text-xs uppercase tracking-widest">Champions</h2>
                    {decided.length === 0 ? (
                        <EmptyState card icon={Award} title="No champion yet" message="No rated match has had an outright winner yet, so every belt is vacant." />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {data.modes.map(m => <ChampionCard key={m.mode} mode={m} />)}
                        </div>
                    )}
                </section>

                {decided.length > 0 && (
                    <section aria-labelledby="belts-lineage" className="space-y-3">
                        <h2 id="belts-lineage" className="text-gray-500 font-bold text-xs uppercase tracking-widest">Line of holders</h2>
                        <p className="text-xs font-mono text-gray-500">Fight-night days ({FIGHT_NIGHT_DAY_TEXT}); each links to the match that started or ended the reign.</p>
                        {decided.map(m => <BeltLineage key={m.mode} label={m.label} reigns={m.reigns} lineage={m.lineage} />)}
                    </section>
                )}

                <section aria-labelledby="belts-achievements" className="space-y-3">
                    <h2 id="belts-achievements" className="text-gray-500 font-bold text-xs uppercase tracking-widest">Achievements</h2>
                    <p className="text-xs font-mono text-gray-500 max-w-3xl">{ACHIEVEMENT_HINT} A pilot's page shows their own, and how far they are from the next tier.</p>
                    <AchievementList pilots={pilots} />
                </section>
            </>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-surface-raised to-black p-5 sm:p-8 rounded-card border border-line">
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 brand-font">Belts</h1>
                <p className="text-gray-400 max-w-2xl text-sm font-mono">The champion of each mode, and the achievements pilots earn{data ? <>, as of {data.day}</> : null}.</p>
                <p className="text-gray-500 max-w-2xl text-xs font-mono mt-2">{BELT_HINT}</p>
            </div>
            {body}
            <div className="text-xs font-mono text-gray-500 flex flex-wrap gap-4">
                <Link to={urlFor('rankings')} className="text-brand hover:text-brand-hover underline">Power rankings</Link>
                <Link to={urlFor('pilots')} className="text-brand hover:text-brand-hover underline">Leaderboard</Link>
                {data && <span>{plural(data.modes.reduce((n, m) => n + m.reigns, 0), 'reign', 'reigns')} in all</span>}
            </div>
        </div>
    );
};

export default Belts;
