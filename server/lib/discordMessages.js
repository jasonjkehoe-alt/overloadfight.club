// The Discord messages (S18): the fight-night recap, the "it's on" ping and the
// admin's test post, as webhook bodies. Links are built from urlFor and the
// site's origin; nothing here reads the database or the webhook URL.
import { SITE_NAME, urlFor } from './siteRoutes.js';
import { RATING, onlineServers } from './gameParse.js';
import { beltChange, count, plural } from './matchResult.js';
import { cardUrl, fightNightCard } from './shareCards.js';

// Discord's limits on an embed (characters; `total` over the title,
// description and every field's name and value).
export const EMBED_LIMITS = { title: 256, fieldName: 256, fieldValue: 1024, fields: 25, total: 6000 };
// The top of the power rankings the recap shows, and the most servers the ping lists.
export const RECAP_RANKINGS = 5;
export const PING_SERVERS = 10;
// The longest pilot name a line holds before it is cut.
const NAME_MAX = 64;
const cutName = name => (name.length > NAME_MAX ? `${name.slice(0, NAME_MAX - 1)}…` : name);

// No message pings anyone, whatever a pilot calls himself.
const NO_MENTIONS = { parse: [] };

// Text from the tracker (pilot, server and map names, the recap's lines) with
// Discord's markdown escaped (the brackets of a masked link included), cut to
// `max` characters.
export function plain(text, max = EMBED_LIMITS.fieldValue) {
    const escaped = String(text ?? '').replace(/[\\*_~`|>#[\]]/g, '\\$&');
    return escaped.length > max ? `${escaped.slice(0, max - 1)}…` : escaped;
}

const embedLength = ({ title = '', description = '', fields = [] }) =>
    title.length + description.length + fields.reduce((sum, f) => sum + f.name.length + f.value.length, 0);

// The embed with fields dropped from the end until it is inside Discord's limits.
function fit(embed) {
    const fields = embed.fields.slice(0, EMBED_LIMITS.fields);
    while (fields.length > 0 && embedLength({ ...embed, fields }) > EMBED_LIMITS.total) fields.pop();
    return { ...embed, fields };
}

// The saved recap's lines, in the order the fight-night page shows them.
const RECAP_LINES = [
    ['headlineBout', 'Headline match'],
    ['biggestUpset', 'Upset'],
    ['biggestBlowout', 'Biggest win'],
    ['closestFinish', 'Closest finish'],
    ['hottestArena', 'Busiest map'],
    ['newBlood', 'New pilots'],
    ['longestStreak', 'Longest streak']
];

// A rank's movement as the rankings page shows it: ▲ places gained, ▼ lost, – none, NEW.
export const movement = change => (change === null ? 'NEW' : change > 0 ? `▲${change}` : change < 0 ? `▼${-change}` : '–');

/**
 * The recap of one fight night: its totals, top pilots and saved lines, the
 * belts that changed hands, the power rankings after it, and the night's
 * share card as the embed's image.
 * @param {object} recap a saved recap (fightNightService.generateRecapForDate)
 * @param {{ day: string, pilots: object[] }} rankings db.getPowerRankings()
 * @param {string} origin "https://overloadfight.club"
 * @param {{ image?: boolean, belts?: object[] }} [options] image: false leaves
 *   the card out (it failed to draw); belts: db.getBeltChanges() for the night
 */
export function recapMessage(recap, rankings, origin, { image = true, belts = [] } = {}) {
    const fields = [];
    const { topFragger, mostActivePilot } = recap;
    if (topFragger?.kills > 0) fields.push({ name: 'Most kills', value: `${plain(topFragger.name, NAME_MAX)}, ${count(topFragger.kills)}`, inline: true });
    if (mostActivePilot?.matches > 0) fields.push({ name: 'Most matches', value: `${plain(mostActivePilot.name, NAME_MAX)}, ${count(mostActivePilot.matches)}`, inline: true });
    for (const [key, name] of RECAP_LINES) {
        if (recap[key]?.copy) fields.push({ name, value: plain(recap[key].copy) });
    }
    if (belts.length > 0) {
        fields.push({
            name: belts.length === 1 ? 'New champion' : 'New champions',
            value: plain(belts.map(b => beltChange({ ...b, name: cutName(b.name), from: b.from && { name: cutName(b.from.name) } })).join('\n'))
        });
    }
    const top = rankings.pilots.slice(0, RECAP_RANKINGS);
    if (top.length > 0) {
        fields.push({
            name: `Power rankings on ${rankings.day} (▲▼ over ${RATING.movementDays} days)`,
            value: top.map(p => `${p.rank}. ${plain(p.name, NAME_MAX)} ${Math.round(p.rating)} ${movement(p.change)}`).join('\n')
        });
    }
    // the night's share card: its page, its sentence of totals and its image
    const card = fightNightCard(recap);
    return {
        allowed_mentions: NO_MENTIONS,
        embeds: [fit({
            title: plain(`Fight Night: ${recap.formattedDate}`, EMBED_LIMITS.title),
            url: `${origin}${card.path}`,
            description: card.line,
            fields,
            ...(image ? { image: { url: `${origin}${cardUrl(card)}` } } : {})
        })]
    };
}

/**
 * The "it's on" ping: the pilots in the server browser, the servers they are
 * on (most pilots first) and a link to the live page.
 * @param {object[]} servers one server-browser answer
 * @param {string} origin
 */
export function pingMessage(servers, origin) {
    const busy = onlineServers(servers)
        .filter(({ row }) => row.players > 0)
        .sort((a, b) => b.row.players - a.row.players);
    const pilots = busy.reduce((sum, { row }) => sum + row.players, 0);
    const fields = busy.slice(0, PING_SERVERS).map(({ entry, row }) => {
        const { mapName, mode, inLobby } = entry.game;
        const seats = row.max_players ? `${count(row.players)} of ${count(row.max_players)} pilots` : plural(row.players, 'pilot', 'pilots');
        const what = inLobby ? 'in the lobby' : [mode && plain(mode, 64), mapName && `on ${plain(mapName, 128)}`].filter(Boolean).join(' ');
        return { name: plain(entry.server.name || row.ip, EMBED_LIMITS.fieldName), value: what ? `${seats}, ${what}` : seats };
    });
    const more = busy.length - fields.length;
    return {
        allowed_mentions: NO_MENTIONS,
        content: `It's on: ${plural(pilots, 'pilot', 'pilots')} in the server browser.`,
        embeds: [fit({
            title: 'Live servers',
            url: `${origin}${urlFor('dashboard')}`,
            description: `${plural(pilots, 'pilot', 'pilots')} on ${plural(busy.length, 'server', 'servers')}${more > 0 ? `; the ${plural(more, 'server', 'servers')} with the fewest are not listed` : ''}.`,
            fields
        })]
    };
}

// The admin's test post.
export const testMessage = () => ({
    allowed_mentions: NO_MENTIONS,
    content: `Test post from ${SITE_NAME}. Fight-night recaps and the "it's on" ping will post to this channel.`
});
