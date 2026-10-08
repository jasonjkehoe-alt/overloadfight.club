import { hotDb, coldDb } from '../connection.js';
import { GAME_PLAYERS_COLUMNS, writeHotPlayers, writeColdPlayers } from '../migrations.js';
import { dayBounds } from '../../lib/gameParse.js';

// The games table in both files: lists, search, single games, the writers that keep
// game_players in step, the cold move, and the hydration and fight-night day reads.

// [start, end) of a UTC month ('YYYY-MM') for `date >= ? AND date < ?`,
// which can use idx_games_date. null when monthStr is not 'YYYY-MM'.
function utcMonthBounds(monthStr) {
  if (!/^\d{4}-\d{2}$/.test(monthStr)) return null;
  const [yearStr, monthStrNum] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStrNum, 10);
  if (month < 1 || month > 12) return null;
  const start = `${monthStr}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  return [start, end];
}

const getGamesStmt = hotDb.prepare(`
    SELECT details FROM games 
    ORDER BY date DESC 
    LIMIT ? OFFSET ?
`);

const countGamesStmt = hotDb.prepare('SELECT COUNT(*) as count FROM games');

const searchGamesStmt = hotDb.prepare(`
    SELECT details FROM games
    WHERE
        CAST(id AS TEXT) LIKE @search
        OR json_extract(details, '$.settings.level') LIKE @search
        OR json_extract(details, '$.server.name') LIKE @search
        OR EXISTS (
            SELECT 1 FROM json_each(details, '$.players')
            WHERE json_extract(value, '$.name') LIKE @search
        )
    ORDER BY date DESC
    LIMIT @limit OFFSET @offset
`);

const countSearchGamesStmt = hotDb.prepare(`
    SELECT COUNT(*) as count FROM games
    WHERE
        CAST(id AS TEXT) LIKE @search
        OR json_extract(details, '$.settings.level') LIKE @search
        OR json_extract(details, '$.server.name') LIKE @search
        OR EXISTS (
            SELECT 1 FROM json_each(details, '$.players')
            WHERE json_extract(value, '$.name') LIKE @search
        )
`);

const getGamesFilteredStmt = hotDb.prepare(`
    SELECT details FROM games 
    WHERE date >= ?
    ORDER BY date DESC 
    LIMIT ? OFFSET ?
`);

const countGamesFilteredStmt = hotDb.prepare('SELECT COUNT(*) as count FROM games WHERE date >= ?');

const searchGamesFilteredStmt = hotDb.prepare(`
    SELECT details FROM games
    WHERE
        (date >= @startDate) AND
        (
            CAST(id AS TEXT) LIKE @search
            OR json_extract(details, '$.settings.level') LIKE @search
            OR json_extract(details, '$.server.name') LIKE @search
            OR EXISTS (
                SELECT 1 FROM json_each(details, '$.players')
                WHERE json_extract(value, '$.name') LIKE @search
            )
        )
    ORDER BY date DESC
    LIMIT @limit OFFSET @offset
`);

const countSearchGamesFilteredStmt = hotDb.prepare(`
    SELECT COUNT(*) as count FROM games
    WHERE
        (date >= @startDate) AND
        (
            CAST(id AS TEXT) LIKE @search
            OR json_extract(details, '$.settings.level') LIKE @search
            OR json_extract(details, '$.server.name') LIKE @search
            OR EXISTS (
                SELECT 1 FROM json_each(details, '$.players')
                WHERE json_extract(value, '$.name') LIKE @search
            )
        )
`);

const getHotGameById = hotDb.prepare('SELECT details FROM games WHERE id = ?');
const getColdGameById = coldDb.prepare('SELECT details FROM games WHERE id = ?');

// Cold Storage Queries
const getColdGamesStmt = coldDb.prepare(`
    SELECT details FROM games 
    ORDER BY date DESC 
    LIMIT ? OFFSET ?
