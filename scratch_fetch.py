import urllib.request
import urllib.parse
import re

def get_yt_id(query):
    url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        html = urllib.request.urlopen(req).read().decode('utf-8')
        match = re.search(r'\"videoId\":\"([a-zA-Z0-9_-]{11})\"', html)
        if match:
            return match.group(1)
    except Exception as e:
        print("Error:", e)
    return None

print(get_yt_id("Iktara Kavita Seth"))
