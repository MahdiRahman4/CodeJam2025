import time
import requests
from urllib.parse import quote
from supabase import create_client, Client

# ==========================
# CONFIG
# ==========================

RIOT_API_KEY = "RGAPI-3e6d3ede-d3ef-4c67-9dde-33dd8e0c0391"
SUPABASE_URL = "https://csdwfekwbtbuyspvksnp.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzZHdmZWt3YnRidXlzcHZrc25wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNjU4OTQsImV4cCI6MjA3ODc0MTg5NH0.VIHbiRzpNYnylGfr8DQ29b8EcCJqUpTTpypTicOvqKE"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

ACCOUNT_BASE = "https://americas.api.riotgames.com"

REGIONAL_BASES = [
    "https://americas.api.riotgames.com",
    "https://europe.api.riotgames.com",
    "https://asia.api.riotgames.com",
    "https://sea.api.riotgames.com",
]

MIN_MATCHES_REQUIRED = 5

# RATE LIMIT
REQUESTS_PER_2_MIN = 190
SECONDS_PER_REQUEST = 120.0 / REQUESTS_PER_2_MIN
_last_request_time = 0.0


# ==========================
# RIOT API WRAPPER
# ==========================

def riot_get(url: str):
    """
    Wrapper around requests.get with simple rate-limiting
    and basic 429 handling.
    """
    global _last_request_time

    now = time.time()
    delta = now - _last_request_time
    if delta < SECONDS_PER_REQUEST:
        wait = SECONDS_PER_REQUEST - delta
        print(f"[RATE] Sleeping {wait:.2f}s before calling Riot API")
        time.sleep(wait)

    headers = {"X-Riot-Token": RIOT_API_KEY}

    try:
        r = requests.get(url, headers=headers, timeout=10)
    except Exception as e:
        print(f"[RIOT] Request error: {e} ({url})")
        return None, 0
    finally:
        _last_request_time = time.time()

    if r.status_code == 429:
        retry_after = r.headers.get("Retry-After")
        try:
            retry_after = int(retry_after)
        except (TypeError, ValueError):
            retry_after = 5
        backoff = retry_after + 1
        print(f"[RIOT] 429 Rate limited. Sleeping {backoff}s, then retrying once...")
        time.sleep(backoff)
        try:
            r = requests.get(url, headers=headers, timeout=10)
        except Exception as e:
            print(f"[RIOT] Request error on retry: {e} ({url})")
            return None, 429

    if r.status_code != 200:
        print(f"[RIOT] Non-200 status {r.status_code} for {url}")
        try:
            print("  Response:", r.json())
        except Exception:
            print("  Response body:", r.text[:200])
        return None, r.status_code

    try:
        return r.json(), r.status_code
    except Exception as e:
        print(f"[RIOT] Failed to parse JSON: {e}")
        return None, r.status_code


# ==========================
# RIOT ACCOUNT / MATCH HELPERS
# ==========================

def get_account_by_riot_id(game_name, tag_line):
    """
    Resolve Riot ID (gameName + tagLine) -> account with puuid.
    """
    # URL-encode game_name and tag_line to handle special characters
    encoded_game_name = quote(str(game_name), safe='')
    encoded_tag_line = quote(str(tag_line), safe='')
    url = f"{ACCOUNT_BASE}/riot/account/v1/accounts/by-riot-id/{encoded_game_name}/{encoded_tag_line}"
    print(f"[ACCOUNT] {game_name}#{tag_line}")
    data, status = riot_get(url)
    if not data or "puuid" not in data:
        print(f"  -> Couldn't fetch account or missing puuid for {game_name}#{tag_line}")
        return None
    return data


def find_matches_region(puuid, count=5):
    """
    Try all regional routing values to find match IDs for a puuid.
    Returns (match_ids, routing_base) or ([], None).
    """
    best_nonempty = None
    best_base = None

    for base in REGIONAL_BASES:
        url = f"{base}/lol/match/v5/matches/by-puuid/{puuid}/ids?count={count}"
        print(f"[MATCH IDS] trying {base} puuid={puuid[:10]}...")
        data, status = riot_get(url)
        if not data or status != 200:
            continue

        if isinstance(data, list):
            if len(data) > 0:
                print(f"  -> Got {len(data)} matches on {base}")
                if len(data) >= count:
                    return data, base
                if best_nonempty is None:
                    best_nonempty = data
                    best_base = base

    if best_nonempty is not None:
        print(f"  -> Using partial matches ({len(best_nonempty)}) from {best_base}")
        return best_nonempty, best_base

    print("  -> No matches found on any region for this puuid.")
    return [], None