`);

const countColdGamesStmt = coldDb.prepare('SELECT COUNT(*) as count FROM games');
const countColdGamesInMonthStmt = coldDb.prepare(`
    SELECT COUNT(*) as count FROM games
    WHERE date >= ? AND date < ?
`);

const searchColdGamesStmt = coldDb.prepare(`
    SELECT details FROM games
    WHERE
        CAST(id AS TEXT) LIKE @search
        OR date LIKE @search
        OR json_extract(details, '$.settings.level') LIKE @search
        OR json_extract(details, '$.settings.matchMode') LIKE @search
        OR json_extract(details, '$.server.name') LIKE @search
        OR EXISTS (
            SELECT 1 FROM json_each(details, '$.players')
            WHERE json_extract(value, '$.name') LIKE @search
        )
    ORDER BY date DESC
    LIMIT @limit OFFSET @offset
`);

const countSearchColdGamesStmt = coldDb.prepare(`
    SELECT COUNT(*) as count FROM games
    WHERE
        CAST(id AS TEXT) LIKE @search
        OR date LIKE @search
        OR json_extract(details, '$.settings.level') LIKE @search
        OR json_extract(details, '$.settings.matchMode') LIKE @search
        OR json_extract(details, '$.server.name') LIKE @search
        OR EXISTS (
            SELECT 1 FROM json_each(details, '$.players')
            WHERE json_extract(value, '$.name') LIKE @search
        )
`);

// Admin/Backfill queries
export const getGameGaps = hotDb.prepare(`
    WITH RECURSIVE seq(n) AS (
        SELECT ? AS n
        UNION ALL
        SELECT n + 1 FROM seq WHERE n < ?
    )
    SELECT n as missing_id FROM seq
    WHERE n NOT IN (SELECT id FROM games)
      AND n NOT IN (SELECT id FROM cold.games)
    LIMIT ?
`);

export const getLatestGameId = hotDb.prepare('SELECT MAX(id) as max_id FROM games');

// Games stored without a kill log (gamelist summaries) that ran over a minute,
// in id order after `afterId`, so a hydration pass never revisits a game.
const getSummaryGamesStmt = hotDb.prepare(`
    SELECT id FROM games
    WHERE id > ?
    AND COALESCE(json_array_length(details, '$.kills'), 0) = 0
    AND duration_of(details) > 60
    ORDER BY id
    LIMIT ?
`);

// saveGames upsert. A gamelist summary carries an empty kill log, so it does not
// replace stored details that have one (a hydrated or archive game). Returns the
// details now stored, which game_players is built from.
const upsertGameSql = `
  INSERT INTO games(id, date, ip, details)
  VALUES(@id, @date, @ip, @details)
  ON CONFLICT(id) DO UPDATE SET
    details = CASE
      WHEN COALESCE(json_array_length(excluded.details, '$.kills'), 0) = 0
        AND COALESCE(json_array_length(games.details, '$.kills'), 0) > 0
      THEN games.details
      ELSE excluded.details
    END,
    date = excluded.date,
    ip = excluded.ip
  RETURNING details
`;
const upsertGameHot = hotDb.prepare(upsertGameSql);
const upsertGameCold = coldDb.prepare(upsertGameSql);

// Hot games in one fight-night day; bind gameParse.js dayBounds().
export const getGamesInDay = hotDb.prepare(`
  SELECT id, date, details FROM games
  WHERE date >= ? AND date < ?
  ORDER BY date ASC
