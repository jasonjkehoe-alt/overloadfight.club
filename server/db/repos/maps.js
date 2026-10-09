import path from 'path';
import { hotDb, mapImagesDir } from '../connection.js';
import '../migrations.js';

// The maps table: the stock map seed, the library list and intel (joined with
// map_stats_cache, which analytics/refresh.js writes), and the admin writers.

const STOCK_MAPS = [
  {
    name: 'Vault',
    author: 'Revival Productions',
    size: 'medium',
    max_players: 6,
    best_team_size: 3,
    supports_ctf: 1,
    style: 'organic',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Vault_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Terminal',
    author: 'Revival Productions',
    size: 'small',
    max_players: 4,
    best_team_size: 2,
    supports_ctf: 1,
    style: 'mixed',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Terminal_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Wraith',
    author: 'Revival Productions',
    size: 'small',
    max_players: 4,
    best_team_size: 2,
    supports_ctf: 1,
    style: 'tech',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Wraith_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Blizzard',
    author: 'Revival Productions',
    size: 'small',
    max_players: 4,
    best_team_size: 2,
    supports_ctf: 1,
    style: 'mixed',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Blizzard_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Backfire',
    author: 'Revival Productions',
    size: 'large',
    max_players: 8,
    best_team_size: 4,
    supports_ctf: 1,
    style: 'mixed',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Backfire_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Syrinx',
    author: 'Revival Productions',
    size: 'medium',
    max_players: 8,
    best_team_size: 4,
    supports_ctf: 1,
    style: 'mixed',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Syrinx_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Centrifuge',
    author: 'Revival Productions',
    size: 'small',
    max_players: 6,
    best_team_size: 3,
    supports_ctf: 1,
    style: 'tech',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Centrifuge_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Hive',
    author: 'Revival Productions',
    size: 'small',
    max_players: 6,
    best_team_size: 3,
    supports_ctf: 1,
    style: 'mixed',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Hive_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Roundabout',
    author: 'Revival Productions',
    size: 'gigantic',
    max_players: 10,
    best_team_size: 5,
    supports_ctf: 1,
    style: 'mixed',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Roundabout_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Foundry',
    author: 'Revival Productions',
    size: 'small',
    max_players: 4,
    best_team_size: 2,
    supports_ctf: 1,
    style: 'tech',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Foundry_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Labyrinth',
    author: 'Revival Productions',
    size: 'large',
    max_players: 8,
    best_team_size: 4,
    supports_ctf: 1,
    style: 'organic',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Labyrinth_01small.jpg',
    is_custom: 0
  },
  {
    name: 'Chimp',
    author: 'Revival Productions',
    size: 'small',
    max_players: 4,
    best_team_size: 2,
    supports_ctf: 1,
    style: 'tech',
    release_date: '2018-05-31',
    remote_image_url: 'https://www.omdb.net/thumbs/Chimp_01small.jpg',
    is_custom: 0
  }
];

export const seedStockMaps = () => {
  try {
    const stmt = hotDb.prepare(`
      INSERT INTO maps (
        name, author, size, max_players, best_team_size, supports_ctf, style,
        release_date, remote_image_url, is_custom, updated_at
      ) VALUES (
        @name, @author, @size, @max_players, @best_team_size, @supports_ctf, @style,
        @release_date, @remote_image_url, @is_custom, CURRENT_TIMESTAMP
      )
      ON CONFLICT(name) DO UPDATE SET
        author = excluded.author,
        is_custom = 0,
        remote_image_url = COALESCE(maps.remote_image_url, excluded.remote_image_url),
        style = COALESCE(maps.style, excluded.style),
        updated_at = CURRENT_TIMESTAMP
    `);

    hotDb.transaction(() => {
      for (const m of STOCK_MAPS) {
        stmt.run(m);
      }
    })();
    console.log(`[Maps] Seeded ${STOCK_MAPS.length} official Revival Productions stock maps into maps table.`);

    // Guarantee custom vs stock separation
    hotDb.exec(`
      UPDATE maps 
      SET is_custom = 1 
      WHERE LOWER(author) NOT LIKE '%revival%' 
        AND name NOT IN ('Vault', 'Terminal', 'Wraith', 'Blizzard', 'Backfire', 'Syrinx', 'Centrifuge', 'Hive', 'Roundabout', 'Foundry', 'Labyrinth', 'Chimp');
      UPDATE maps 
      SET is_custom = 0 
      WHERE LOWER(author) LIKE '%revival%' 
         OR name IN ('Vault', 'Terminal', 'Wraith', 'Blizzard', 'Backfire', 'Syrinx', 'Centrifuge', 'Hive', 'Roundabout', 'Foundry', 'Labyrinth', 'Chimp');
    `);
  } catch (err) {
    console.error('Failed to seed stock maps:', err);
  }
};

