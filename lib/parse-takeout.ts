import JSZip from 'jszip';
import Papa from 'papaparse';

export interface WatchEntry {
  videoId: string;
  title: string;
  channelName: string;
  channelUrl: string;
  timestamp: Date;
  hour: number; // 0-23
  videoUrl: string;
}

export interface SearchEntry {
  query: string;
  timestamp: Date;
}

export interface Subscription {
  channelId: string;
  channelUrl: string;
  channelTitle: string;
}

export interface ParsedTakeout {
  watchHistory: WatchEntry[];
  searchHistory: SearchEntry[];
  subscriptions: Subscription[];
}

export type ParseProgress = {
  stage: 'reading' | 'parsing-watch' | 'parsing-search' | 'parsing-subs' | 'done';
  count: number;
  message: string;
};

/** Parse the HTML timestamp string like "Feb 18, 2026, 6:21:03\u202fAM JST" into a Date */
function parseTimestamp(raw: string): Date | null {
  // Unicode narrow no-break space between time and AM/PM
  const cleaned = raw.replace(/\u202f/g, ' ').trim();
  // Pattern: "MMM DD, YYYY, H:MM:SS AM/PM TZ"
  const m = cleaned.match(/^(\w+ \d+, \d{4}),\s+(\d+:\d+:\d+)\s+([AP]M)/);
  if (!m) return null;
  const [, datePart, timePart, ampm] = m;
  try {
    return new Date(`${datePart} ${timePart} ${ampm}`);
  } catch {
    return null;
  }
}

/** Extract video ID from YouTube watch URL */
function extractVideoId(url: string): string {
  const m = url.match(/[?&]v=([^&]+)/);
  return m ? m[1] : '';
}

/** Parse watch-history.html content into WatchEntry[] */
function parseWatchHistory(html: string, onProgress?: (count: number) => void): WatchEntry[] {
  const entries: WatchEntry[] = [];

  // Each entry looks like:
  // Watched\xa0<a href="...">TITLE</a><br><a href="CHANNEL_URL">CHANNEL</a><br>TIMESTAMP<br>
  const pattern = /Watched[\xa0\s]<a href="([^"]+)">([^<]+)<\/a><br><a href="([^"]+)">([^<]*)<\/a><br>([^<]+)<br>/g;
  let match: RegExpExecArray | null;
  let count = 0;

  while ((match = pattern.exec(html)) !== null) {
    const [, videoUrl, title, channelUrl, channelName, rawTs] = match;
    const timestamp = parseTimestamp(rawTs.trim());
    if (!timestamp) continue;

    entries.push({
      videoId: extractVideoId(videoUrl),
      title: title.trim(),
      channelName: channelName.trim(),
      channelUrl,
      timestamp,
      hour: timestamp.getHours(),
      videoUrl,
    });

    count++;
    if (count % 2000 === 0) onProgress?.(count);
  }

  onProgress?.(count);
  return entries;
}

/** Parse search-history.html content into SearchEntry[] */
function parseSearchHistory(html: string): SearchEntry[] {
  const entries: SearchEntry[] = [];

  // Google encodes as: "Searched for\u00a0<a..." — regular space before "for", U+00A0 after
  const pattern = /Searched for\u00a0<a href="[^"]+">([^<]+)<\/a><br>([^<]+)<br>/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    const [, query, rawTs] = match;
    const timestamp = parseTimestamp(rawTs.trim());
    if (!timestamp) continue;
    entries.push({ query: query.trim(), timestamp });
  }

  return entries;
}

/** Parse subscriptions.csv */
function parseSubscriptions(csv: string): Subscription[] {
  const result = Papa.parse<{ 'Channel Id': string; 'Channel Url': string; 'Channel Title': string }>(csv, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data.map((row) => ({
    channelId: row['Channel Id'] || '',
    channelUrl: row['Channel Url'] || '',
    channelTitle: row['Channel Title'] || '',
  }));
}

/** Find a zip entry by filename suffix, case-insensitive. Returns null if not found. */
function findZipEntry(zip: JSZip, suffix: string): JSZip.JSZipObject | null {
  const lowerSuffix = suffix.toLowerCase();
  const entry = Object.keys(zip.files).find(
    (name) => name.toLowerCase().endsWith(lowerSuffix)
  );
  return entry ? zip.files[entry] : null;
}

/** Main entry: takes a File (the zip), parses everything, streams progress */
export async function parseTakeout(
  file: File,
  onProgress: (p: ParseProgress) => void
): Promise<ParsedTakeout> {
  onProgress({ stage: 'reading', count: 0, message: 'Reading zip file…' });

  const zip = await JSZip.loadAsync(file);

  // --- Watch history ---
  onProgress({ stage: 'parsing-watch', count: 0, message: 'Parsing watch history…' });
  let watchHistory: WatchEntry[] = [];

  const watchFile = findZipEntry(zip, 'watch-history.html');
  if (!watchFile) {
    throw new Error(
      'Could not find watch-history.html in this zip. ' +
      'This may be a non-English Google Takeout export — please ensure the zip contains YouTube history data.'
    );
  }
  const watchHtml = await watchFile.async('text');
  watchHistory = parseWatchHistory(watchHtml, (count) => {
    onProgress({ stage: 'parsing-watch', count, message: `Reading watch history… ${count.toLocaleString()} videos` });
  });

  // --- Search history ---
  onProgress({ stage: 'parsing-search', count: 0, message: 'Parsing search history…' });
  let searchHistory: SearchEntry[] = [];

  const searchFile = findZipEntry(zip, 'search-history.html');
  if (searchFile) {
    const html = await searchFile.async('text');
    searchHistory = parseSearchHistory(html);
  }

  // --- Subscriptions ---
  onProgress({ stage: 'parsing-subs', count: 0, message: 'Reading subscriptions…' });
  let subscriptions: Subscription[] = [];

  const subsFile = findZipEntry(zip, 'subscriptions.csv');
  if (subsFile) {
    const csv = await subsFile.async('text');
    subscriptions = parseSubscriptions(csv);
  }

  onProgress({
    stage: 'done',
    count: watchHistory.length,
    message: `Loaded ${watchHistory.length.toLocaleString()} videos`,
  });

  return { watchHistory, searchHistory, subscriptions };
}