`);

export const getGames = (limit, offset, search, startDate) => {
  if (search) {
    if (startDate) {
      return searchGamesFilteredStmt.all({ limit, offset, search: `%${search}%`, startDate });
    }
    return searchGamesStmt.all({ limit, offset, search: `%${search}%` });
  }
  if (startDate) {
    return getGamesFilteredStmt.all(startDate, limit, offset);
  }
  return getGamesStmt.all(limit, offset);
};

export const countGames = (search, startDate) => {
  if (search) {
    if (startDate) {
      return countSearchGamesFilteredStmt.get({ search: `%${search}%`, startDate });
    }
    return countSearchGamesStmt.get({ search: `%${search}%` });
  }
  if (startDate) {
    return countGamesFilteredStmt.get(startDate);
  }
  return countGamesStmt.get();
};

export const getColdGames = (limit, offset, search) => {
  if (search) {
    return searchColdGamesStmt.all({ limit, offset, search: `%${search}%` });
  }
  return getColdGamesStmt.all(limit, offset);
};

export const countColdGames = (search) => {
  if (search) {
    return countSearchColdGamesStmt.get({ search: `%${search}%` });
  }
  return countColdGamesStmt.get();
};

export const countColdGamesInMonth = (monthStr) => {
  const bounds = utcMonthBounds(monthStr);
  if (!bounds) return 0;
  const row = countColdGamesInMonthStmt.get(bounds[0], bounds[1]);
  return row ? row.count : 0;
};

export const getGameById = {
  get: (id) => {
    const hotGame = getHotGameById.get(id);
    if (hotGame) return hotGame;
    return getColdGameById.get(id);
  }
};

export const insertGame = {
  run: (params) => {
    // Wrapper to route to saveGames logic
    const game = JSON.parse(params.details);
    return saveGames([game]);
  }
};

export const saveGames = (games) => {
  const ONE_YEAR_AGO = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString();

  // Separate games into Hot and Cold
  const hotGames = [];
  const coldGames = [];

  for (const game of games) {
    const gameDate = game.date || game.start || new Date().toISOString();
    if (gameDate >= ONE_YEAR_AGO) {
      hotGames.push(game);
    } else {
      coldGames.push(game);
    }
  }

  // Transaction for Hot DB
  const insertMeta = hotDb.prepare(`
    INSERT OR REPLACE INTO game_metadata(game_id, fetch_status, fetch_attempts, last_fetch_at, error_message)
VALUES(?, ?, ?, ?, ?)
`);

  // Upsert one game and rebuild its game_players rows from the details kept.
  const saveOne = (upsert, writePlayers, game) => {
    const row = {
      id: game.id,
      date: game.date || game.start || new Date().toISOString(),
      ip: game.server?.ip || game.ip || null,
      details: JSON.stringify(game)
    };
    const stored = upsert.get(row).details;
    writePlayers(row.id, row.date, stored === row.details ? game : JSON.parse(stored));
  };

  const transactionHot = hotDb.transaction((gamesList) => {
    let changes = 0;
    for (const game of gamesList) {
      saveOne(upsertGameHot, writeHotPlayers, game);
      changes++;

      insertMeta.run(
        game.id,
        'fetched',
        1,
        new Date().toISOString(),
        null
      );
    }
    return changes;
  });

  // Transaction for Cold DB
  const transactionCold = coldDb.transaction((gamesList) => {
    let changes = 0;
    for (const game of gamesList) {
      saveOne(upsertGameCold, writeColdPlayers, game);
      changes++;
    }
    return changes;
  });

  let totalChanges = 0;
  if (hotGames.length > 0) totalChanges += transactionHot(hotGames);
  if (coldGames.length > 0) totalChanges += transactionCold(coldGames);

  return totalChanges;
};

export const saveColdGamesBatch = (gamesList) => {
  const transaction = coldDb.transaction((list) => {
    let changes = 0;
    for (const game of list) {
      const date = game.date || game.start || new Date().toISOString();
      const details = typeof game.details === 'string' ? game.details : JSON.stringify(game);
      // The upsert keeps a stored kill log over an empty one; build rows from what it kept.
      const stored = upsertGameCold.get({ id: game.id, date, ip: game.ip || game.server?.ip || null, details }).details;
      writeColdPlayers(game.id, date, JSON.parse(stored));
      changes++;
    }
    return changes;
  });

  return transaction(gamesList);
};

export const updateGameDetails = (game) => {
  const ONE_YEAR_AGO = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString();
  const gameDate = game.date || game.start || new Date().toISOString();

  // Determine target DB
  const isHot = gameDate >= ONE_YEAR_AGO;
  const targetDb = isHot ? hotDb : coldDb;
  const writePlayers = isHot ? writeHotPlayers : writeColdPlayers;

  const update = targetDb.prepare(`
    UPDATE games 
    SET details = CASE
      WHEN COALESCE(json_array_length(@details, '$.kills'), 0) = 0
        AND COALESCE(json_array_length(games.details, '$.kills'), 0) > 0
      THEN games.details
      ELSE @details
    END,
    date = @date,
    ip = @ip
    WHERE id = @id
    RETURNING details