export const getMaps = ({ search, size, type, limit = 500, offset = 0, sortBy = 'popularity' } = {}) => {
  let sql = `
    SELECT 
      m.*,
      COALESCE(s.total_matches, 0) as total_matches,
      COALESCE(s.total_kills, 0) as total_kills,
      COALESCE(s.total_deaths, 0) as total_deaths,
      COALESCE(s.total_damage, 0) as total_damage,
      COALESCE(s.avg_players, 0) as avg_players,
      COALESCE(s.recent_30d_matches, 0) as recent_30d_matches,
      s.first_played,
      s.last_played,
      s.top_pilot,
      s.record_match
    FROM maps m
    LEFT JOIN map_stats_cache s ON LOWER(m.name) = LOWER(s.map_name)
    WHERE 1=1
  `;
  const params = {};
  if (search && search.trim()) {
    sql += ' AND (m.name LIKE @search OR m.author LIKE @search)';
    params.search = `%${search.trim()}%`;
  }
  if (size && size !== 'all') {
    sql += ' AND m.size = @size';
    params.size = size.toLowerCase();
  }
  if (type === 'stock') {
    sql += ' AND m.is_custom = 0';
  } else if (type === 'custom') {
    sql += ' AND m.is_custom = 1';
  }

  if (sortBy === 'popularity' || sortBy === 'sorties') {
    sql += ' ORDER BY COALESCE(s.total_matches, 0) DESC, m.name ASC';
  } else if (sortBy === 'deadliest' || sortBy === 'kills') {
    sql += ' ORDER BY COALESCE(s.total_kills, 0) DESC, m.name ASC';
  } else if (sortBy === 'recent') {
    sql += ' ORDER BY COALESCE(s.last_played, "") DESC, m.name ASC';
  } else if (sortBy === 'downloads') {
    sql += ' ORDER BY m.downloads DESC, m.name ASC';
  } else if (sortBy === 'date') {
    sql += ' ORDER BY m.release_date DESC, m.name ASC';
  } else {
    sql += ' ORDER BY m.name COLLATE NOCASE ASC';
  }
  sql += ' LIMIT @limit OFFSET @offset';
  params.limit = limit;
  params.offset = offset;
  return hotDb.prepare(sql).all(params);
};

export const countMaps = ({ search, size, type } = {}) => {
  let sql = 'SELECT COUNT(*) as count FROM maps m WHERE 1=1';
  const params = {};
  if (search && search.trim()) {
    sql += ' AND (m.name LIKE @search OR m.author LIKE @search)';
    params.search = `%${search.trim()}%`;
  }
  if (size && size !== 'all') {
    sql += ' AND m.size = @size';
    params.size = size.toLowerCase();
  }
  if (type === 'stock') {
    sql += ' AND m.is_custom = 0';
  } else if (type === 'custom') {
    sql += ' AND m.is_custom = 1';
  }
  return hotDb.prepare(sql).get(params).count;
};

export const getMapIntel = (idOrName) => {
  let sql;
  let param;
  if (typeof idOrName === 'number' || /^\d+$/.test(idOrName)) {
    sql = `
      SELECT 
        m.*,
        s.total_matches, s.total_kills, s.total_deaths, s.total_damage,
        s.avg_players, s.recent_30d_matches, s.first_played, s.last_played,
        s.modes, s.top_pilot, s.top_pilots, s.record_match
      FROM maps m
      LEFT JOIN map_stats_cache s ON LOWER(m.name) = LOWER(s.map_name)
      WHERE m.id = ?
    `;
    param = parseInt(idOrName, 10);
  } else {
    sql = `
      SELECT 
        m.*,
        s.total_matches, s.total_kills, s.total_deaths, s.total_damage,
        s.avg_players, s.recent_30d_matches, s.first_played, s.last_played,
        s.modes, s.top_pilot, s.top_pilots, s.record_match
      FROM maps m
      LEFT JOIN map_stats_cache s ON LOWER(m.name) = LOWER(s.map_name)
      WHERE LOWER(m.name) = LOWER(?)
    `;
    param = String(idOrName).trim();
  }

  let map = hotDb.prepare(sql).get(param);
  if (!map) {
    const statsOnly = hotDb.prepare('SELECT * FROM map_stats_cache WHERE LOWER(map_name) = LOWER(?)').get(param);
    if (statsOnly) {
      map = {
        id: 0,
        name: statsOnly.map_name,
        author: 'Unknown',
        size: 'medium',
        max_players: 8,
        best_team_size: 4,
        supports_ctf: 0,
        style: 'mixed',
        is_custom: 1,
        total_matches: statsOnly.total_matches,
        total_kills: statsOnly.total_kills,
        total_deaths: statsOnly.total_deaths,
        total_damage: statsOnly.total_damage,
        avg_players: statsOnly.avg_players,
        recent_30d_matches: statsOnly.recent_30d_matches,
        first_played: statsOnly.first_played,
        last_played: statsOnly.last_played,
        modes: statsOnly.modes,
        top_pilot: statsOnly.top_pilot,
        top_pilots: statsOnly.top_pilots,
        record_match: statsOnly.record_match
      };
    }
  }

  if (!map) return null;

  return {
    id: map.id,
    name: map.name,
    author: map.author,
    size: map.size,
    maxPlayers: map.max_players,
    bestTeamSize: map.best_team_size,
    supportsCTF: !!map.supports_ctf,
    style: map.style,
    date: map.release_date || '',
    image: map.id ? `/api/maps/${map.id}/image` : null,
    downloadLink: map.id ? `/api/maps/${map.id}/download` : null,
    downloads: map.downloads || 0,
    fileSize: map.file_size || 0,
    isCustom: !!map.is_custom,
    isStock: !map.is_custom && (map.author?.toLowerCase().includes('revival') || false),
    sorties: map.total_matches || 0,
    totalKills: map.total_kills || 0,
    totalDeaths: map.total_deaths || 0,
    totalDamage: map.total_damage || 0,
    avgPlayers: map.avg_players || 0,
    recent30d: map.recent_30d_matches || 0,
    firstPlayed: map.first_played || null,
    lastPlayed: map.last_played || null,
    modes: map.modes ? (typeof map.modes === 'string' ? JSON.parse(map.modes) : map.modes) : {},
    topPilot: map.top_pilot ? (typeof map.top_pilot === 'string' ? JSON.parse(map.top_pilot) : map.top_pilot) : null,
    topPilots: map.top_pilots ? (typeof map.top_pilots === 'string' ? JSON.parse(map.top_pilots) : map.top_pilots) : [],
    recordMatch: map.record_match ? (typeof map.record_match === 'string' ? JSON.parse(map.record_match) : map.record_match) : null
  };
};

