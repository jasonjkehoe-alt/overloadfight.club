// The match page's wording for a winnerOf() result (server/lib/gameParse.js).
// The sentence lives in server/lib/matchResult.js so the share preview uses it too.
import { winnerOf } from '../server/lib/gameParse.js';

export type MatchResult = ReturnType<typeof winnerOf>;

export { resultLine } from '../server/lib/matchResult.js';
