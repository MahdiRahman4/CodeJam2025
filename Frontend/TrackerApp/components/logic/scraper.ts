import { supabase } from '../../lib/supabase';

// ==========================
// CONFIG
// ==========================

const RIOT_API_KEY = "RGAPI-3e6d3ede-d3ef-4c67-9dde-33dd8e0c0391";
const ACCOUNT_BASE = "https://americas.api.riotgames.com";

const REGIONAL_BASES = [
  "https://americas.api.riotgames.com",
  "https://europe.api.riotgames.com",
  "https://asia.api.riotgames.com",
  "https://sea.api.riotgames.com",
];

const MIN_MATCHES_REQUIRED = 5;

// RATE LIMIT
const REQUESTS_PER_2_MIN = 190;
const SECONDS_PER_REQUEST = 120.0 / REQUESTS_PER_2_MIN;
let _last_request_time = 0;

// ==========================
// RIOT API WRAPPER
// ==========================

async function riotGet(url: string): Promise<{ data: any; status: number }> {
  const now = Date.now();
  const delta = (now - _last_request_time) / 1000;
  
  if (delta < SECONDS_PER_REQUEST) {
    const wait = (SECONDS_PER_REQUEST - delta) * 1000;
    console.log(`[RATE] Sleeping ${wait / 1000}s before calling Riot API`);
    await new Promise(resolve => setTimeout(resolve, wait));
  }

  const headers = {
    "X-Riot-Token": RIOT_API_KEY,
  };

  try {
    const response = await fetch(url, { headers });
    _last_request_time = Date.now();

    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After");
      const backoff = (parseInt(retryAfter || "5") + 1) * 1000;
      console.log(`[RIOT] 429 Rate limited. Sleeping ${backoff / 1000}s, then retrying once...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      
      const retryResponse = await fetch(url, { headers });
      if (retryResponse.status !== 200) {
        console.log(`[RIOT] Non-200 status ${retryResponse.status} for ${url}`);
        return { data: null, status: retryResponse.status };
      }
      
      const data = await retryResponse.json();
      return { data, status: retryResponse.status };
    }

    if (response.status !== 200) {
      console.log(`[RIOT] Non-200 status ${response.status} for ${url}`);
      return { data: null, status: response.status };
    }

    const data = await response.json();
    return { data, status: response.status };
  } catch (error) {
    console.log(`[RIOT] Request error: ${error} (${url})`);
    return { data: null, status: 0 };
  }
}

// ==========================
// RIOT ACCOUNT / MATCH HELPERS
// ==========================

async function getAccountByRiotId(gameName: string, tagLine: string) {
  const encodedGameName = encodeURIComponent(gameName);
  const encodedTagLine = encodeURIComponent(tagLine);
  const url = `${ACCOUNT_BASE}/riot/account/v1/accounts/by-riot-id/${encodedGameName}/${encodedTagLine}`;
  
  console.log(`[ACCOUNT] ${gameName}#${tagLine}`);
  const { data, status } = await riotGet(url);
  
  if (!data || !data.puuid) {
    console.log(`  -> Couldn't fetch account or missing puuid for ${gameName}#${tagLine}`);
    return null;
  }
  
  return data;
}

async function findMatchesRegion(puuid: string, count: number = 5): Promise<{ matchIds: string[]; routingBase: string | null }> {
  let bestNonempty: string[] | null = null;
  let bestBase: string | null = null;

  for (const base of REGIONAL_BASES) {
    const url = `${base}/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`;
    console.log(`[MATCH IDS] trying ${base} puuid=${puuid.substring(0, 10)}...`);
    
    const { data, status } = await riotGet(url);
    
    if (!data || status !== 200) {
      continue;
    }

    if (Array.isArray(data)) {
      if (data.length > 0) {
        console.log(`  -> Got ${data.length} matches on ${base}`);
        if (data.length >= count) {
          return { matchIds: data, routingBase: base };
        }
        if (bestNonempty === null) {
          bestNonempty = data;
          bestBase = base;
        }
      }
    }
  }

  if (bestNonempty !== null) {
    console.log(`  -> Using partial matches (${bestNonempty.length}) from ${bestBase}`);
    return { matchIds: bestNonempty, routingBase: bestBase };
  }

  console.log("  -> No matches found on any region for this puuid.");
  return { matchIds: [], routingBase: null };
}

async function getMatchDetail(matchId: string, routingBase: string) {
  const url = `${routingBase}/lol/match/v5/matches/${matchId}`;
  const { data } = await riotGet(url);
  return data;
}

// ==========================
// ANALYSIS
// ==========================

async function analyzeLastGames(puuid: string, count: number = 5) {
  const { matchIds, routingBase } = await findMatchesRegion(puuid, count);

  if (!matchIds || matchIds.length === 0 || !routingBase) {
    console.log("  -> No matches found for this player in any region.");
    return { games: [], summary: null };
  }

  if (matchIds.length < count) {
    console.log(`  -> Only found ${matchIds.length} matches (need ${count}), skipping this player.`);
    return { games: [], summary: null };
  }

  const games: any[] = [];
  let totalDamage = 0;
  let totalVisionScore = 0;
  let totalCs = 0;
  let totalGold = 0;
  let totalImpact = 0;

  for (let i = 0; i < matchIds.length; i++) {
    const matchId = matchIds[i];
    const matchData = await getMatchDetail(matchId, routingBase);
    
    if (!matchData) {
      console.log(`  -> Failed to get match detail for ${matchId}, skipping this match.`);
      continue;
    }

    const info = matchData.info || {};
    const players = info.participants || [];
    const duration = info.gameDuration || 0;

    if (!duration || duration <= 0) {
      console.log(`  -> Invalid duration for ${matchId}, skipping.`);
      continue;
    }

    const matchTs = info.gameStartTimestamp || info.gameCreation;

    // Team totals
    const teamKills: { [key: number]: number } = {};
    const teamDamage: { [key: number]: number } = {};

    for (const p of players) {
      const teamId = p.teamId;
      if (teamId === undefined) continue;
      
      if (!teamKills[teamId]) teamKills[teamId] = 0;
      if (!teamDamage[teamId]) teamDamage[teamId] = 0;

      teamKills[teamId] += p.kills || 0;
      teamDamage[teamId] += p.totalDamageDealtToChampions || 0;
    }

    // Find "me"
    const me = players.find((p: any) => p.puuid === puuid);
    if (!me) {
      console.log(`  -> Could not find player in match ${matchId}`);
      continue;
    }

    const teamId = me.teamId;
    const teamTotalKills = teamKills[teamId] || 0;
    const teamTotalDamage = teamDamage[teamId] || 0;

    // Basic stats
    const kills = me.kills || 0;
    const deaths = me.deaths || 0;
    const assists = me.assists || 0;
    const win = me.win || false;
    const champ = me.championName || "Unknown";

    const cs = (me.totalMinionsKilled || 0) + (me.neutralMinionsKilled || 0);
    const gold = me.goldEarned || 0;
    const dmg = me.totalDamageDealtToChampions || 0;

    const visionScore = me.visionScore || 0;
    const wardsPlaced = me.wardsPlaced || 0;
    const wardsKilled = me.wardsKilled || 0;

    const damageTaken = me.totalDamageTaken || 0;
    const damageToObj = me.damageDealtToObjectives || 0;
    const turretKills = me.turretKills || 0;
    const dragonKills = me.dragonKills || 0;
    const baronKills = me.baronKills || 0;
    const heraldKills = me.riftHeraldKills || 0;

    const doubleKills = me.doubleKills || 0;
    const tripleKills = me.tripleKills || 0;
    const quadraKills = me.quadraKills || 0;
    const pentaKills = me.pentaKills || 0;

    const role = me.teamPosition || null;
    const lane = me.lane || null;

    const minutes = duration / 60.0;
    const kda = deaths > 0 ? (kills + assists) / deaths : (kills + assists);

    const csPerMin = cs / minutes;
    const gpm = gold / minutes;
    const dpm = dmg / minutes;
    const dtpm = damageTaken / minutes;
    const visionPerMin = visionScore / minutes;

    const kp = teamTotalKills > 0 ? (kills + assists) / teamTotalKills : 0;
    const killShare = teamTotalKills > 0 ? kills / teamTotalKills : 0;
    const damageShare = teamTotalDamage > 0 ? dmg / teamTotalDamage : 0;

    const winFactor = win ? 1.0 : 0.0;

    // Impact score heuristic
    const impactScore = (
      0.30 * damageShare +
      0.25 * kp +
      0.15 * (visionPerMin / 2.0) +
      0.10 * (csPerMin / 10.0) +
      0.10 * (gpm / 600.0) +
      0.10 * winFactor
    );

    const gameStats = {
      match_id: matchId,
      player_puuid: puuid,
      champion: champ,
      role,
      lane,
      kills,
      deaths,
      assists,
      kda,
      kp,
      kill_share: killShare,
      damage_share: damageShare,
      dpm,
      gpm,
      cs,
      cs_per_min: csPerMin,
      vision_score: visionScore,
      vision_per_min: visionPerMin,
      wards_placed: wardsPlaced,
      wards_killed: wardsKilled,
      damage_to_obj: damageToObj,
      damage_taken: damageTaken,
      dtpm,
      turret_kills: turretKills,
      dragon_kills: dragonKills,
      baron_kills: baronKills,
      herald_kills: heraldKills,
      double_kills: doubleKills,
      triple_kills: tripleKills,
      quadra_kills: quadraKills,
      penta_kills: pentaKills,
      game_duration: duration,
      win,
      impact_score: impactScore,
      match_ts: matchTs,
    };

    games.push(gameStats);

    totalDamage += dmg;
    totalVisionScore += visionScore;
    totalCs += cs;
    totalGold += gold;
    totalImpact += impactScore;

    console.log(`  Game ${i + 1} (${matchId}): ${champ} | ${kills}/${deaths}/${assists} KDA=${kda.toFixed(2)} | win=${win}`);
  }

  if (games.length < count) {
    console.log(`  -> Only ${games.length} valid matches parsed (need ${count}), skipping player.`);
    return { games: [], summary: null };
  }

  const n = games.length;

  const avgKills = games.reduce((sum, g) => sum + g.kills, 0) / n;
  const avgDeaths = games.reduce((sum, g) => sum + g.deaths, 0) / n;
  const avgAssists = games.reduce((sum, g) => sum + g.assists, 0) / n;
  const avgKda = games.reduce((sum, g) => sum + g.kda, 0) / n;
  const winrate = (games.filter(g => g.win).length / n) * 100;
  const avgDpm = games.reduce((sum, g) => sum + g.dpm, 0) / n;
  const avgGpm = games.reduce((sum, g) => sum + g.gpm, 0) / n;
  const avgCsPm = games.reduce((sum, g) => sum + g.cs_per_min, 0) / n;
  const avgImpact = games.reduce((sum, g) => sum + g.impact_score, 0) / n;

  const avgDamage = totalDamage / n;
  const avgVisionScore = totalVisionScore / n;
  const avgCs = totalCs / n;
  const avgGold = totalGold / n;

  let region = null;
  if (matchIds.length > 0) {
    try {
      region = matchIds[0].split("_")[0];
    } catch (e) {
      region = null;
    }
  }

  console.log(`  Summary of last ${n} games:`);
  console.log(`    Avg KDA:         ${avgKda.toFixed(2)}`);
  console.log(`    Winrate:         ${winrate.toFixed(1)}%`);
  console.log(`    Avg Damage:      ${avgDamage.toFixed(0)}`);
  console.log(`    Avg Impact:      ${avgImpact.toFixed(3)}`);

  const summary = {
    avg_damage: avgDamage,
    avg_vision_score: avgVisionScore,
    avg_impact_score: avgImpact,
    avg_cs: avgCs,
    avg_gold: avgGold,
    avg_kda: avgKda,
    region,
    matches_count: n,
  };

  return { games, summary };
}

// ==========================
// SUPABASE HELPERS
// ==========================

async function upsertPlayer(gameName: string, tagLine: string, puuid: string) {
  const data = {
    game_name: gameName,
    tag_line: tagLine,
    puuid,
  };
  
  console.log(`[SUPABASE] Upserting player ${gameName}#${tagLine}`);
  await supabase.from("players").upsert(data);
}

async function upsertMatches(games: any[]) {
  if (!games || games.length === 0) return;
  
  console.log(`[SUPABASE] Upserting ${games.length} matches`);
  await supabase.from("matches").upsert(games);
}

async function upsertPlayerSummary(gameName: string, tagLine: string, puuid: string, summary: any) {
  if (!summary) return;

  const data = {
    puuid,
    game_name: gameName,
    tag_line: tagLine,
    region: summary.region,
    avg_damage: summary.avg_damage,
    avg_vision_score: summary.avg_vision_score,
    avg_impact_score: summary.avg_impact_score,
    avg_cs: summary.avg_cs,
    avg_gold: summary.avg_gold,
    avg_kda: summary.avg_kda,
    matches_count: summary.matches_count,
  };
  
  console.log(`[SUPABASE] Upserting player summary ${gameName}#${tagLine}`);
  await supabase.from("player_summaries").upsert(data);
}

// ==========================
// MAIN EXPORT
// ==========================

export async function processSingleRiotId(
  gameName: string,
  tagLine: string,
  minMatches: number = MIN_MATCHES_REQUIRED
): Promise<{ success: boolean; message: string; resolvedName?: string; resolvedTag?: string }> {
  console.log("\n[MODE] Single Riot ID mode");
  
  try {
    const account = await getAccountByRiotId(gameName, tagLine);
    if (!account) {
      return {
        success: false,
        message: "Failed to resolve account from Riot API. Please check your Riot ID.",
      };
    }

    const puuid = account.puuid;
    const resolvedName = account.gameName || gameName;
    const resolvedTag = account.tagLine || tagLine;

    console.log(`[PROC SINGLE] ${resolvedName}#${resolvedTag} (puuid=${puuid.substring(0, 10)}...)`);

    const { games, summary } = await analyzeLastGames(puuid, minMatches);

    if (!summary || games.length < minMatches) {
      return {
        success: false,
        message: `Player does not have at least ${minMatches} valid matches. Please play some games first.`,
      };
    }

    await upsertPlayer(resolvedName, resolvedTag, puuid);
    await upsertMatches(games);
    await upsertPlayerSummary(resolvedName, resolvedTag, puuid, summary);

    console.log("\n[PROC SINGLE] Done for this Riot ID.");
    console.log(`  Matches stored: ${games.length}`);
    console.log(`  Region: ${summary.region}`);
    console.log(`  Avg impact: ${summary.avg_impact_score.toFixed(3)}`);

    return {
      success: true,
      message: `Successfully verified and stored data for ${resolvedName}#${resolvedTag}`,
      resolvedName,
      resolvedTag,
    };
  } catch (error) {
    console.error("[PROC SINGLE] Error:", error);
    return {
      success: false,
      message: `Error processing Riot ID: ${error}`,
    };
  }
}