def get_match_detail(match_id, routing_base):
    url = f"{routing_base}/lol/match/v5/matches/{match_id}"
    data, status = riot_get(url)
    if not data:
        return None
    return data


# ==========================
# ANALYSIS
# ==========================

def analyze_last_games(puuid, count=5):
    """
    Analyze the last `count` games for this puuid and compute a summary.
    Returns (games_list, summary_dict) or ([], None) if not enough data.
    """
    match_ids, routing_base = find_matches_region(puuid, count=count)

    if not match_ids or routing_base is None:
        print("  -> No matches found for this player in any region.")
        return [], None

    if len(match_ids) < count:
        print(f"  -> Only found {len(match_ids)} matches (need {count}), skipping this player.")
        return [], None

    games = []

    total_damage = 0.0
    total_vision_score = 0.0
    total_cs = 0.0
    total_gold = 0.0
    total_impact = 0.0

    for i, match_id in enumerate(match_ids, start=1):
        match_data = get_match_detail(match_id, routing_base)
        if not match_data:
            print(f"  -> Failed to get match detail for {match_id}, skipping this match.")
            continue

        info = match_data.get("info", {})
        players = info.get("participants", [])

        duration = info.get("gameDuration") or 0
        if not duration or duration <= 0:
            print(f"  -> Invalid duration for {match_id}, skipping.")
            continue

        match_ts = info.get("gameStartTimestamp") or info.get("gameCreation")

        # region shard from match_id like "NA1_123456..."
        region = None
        try:
            region = str(match_id).split("_", 1)[0]
        except Exception:
            region = None

        # team totals
        team_kills = {}
        team_damage = {}

        for p in players:
            team_id = p.get("teamId")
            if team_id is None:
                continue
            team_kills.setdefault(team_id, 0)
            team_damage.setdefault(team_id, 0)

            team_kills[team_id] += p.get("kills", 0)
            team_damage[team_id] += p.get("totalDamageDealtToChampions", 0)

        # find "me"
        me = None
        for p in players:
            if p.get("puuid") == puuid:
                me = p
                break

        if me is None:
            print(f"  -> Could not find player in match {match_id}")
            continue

        team_id = me.get("teamId")
        team_total_kills = team_kills.get(team_id, 0)
        team_total_damage = team_damage.get(team_id, 0)

        # --- Basic stats ---
        kills = me.get("kills", 0)
        deaths = me.get("deaths", 0)
        assists = me.get("assists", 0)
        win = me.get("win", False)
        champ = me.get("championName", "Unknown")

        cs = me.get("totalMinionsKilled", 0) + me.get("neutralMinionsKilled", 0)
        gold = me.get("goldEarned", 0)
        dmg = me.get("totalDamageDealtToChampions", 0)

        vision_score = me.get("visionScore", 0)
        wards_placed = me.get("wardsPlaced", 0)
        wards_killed = me.get("wardsKilled", 0)

        damage_taken = me.get("totalDamageTaken", 0)
        damage_to_obj = me.get("damageDealtToObjectives", 0)
        turret_kills = me.get("turretKills", 0)
        dragon_kills = me.get("dragonKills", 0)
        baron_kills = me.get("baronKills", 0)
        herald_kills = me.get("riftHeraldKills", 0)

        double_kills = me.get("doubleKills", 0)
        triple_kills = me.get("tripleKills", 0)
        quadra_kills = me.get("quadraKills", 0)
        penta_kills = me.get("pentaKills", 0)

        role = me.get("teamPosition") or None
        lane = me.get("lane") or None

        minutes = duration / 60.0 if duration > 0 else 1.0

        kda = (kills + assists) / deaths if deaths > 0 else (kills + assists)

        cs_per_min = cs / minutes
        gpm = gold / minutes
        dpm = dmg / minutes
        dtpm = damage_taken / minutes
        vision_per_min = vision_score / minutes

        if team_total_kills > 0:
            kp = (kills + assists) / team_total_kills
            kill_share = kills / team_total_kills
        else:
            kp = 0.0
            kill_share = 0.0

        if team_total_damage > 0:
            damage_share = dmg / team_total_damage
        else:
            damage_share = 0.0

        win_factor = 1.0 if win else 0.0

        # "impact_score" heuristic
        impact_score = (
            0.30 * damage_share +
            0.25 * kp +
            0.15 * (vision_per_min / 2.0) +
            0.10 * (cs_per_min / 10.0) +
            0.10 * (gpm / 600.0) +
            0.10 * win_factor
        )

        game_stats = {
            "match_id": match_id,
            "player_puuid": puuid,
            "champion": champ,

            "role": role,
            "lane": lane,

            "kills": kills,
            "deaths": deaths,
            "assists": assists,
            "kda": kda,

            "kp": kp,
            "kill_share": kill_share,
            "damage_share": damage_share,

            "dpm": dpm,
            "gpm": gpm,

            "cs": cs,
            "cs_per_min": cs_per_min,

            "vision_score": vision_score,
            "vision_per_min": vision_per_min,
            "wards_placed": wards_placed,
            "wards_killed": wards_killed,

            "damage_to_obj": damage_to_obj,
            "damage_taken": damage_taken,
            "dtpm": dtpm,

            "turret_kills": turret_kills,
            "dragon_kills": dragon_kills,
            "baron_kills": baron_kills,
            "herald_kills": herald_kills,

            "double_kills": double_kills,
            "triple_kills": triple_kills,
            "quadra_kills": quadra_kills,
            "penta_kills": penta_kills,

            "game_duration": duration,
            "win": win,

            "impact_score": impact_score,

            "match_ts": match_ts,
        }
        games.append(game_stats)

        total_damage += dmg
        total_vision_score += vision_score
        total_cs += cs
        total_gold += gold
        total_impact += impact_score

        print(f"  Game {i} ({match_id}): {champ} | {kills}/{deaths}/{assists} KDA={kda:.2f} | win={win}")
        print(f"    CS/min={cs_per_min:.2f}, DPM={dpm:.0f}, GPM={gpm:.0f}, KP={kp*100:.1f}%, DmgShare={damage_share*100:.1f}%")

    if len(games) < count:
        print(f"  -> Only {len(games)} valid matches parsed (need {count}), skipping player.")
        return [], None

    n = len(games)

    avg_kills = sum(g["kills"] for g in games) / n
    avg_deaths = sum(g["deaths"] for g in games) / n
    avg_assists = sum(g["assists"] for g in games) / n
    avg_kda = sum(g["kda"] for g in games) / n
    winrate = sum(1 for g in games if g["win"]) / n * 100
    avg_dpm = sum(g["dpm"] for g in games) / n
    avg_gpm = sum(g["gpm"] for g in games) / n
    avg_cs_pm = sum(g["cs_per_min"] for g in games) / n
    avg_impact = sum(g["impact_score"] for g in games) / n

    avg_damage = total_damage / n
    avg_vision_score = total_vision_score / n
    avg_cs = total_cs / n
    avg_gold = total_gold / n

    region = None
    if match_ids:
        try:
            region = str(match_ids[0]).split("_", 1)[0]
        except Exception:
            region = None

    print(f"  Summary of last {n} games:")
    print(f"    Avg kills:       {avg_kills:.2f}")
    print(f"    Avg deaths:      {avg_deaths:.2f}")
    print(f"    Avg assists:     {avg_assists:.2f}")
    print(f"    Avg KDA:         {avg_kda:.2f}")
    print(f"    Winrate:         {winrate:.1f}%")
    print(f"    Avg DPM:         {avg_dpm:.0f}")
    print(f"    Avg GPM:         {avg_gpm:.0f}")
    print(f"    Avg CS/min:      {avg_cs_pm:.2f}")
    print(f"    Avg Impact:      {avg_impact:.3f}")
    print(f"    Avg Damage:      {avg_damage:.0f}")
    print(f"    Avg VisionScore: {avg_vision_score:.1f}")
    print(f"    Avg CS:          {avg_cs:.1f}")
    print(f"    Avg Gold:        {avg_gold:.0f}")
    print(f"    Region:          {region}")

    summary = {
        "avg_damage": avg_damage,
        "avg_vision_score": avg_vision_score,
        "avg_impact_score": avg_impact,
        "avg_cs": avg_cs,
        "avg_gold": avg_gold,
        "avg_kda": avg_kda,
        "region": region,
        "matches_count": n,
    }

    return games, summary