// Where a map's image is cached on disk: its stored file name, or the one the
// image route saves a downloaded image under. The file may not exist yet.
export const mapImagePath = (map) =>
  path.join(mapImagesDir, map.local_image || `${map.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${map.id}.jpg`);

export const getMapById = (id) => {
  return hotDb.prepare('SELECT * FROM maps WHERE id = ?').get(id);
};

export const getMapByName = (name) => {
  return hotDb.prepare('SELECT * FROM maps WHERE LOWER(name) = LOWER(?)').get(name);
};

export const upsertMap = (mapData) => {
  const stmt = hotDb.prepare(`
    INSERT INTO maps (
      name, author, size, max_players, best_team_size, supports_ctf, style,
      release_date, remote_url, remote_image_url, local_file, local_image,
      file_size, is_custom, updated_at
    ) VALUES (
      @name, @author, @size, @max_players, @best_team_size, @supports_ctf, @style,
      @release_date, @remote_url, @remote_image_url, @local_file, @local_image,
      @file_size, @is_custom, CURRENT_TIMESTAMP
    )
    ON CONFLICT(name) DO UPDATE SET
      author = CASE 
        WHEN excluded.author IS NOT NULL AND excluded.author != 'Unknown' THEN excluded.author 
        ELSE COALESCE(maps.author, excluded.author) 
      END,
      size = COALESCE(excluded.size, maps.size),
      max_players = CASE WHEN excluded.max_players > 0 THEN excluded.max_players ELSE maps.max_players END,
      best_team_size = CASE WHEN excluded.best_team_size > 0 THEN excluded.best_team_size ELSE maps.best_team_size END,
      supports_ctf = COALESCE(excluded.supports_ctf, maps.supports_ctf),
      style = COALESCE(excluded.style, maps.style),
      release_date = COALESCE(excluded.release_date, maps.release_date),
      remote_url = COALESCE(excluded.remote_url, maps.remote_url),
      remote_image_url = COALESCE(excluded.remote_image_url, maps.remote_image_url),
      file_size = CASE WHEN excluded.file_size > 0 THEN excluded.file_size ELSE maps.file_size END,
      is_custom = excluded.is_custom,
      updated_at = CURRENT_TIMESTAMP
  `);
  return stmt.run({
    name: mapData.name,
    author: mapData.author || 'Unknown',
    size: mapData.size || 'medium',
    max_players: mapData.max_players || 8,
    best_team_size: mapData.best_team_size || 4,
    supports_ctf: mapData.supports_ctf ? 1 : 0,
    style: mapData.style || 'mixed',
    release_date: mapData.release_date || null,
    remote_url: mapData.remote_url || null,
    remote_image_url: mapData.remote_image_url || null,
    local_file: mapData.local_file || null,
    local_image: mapData.local_image || null,
    file_size: mapData.file_size || 0,
    is_custom: mapData.is_custom ? 1 : 0
  });
};

export const incrementMapDownloads = (id) => {
  return hotDb.prepare('UPDATE maps SET downloads = downloads + 1 WHERE id = ?').run(id);
};

export const updateMapLocalPaths = (id, localFile, localImage) => {
  return hotDb.prepare(`
    UPDATE maps 
    SET local_file = COALESCE(?, local_file),
        local_image = COALESCE(?, local_image)
    WHERE id = ?
  `).run(localFile, localImage, id);
};

export const deleteMap = (id) => {
  return hotDb.prepare('DELETE FROM maps WHERE id = ?').run(id);
};
