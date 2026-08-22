import urllib.request
import urllib.parse
import re
import json
import concurrent.futures
import os
import time

playlists_new_songs = {
    "subah-ka-sukoon": [
        {"title": "Bulleya", "artist": "Amit Mishra", "film": "Ae Dil Hai Mushkil", "year": 2016, "duration": 349},
        {"title": "Gerua", "artist": "Arijit Singh", "film": "Dilwale", "year": 2015, "duration": 345},
        {"title": "Zaalima", "artist": "Arijit Singh", "film": "Raees", "year": 2017, "duration": 299},
        {"title": "Sanam Re", "artist": "Arijit Singh", "film": "Sanam Re", "year": 2016, "duration": 308},
        {"title": "Sab Tera", "artist": "Armaan Malik", "film": "Baaghi", "year": 2016, "duration": 228},
        {"title": "Sun Saathiya", "artist": "Priya Saraiya", "film": "ABCD 2", "year": 2015, "duration": 220},
        {"title": "Kaise Hua", "artist": "Vishal Mishra", "film": "Kabir Singh", "year": 2019, "duration": 234},
        {"title": "Pehli Dafa", "artist": "Atif Aslam", "film": "", "year": 2016, "duration": 293},
        {"title": "Soch Na Sake", "artist": "Arijit Singh", "film": "Airlift", "year": 2016, "duration": 280},
        {"title": "Main Tera Boyfriend", "artist": "Arijit Singh", "film": "Raabta", "year": 2017, "duration": 276}
    ],
    "dopahar-ki-dhoop": [
        {"title": "Humsafar", "artist": "Akhil Sachdeva", "film": "Badrinath Ki Dulhania", "year": 2017, "duration": 268},
        {"title": "Nazm Nazm", "artist": "Arko", "film": "Bareilly Ki Barfi", "year": 2017, "duration": 227},
        {"title": "Sweety Tera Drama", "artist": "Dev Negi", "film": "Bareilly Ki Barfi", "year": 2017, "duration": 147},
        {"title": "Ban Ja Rani", "artist": "Guru Randhawa", "film": "Tumhari Sulu", "year": 2017, "duration": 225},
        {"title": "Dil Diyan Gallan", "artist": "Atif Aslam", "film": "Tiger Zinda Hai", "year": 2017, "duration": 260},
        {"title": "Tere Mere", "artist": "Armaan Malik", "film": "Chef", "year": 2017, "duration": 344},
        {"title": "Hawa Banke", "artist": "Darshan Raval", "film": "", "year": 2019, "duration": 196},
        {"title": "Duniyaa", "artist": "Akhil", "film": "Luka Chuppi", "year": 2019, "duration": 222},
        {"title": "Vaaste", "artist": "Dhvani Bhanushali", "film": "", "year": 2019, "duration": 196},
        {"title": "Leja Re", "artist": "Dhvani Bhanushali", "film": "", "year": 2018, "duration": 205}
    ],
    "chai-aur-chill": [
        {"title": "Namo Namo", "artist": "Amit Trivedi", "film": "Kedarnath", "year": 2018, "duration": 322},
        {"title": "Qaafirana", "artist": "Arijit Singh", "film": "Kedarnath", "year": 2018, "duration": 341},
        {"title": "Jaan Nisaar", "artist": "Arijit Singh", "film": "Kedarnath", "year": 2018, "duration": 238},
        {"title": "Sweetheart", "artist": "Dev Negi", "film": "Kedarnath", "year": 2018, "duration": 212},
        {"title": "Mere Naam Tu", "artist": "Abhay Jodhpurkar", "film": "Zero", "year": 2018, "duration": 338},
        {"title": "Pal", "artist": "Arijit Singh", "film": "Jalebi", "year": 2018, "duration": 246},
        {"title": "Tera Fitoor", "artist": "Arijit Singh", "film": "Genius", "year": 2018, "duration": 304},
        {"title": "Dil Meri Na Sune", "artist": "Atif Aslam", "film": "Genius", "year": 2018, "duration": 194},
        {"title": "O Saathi", "artist": "Atif Aslam", "film": "Baaghi 2", "year": 2018, "duration": 251},
        {"title": "Lo Safar", "artist": "Jubin Nautiyal", "film": "Baaghi 2", "year": 2018, "duration": 282}
    ],
    "shaam-ka-sheher": [
        {"title": "Tujhe Kitna Chahein Aur", "artist": "Jubin Nautiyal", "film": "Kabir Singh", "year": 2019, "duration": 274},
        {"title": "Bekhayali", "artist": "Sachet Tandon", "film": "Kabir Singh", "year": 2019, "duration": 371},
        {"title": "Tera Ban Jaunga", "artist": "Akhil Sachdeva", "film": "Kabir Singh", "year": 2019, "duration": 236},
        {"title": "Ghungroo", "artist": "Arijit Singh", "film": "War", "year": 2019, "duration": 302},
        {"title": "Shaitan Ka Saala", "artist": "Vishal Dadlani", "film": "Housefull 4", "year": 2019, "duration": 147},
        {"title": "Tum Hi Aana", "artist": "Jubin Nautiyal", "film": "Marjaavaan", "year": 2019, "duration": 249},
        {"title": "Kinna Sona", "artist": "Jubin Nautiyal", "film": "Marjaavaan", "year": 2019, "duration": 269},
        {"title": "Thodi Jagah", "artist": "Arijit Singh", "film": "Marjaavaan", "year": 2019, "duration": 218},
        {"title": "Ik Mulaqaat", "artist": "Altamash Faridi", "film": "Dream Girl", "year": 2019, "duration": 247},
        {"title": "Pal Pal Dil Ke Paas", "artist": "Arijit Singh", "film": "Pal Pal Dil Ke Paas", "year": 2019, "duration": 254}
    ],
    "dil-se": [
        {"title": "Malang", "artist": "Asees Kaur", "film": "Malang", "year": 2020, "duration": 287},
        {"title": "Humraah", "artist": "Sachet Tandon", "film": "Malang", "year": 2020, "duration": 299},
        {"title": "Chal Ghar Chalen", "artist": "Arijit Singh", "film": "Malang", "year": 2020, "duration": 339},
        {"title": "Haan Main Galat", "artist": "Arijit Singh", "film": "Love Aaj Kal", "year": 2020, "duration": 218},
        {"title": "Mehrama", "artist": "Darshan Raval", "film": "Love Aaj Kal", "year": 2020, "duration": 249},
        {"title": "Aabaad Barbaad", "artist": "Arijit Singh", "film": "Ludo", "year": 2020, "duration": 309},
        {"title": "Hardum Humdum", "artist": "Arijit Singh", "film": "Ludo", "year": 2020, "duration": 267},
        {"title": "BurjKhalifa", "artist": "Shashi", "film": "Laxmii", "year": 2020, "duration": 187},
        {"title": "Taaron Ke Shehar", "artist": "Jubin Nautiyal", "film": "", "year": 2020, "duration": 229},
        {"title": "Lut Gaye", "artist": "Jubin Nautiyal", "film": "", "year": 2021, "duration": 228}
    ],
    "raat-abhi-baaki-hai": [
        {"title": "Raataan Lambiyan", "artist": "Jubin Nautiyal", "film": "Shershaah", "year": 2021, "duration": 230},
        {"title": "Ranjha", "artist": "B Praak", "film": "Shershaah", "year": 2021, "duration": 228},
        {"title": "Kabhii Tumhhe", "artist": "Darshan Raval", "film": "Shershaah", "year": 2021, "duration": 230},
        {"title": "Mann Bharryaa 2.0", "artist": "B Praak", "film": "Shershaah", "year": 2021, "duration": 266},
        {"title": "Param Sundari", "artist": "Shreya Ghoshal", "film": "Mimi", "year": 2021, "duration": 200},
        {"title": "Rihaayi De", "artist": "A.R. Rahman", "film": "Mimi", "year": 2021, "duration": 365},
        {"title": "Chaka Chak", "artist": "Shreya Ghoshal", "film": "Atrangi Re", "year": 2021, "duration": 270},
        {"title": "Rait Zara Si", "artist": "Arijit Singh", "film": "Atrangi Re", "year": 2021, "duration": 291},
        {"title": "Tumse Bhi Zyada", "artist": "Arijit Singh", "film": "Tadap", "year": 2021, "duration": 319},
        {"title": "Aashiqui Aa Gayi", "artist": "Arijit Singh", "film": "Radhe Shyam", "year": 2021, "duration": 259}
    ],
    "2-baje": [
        {"title": "Kesariya", "artist": "Arijit Singh", "film": "Brahmastra", "year": 2022, "duration": 268},
        {"title": "Deva Deva", "artist": "Arijit Singh", "film": "Brahmastra", "year": 2022, "duration": 279},
        {"title": "Rasiya", "artist": "Shreya Ghoshal", "film": "Brahmastra", "year": 2022, "duration": 265},
        {"title": "Apna Bana Le", "artist": "Arijit Singh", "film": "Bhediya", "year": 2022, "duration": 261},
        {"title": "Manike", "artist": "Yohani", "film": "Thank God", "year": 2022, "duration": 197},
        {"title": "Pasoori", "artist": "Shae Gill", "film": "Coke Studio", "year": 2022, "duration": 224},
        {"title": "Jhoom", "artist": "Ali Zafar", "film": "", "year": 2011, "duration": 313},
        {"title": "Kahani Suno 2.0", "artist": "Kaifi Khalil", "film": "", "year": 2022, "duration": 173},
        {"title": "Maan Meri Jaan", "artist": "King", "film": "", "year": 2022, "duration": 194},
        {"title": "Tu Aake Dekhle", "artist": "King", "film": "", "year": 2020, "duration": 269}
    ],
    "highway-mode": [
        {"title": "Jhoome Jo Pathaan", "artist": "Arijit Singh", "film": "Pathaan", "year": 2023, "duration": 208},
        {"title": "Besharam Rang", "artist": "Shilpa Rao", "film": "Pathaan", "year": 2023, "duration": 258},
        {"title": "Tere Pyaar Mein", "artist": "Arijit Singh", "film": "Tu Jhoothi Main Makkaar", "year": 2023, "duration": 265},
        {"title": "O Bedardeya", "artist": "Arijit Singh", "film": "Tu Jhoothi Main Makkaar", "year": 2023, "duration": 313},
        {"title": "Show Me The Thumka", "artist": "Sunidhi Chauhan", "film": "Tu Jhoothi Main Makkaar", "year": 2023, "duration": 236},
        {"title": "Pyaar Hota Kayi Baar Hai", "artist": "Arijit Singh", "film": "Tu Jhoothi Main Makkaar", "year": 2023, "duration": 216},
        {"title": "Naiyo Lagda", "artist": "Kamaal Khan", "film": "Kisi Ka Bhai Kisi Ki Jaan", "year": 2023, "duration": 321},
        {"title": "Billi Billi", "artist": "Sukhbir", "film": "Kisi Ka Bhai Kisi Ki Jaan", "year": 2023, "duration": 194},
        {"title": "Phir Aur Kya Chahiye", "artist": "Arijit Singh", "film": "Zara Hatke Zara Bachke", "year": 2023, "duration": 266},
        {"title": "Tere Vaaste", "artist": "Varun Jain", "film": "Zara Hatke Zara Bachke", "year": 2023, "duration": 189}
    ],
    "subah-hone-wali-hai": [
        {"title": "Tum Kya Mile", "artist": "Arijit Singh", "film": "Rocky Aur Rani Kii Prem Kahaani", "year": 2023, "duration": 277},
        {"title": "What Jhumka?", "artist": "Arijit Singh", "film": "Rocky Aur Rani Kii Prem Kahaani", "year": 2023, "duration": 213},
        {"title": "Ve Kamleya", "artist": "Arijit Singh", "film": "Rocky Aur Rani Kii Prem Kahaani", "year": 2023, "duration": 247},
        {"title": "Chaleya", "artist": "Arijit Singh", "film": "Jawan", "year": 2023, "duration": 200},
        {"title": "Zinda Banda", "artist": "Anirudh Ravichander", "film": "Jawan", "year": 2023, "duration": 264},
        {"title": "Heeriye", "artist": "Arijit Singh", "film": "", "year": 2023, "duration": 194},
        {"title": "Hua Main", "artist": "Raghav Chaitanya", "film": "Animal", "year": 2023, "duration": 277},
        {"title": "Satranga", "artist": "Arijit Singh", "film": "Animal", "year": 2023, "duration": 271},
        {"title": "Pehle Bhi Main", "artist": "Vishal Mishra", "film": "Animal", "year": 2023, "duration": 250},
        {"title": "Arjan Vailly", "artist": "Bhupinder Babbal", "film": "Animal", "year": 2023, "duration": 182}
    ]
}