# ==========================
# SUPABASE HELPERS
# ==========================

def upsert_player(game_name: str, tag_line: str, puuid: str):
    data = {
        "game_name": game_name,
        "tag_line": tag_line,
        "puuid": puuid,
    }
    print(f"[SUPABASE] Upserting player {game_name}#{tag_line}")
    supabase.table("players").upsert(data, on_conflict="puuid").execute()


def upsert_matches(games):
    if not games:
        return

    print(f"[SUPABASE] Upserting {len(games)} matches")
    supabase.table("matches").upsert(
        games,
        on_conflict="match_id,player_puuid"
    ).execute()


def upsert_player_summary(game_name: str, tag_line: str, puuid: str, summary: dict):
    if not summary:
        return

    data = {
        "puuid": puuid,
        "game_name": game_name,
        "tag_line": tag_line,
        "region": summary.get("region"),

        "avg_damage": summary["avg_damage"],
        "avg_vision_score": summary["avg_vision_score"],
        "avg_impact_score": summary["avg_impact_score"],
        "avg_cs": summary["avg_cs"],
        "avg_gold": summary["avg_gold"],
        "avg_kda": summary["avg_kda"],

        "matches_count": summary["matches_count"],
    }
    print(f"[SUPABASE] Upserting player summary {game_name}#{tag_line}")
    supabase.table("player_summaries").upsert(
        data,
        on_conflict="puuid"
    ).execute()