`);

  // Metadata only in Hot DB for now? Or both?
  // Let's keep metadata in Hot DB as it tracks fetch status
  const insertMeta = hotDb.prepare(`
    INSERT OR REPLACE INTO game_metadata(game_id, fetch_status, fetch_attempts, last_fetch_at, error_message)
VALUES(?, ?, ?, ?, ?)
`);

  const transaction = targetDb.transaction(() => {
    const details = JSON.stringify(game);
    const kept = update.get({
      id: game.id,
      date: gameDate,
      ip: game.server?.ip || game.ip || null,
      details
    });
    if (kept) writePlayers(game.id, gameDate, kept.details === details ? game : JSON.parse(kept.details));

    // Only update metadata if it's in Hot DB or we want to track it globally
    // For simplicity, we update metadata in Hot DB
    try {
      insertMeta.run(
        game.id,
        'fetched_detail',
        1,
        new Date().toISOString(),
        null
      );
    } catch (e) {
      // Ignore if metadata table doesn't exist in Cold DB (it doesn't)
    }
    return { changes: kept ? 1 : 0 };
  });
  return transaction();
};

// Maintenance: Move old games to cold storage
// Two transactions, in this order, run back to back with nothing in between on
// this connection: copy the games and their game_players rows into cold storage,
// then delete from hot only the games cold storage now holds. Under WAL a commit
// that spans both files is atomic per file only, so a crash could keep one
// half; this order leaves a duplicate at worst, which the next run removes, and
// never a game in neither file.
export const moveGamesToColdStorage = () => {
  const ONE_YEAR_AGO = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString();

  hotDb.transaction(() => {
    // A game cold storage already has keeps its cold copy and rows.
    hotDb.prepare(`
      INSERT INTO cold.game_players (${GAME_PLAYERS_COLUMNS})
      SELECT ${GAME_PLAYERS_COLUMNS} FROM main.game_players
      WHERE game_id IN (SELECT id FROM main.games WHERE date < ? AND id NOT IN (SELECT id FROM cold.games))
    `).run(ONE_YEAR_AGO);
    hotDb.prepare(`
      INSERT OR IGNORE INTO cold.games (id, date, ip, details)
      SELECT id, date, ip, details FROM main.games WHERE date < ?
    `).run(ONE_YEAR_AGO);
  })();

  return hotDb.transaction(() => {
    const moved = 'SELECT id FROM main.games WHERE date < ? AND id IN (SELECT id FROM cold.games)';
    hotDb.prepare(`DELETE FROM main.game_players WHERE game_id IN (${moved})`).run(ONE_YEAR_AGO);
    return hotDb.prepare(`DELETE FROM main.games WHERE id IN (${moved})`).run(ONE_YEAR_AGO).changes;
  })();
};

export const getMaxGameDate = () => {
  try {
    const row = hotDb.prepare('SELECT MAX(date) as max_date FROM games').get();
    return row ? row.max_date : null;
  } catch {
    return null;
  }
};

export const getSummaryGames = {
  all: (afterId, limit) => getSummaryGamesStmt.all(afterId, limit)
};

// Hot games on a fight-night day ('YYYY-MM-DD'); none for anything else.
export const getGamesForDate = (dateStr) => {
  const bounds = dayBounds(dateStr);
  return bounds ? getGamesInDay.all(...bounds) : [];
};