def get_video_id(query):
    try:
        url = 'https://www.youtube.com/results?' + urllib.parse.urlencode({'search_query': query + " official audio"})
        html = urllib.request.urlopen(url).read().decode()
        match = re.search(r'watch\?v=(\S{11})', html)
        if match:
            return match.group(1)
    except Exception as e:
        print(f"Error fetching {query}: {e}")
    return "dQw4w9WgXcQ" # fallback

all_queries = []
for pid, tracks in playlists_new_songs.items():
    for t in tracks:
        query = f"{t['title']} {t['artist']} {t['film']}"
        all_queries.append((pid, t, query))

print(f"Fetching {len(all_queries)} video IDs...")

def fetch_worker(item):
    pid, track, query = item
    vid = get_video_id(query)
    track["videoId"] = vid
    return pid, track

results = {pid: [] for pid in playlists_new_songs.keys()}

with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
    futures = [executor.submit(fetch_worker, item) for item in all_queries]
    for future in concurrent.futures.as_completed(futures):
        pid, track = future.result()
        results[pid].append(track)

print("Fetched all IDs. Now updating the TS file.")

with open("app/components/playlist-data.ts", "r", encoding="utf-8") as f:
    content = f.read()

# We will inject the new tracks into each playlist
for pid, tracks in results.items():
    # Find where the tracks array ends for this playlist
    # We look for `id: "{pid}"` then find the `tracks: [` and the matching `],`
    
    pattern = r'(id:\s*"' + pid + r'".*?tracks:\s*\[)(.*?)(\s*\]\s*,\s*\}|\s*\]\s*\})'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        prefix = match.group(1)
        existing_tracks = match.group(2)
        suffix = match.group(3)
        
        new_tracks_str = existing_tracks
        if not new_tracks_str.endswith(",") and new_tracks_str.strip():
            new_tracks_str += ","
            
        for i, t in enumerate(tracks):
            tid = f"new2-{pid}-{i}"
            film_str = f'"{t["film"]}"' if t["film"] else '""'
            new_tracks_str += f'\n      {{ id: "{tid}", title: "{t["title"]}", artist: "{t["artist"]}", film: {film_str}, year: {t["year"]}, duration: {t["duration"]}, videoId: "{t["videoId"]}" }},'
            
        new_content = content[:match.start()] + prefix + new_tracks_str + suffix + content[match.end():]
        content = new_content

with open("app/components/playlist-data.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Done updating playlist-data.ts!")