# ==========================
# SINGLE PLAYER MODE
# ==========================

def process_single_riot_id(game_name: str, tag_line: str, min_matches=MIN_MATCHES_REQUIRED):
    print("\n[MODE] Single Riot ID mode")
    account = get_account_by_riot_id(game_name, tag_line)
    if not account:
        print("  -> Failed to resolve account from Riot ID.")
        return

    puuid = account["puuid"]
    resolved_name = account.get("gameName", game_name)
    resolved_tag = account.get("tagLine", tag_line)

    print(f"[PROC SINGLE] {resolved_name}#{resolved_tag} (puuid={puuid[:10]}...)")

    games, summary = analyze_last_games(
        puuid,
        count=min_matches,
    )

    if not summary or len(games) < min_matches:
        print(f"  -> Player does NOT have at least {min_matches} valid matches. Nothing to insert.")
        return

    upsert_player(resolved_name, resolved_tag, puuid)
    upsert_matches(games)
    upsert_player_summary(resolved_name, resolved_tag, puuid, summary)

    print("\n[PROC SINGLE] Done for this Riot ID.")
    print(f"  Matches stored: {len(games)}")
    print(f"  Region: {summary.get('region')}")
    print(f"  Avg impact: {summary.get('avg_impact_score'):.3f}")


# ==========================
# MAIN
# ==========================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Riot single-player match scraper"
    )
    parser.add_argument(
        "--riot-name",
        dest="riot_name",
        required=True,
        help="Riot gameName (e.g. 'rogue')"
    )
    parser.add_argument(
        "--tag",
        dest="tag_line",
        required=True,
        help="Riot tagline (e.g. 'zeri')"
    )
    parser.add_argument(
        "--min-matches",
        dest="min_matches",
        type=int,
        default=MIN_MATCHES_REQUIRED,
        help=f"Minimum matches required (default {MIN_MATCHES_REQUIRED})"
    )

    args = parser.parse_args()

    process_single_riot_id(args.riot_name, args.tag_line, args.min_matches)
