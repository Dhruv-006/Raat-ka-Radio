import urllib.request
import urllib.parse
import re
from concurrent.futures import ThreadPoolExecutor

def get_yt_id(query):
    url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(query + ' audio')}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        match = re.search(r'\"videoId\":\"([a-zA-Z0-9_-]{11})\"', html)
        if match:
            return match.group(1)
    except Exception as e:
        print("Error for query", query, e)
    return None

with open('app/components/playlist-data.ts', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'(title:\s*"([^"]+)",\s*artist:\s*"([^"]+)",\s*(?:film:\s*"([^"]*)",\s*)?year:\s*(\d+),\s*duration:\s*(\d+),\s*videoId:\s*")([^"]+)(")')

matches = list(pattern.finditer(content))

def process_match(m):
    prefix = m.group(1)
    title = m.group(2)
    artist = m.group(3)
    old_id = m.group(7)
    suffix = m.group(8)
    
    query = f"{title} {artist}"
    new_id = get_yt_id(query)
    
    return {
        'old_text': m.group(0),
        'new_text': prefix + (new_id if new_id else old_id) + suffix,
        'title': title,
        'new_id': new_id
    }

print(f"Found {len(matches)} tracks to update.")

with ThreadPoolExecutor(max_workers=10) as executor:
    results = list(executor.map(process_match, matches))

new_content = content
for res in results:
    if res['new_id']:
        print(f"Updated {res['title']} -> {res['new_id']}")
        new_content = new_content.replace(res['old_text'], res['new_text'])

with open('app/components/playlist-data.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)
