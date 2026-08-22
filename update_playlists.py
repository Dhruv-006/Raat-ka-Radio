import urllib.request
import urllib.parse
import re
import json
import concurrent.futures
import os
import time

playlists_new_songs = {
    "subah-ka-sukoon": [
        {"title": "Subhanallah", "artist": "Sreerama Chandra, Shilpa Rao", "film": "Yeh Jawaani Hai Deewani", "year": 2013, "duration": 249},
        {"title": "Dil Dhadakne Do", "artist": "Joi Barua, Suraj Jagan", "film": "Zindagi Na Milegi Dobara", "year": 2011, "duration": 231},
        {"title": "Suhana Safar", "artist": "Mukesh", "film": "Madhumati", "year": 1958, "duration": 220},
        {"title": "Wake Up Sid!", "artist": "Shankar Mahadevan", "film": "Wake Up Sid", "year": 2009, "duration": 231},
        {"title": "Matargasti", "artist": "Mohit Chauhan", "film": "Tamasha", "year": 2015, "duration": 328},
        {"title": "Sooraj Dooba Hain", "artist": "Arijit Singh, Aditi Singh Sharma", "film": "Roy", "year": 2015, "duration": 264},
        {"title": "Dil Chahta Hai", "artist": "Shankar Mahadevan", "film": "Dil Chahta Hai", "year": 2001, "duration": 311},
        {"title": "Koi Kahe Kehta Rahe", "artist": "Shankar Mahadevan, Shaan, KK", "film": "Dil Chahta Hai", "year": 2001, "duration": 346},
        {"title": "Zindagi Ek Safar", "artist": "Kishore Kumar", "film": "Andaz", "year": 1971, "duration": 258},
        {"title": "Badtameez Dil", "artist": "Benny Dayal", "film": "Yeh Jawaani Hai Deewani", "year": 2013, "duration": 252},
        {"title": "Mahi Ve", "artist": "A.R. Rahman", "film": "Highway", "year": 2014, "duration": 240},
        {"title": "Der Lagi Lekin", "artist": "Shankar Mahadevan", "film": "Zindagi Na Milegi Dobara", "year": 2011, "duration": 357},
        {"title": "Senorita", "artist": "Farhan Akhtar, Hrithik Roshan, Abhay Deol", "film": "Zindagi Na Milegi Dobara", "year": 2011, "duration": 231},
        {"title": "Illahi (Reprise)", "artist": "Mohit Chauhan", "film": "Yeh Jawaani Hai Deewani", "year": 2013, "duration": 213}
    ],
    "dopahar-ki-dhoop": [
        {"title": "Te Amo", "artist": "Ash King, Sunidhi Chauhan", "film": "Dum Maaro Dum", "year": 2011, "duration": 287},
        {"title": "Sham", "artist": "Amit Trivedi, Neuman Pinto", "film": "Aisha", "year": 2010, "duration": 265},
        {"title": "Saibo", "artist": "Shreya Ghoshal, Tochi Raina", "film": "Shor in the City", "year": 2011, "duration": 196},
        {"title": "In Dino", "artist": "Soham", "film": "Life in a Metro", "year": 2007, "duration": 340},
        {"title": "O Meri Jaan", "artist": "KK", "film": "Life in a Metro", "year": 2007, "duration": 298},
        {"title": "O Gujariya", "artist": "Evangeline", "film": "Queen", "year": 2014, "duration": 272},
        {"title": "Monta Re", "artist": "Swanand Kirkire, Amitabh Bhattacharya", "film": "Lootera", "year": 2013, "duration": 238},
        {"title": "Sawaar Loon", "artist": "Monali Thakur", "film": "Lootera", "year": 2013, "duration": 256},
        {"title": "Banjara", "artist": "Mohd. Irfan", "film": "Ek Villain", "year": 2014, "duration": 336},
        {"title": "Teri Jhuki Nazar", "artist": "Shafqat Amanat Ali", "film": "Murder 3", "year": 2013, "duration": 278},
        {"title": "Pee Loon", "artist": "Mohit Chauhan", "film": "Once Upon A Time In Mumbaai", "year": 2010, "duration": 285},
        {"title": "Gubbare", "artist": "Amit Trivedi, Shilpa Rao", "film": "Ek Main Aur Ekk Tu", "year": 2012, "duration": 266},
        {"title": "Behka", "artist": "Karthik", "film": "Ghajini", "year": 2008, "duration": 313},
        {"title": "Khuda Jaane", "artist": "KK, Shilpa Rao", "film": "Bachna Ae Haseeno", "year": 2008, "duration": 333},
        {"title": "Tum Mile", "artist": "Neeraj Shridhar", "film": "Tum Mile", "year": 2009, "duration": 344}
    ],
    "chai-aur-chill": [
        {"title": "Chupke Se", "artist": "Sadhana Sargam", "film": "Saathiya", "year": 2002, "duration": 314},
        {"title": "Hawayein", "artist": "Arijit Singh", "film": "Jab Harry Met Sejal", "year": 2017, "duration": 290},
        {"title": "Safar", "artist": "Arijit Singh", "film": "Jab Harry Met Sejal", "year": 2017, "duration": 268},
        {"title": "Zehnaseeb", "artist": "Chinmayi Sripaada, Shekhar Ravjiani", "film": "Hasee Toh Phasee", "year": 2014, "duration": 215},
        {"title": "Ishq Bulaava", "artist": "Sanam Puri, Shipra Goyal", "film": "Hasee Toh Phasee", "year": 2014, "duration": 255},
        {"title": "Mitwa", "artist": "Shafqat Amanat Ali, Shankar Mahadevan", "film": "Kabhi Alvida Naa Kehna", "year": 2006, "duration": 382},
        {"title": "Tu Hi Re", "artist": "Hariharan, Kavita Krishnamurthy", "film": "Bombay", "year": 1995, "duration": 431},
        {"title": "Dilko Tumse Pyar Hua", "artist": "Roop Kumar Rathod", "film": "Rehnaa Hai Terre Dil Mein", "year": 2001, "duration": 331},
        {"title": "Tujh Mein Rab Dikhta Hai", "artist": "Roop Kumar Rathod", "film": "Rab Ne Bana Di Jodi", "year": 2008, "duration": 284},
        {"title": "Tere Mast Mast Do Nain", "artist": "Rahat Fateh Ali Khan", "film": "Dabangg", "year": 2010, "duration": 359},
        {"title": "Jashn-E-Bahaaraa", "artist": "Javed Ali", "film": "Jodhaa Akbar", "year": 2008, "duration": 315},
        {"title": "In Lamhon Ke Daaman Mein", "artist": "Sonu Nigam, Madhushree", "film": "Jodhaa Akbar", "year": 2008, "duration": 418},
        {"title": "Tere Bina", "artist": "A.R. Rahman, Chinmayi", "film": "Guru", "year": 2007, "duration": 309},
        {"title": "Tum Ho Toh", "artist": "Farhan Akhtar", "film": "Rock On!!", "year": 2008, "duration": 294},
        {"title": "Yeh Tumhari Meri Baatein", "artist": "Dominique Cerejo", "film": "Rock On!!", "year": 2008, "duration": 329}
    ],
    "shaam-ka-sheher": [
        {"title": "Aadat (Deep Blue Version)", "artist": "Jal", "film": "Kalyug", "year": 2005, "duration": 334},
        {"title": "Wo Lamhe Wo Baatein", "artist": "Atif Aslam", "film": "Zeher", "year": 2005, "duration": 314},
        {"title": "Tu Jaane Na", "artist": "Atif Aslam", "film": "Ajab Prem Ki Ghazab Kahani", "year": 2009, "duration": 338},
        {"title": "Pehli Nazar Mein", "artist": "Atif Aslam", "film": "Race", "year": 2008, "duration": 313},
        {"title": "Zara Sa", "artist": "KK", "film": "Jannat", "year": 2008, "duration": 303},
        {"title": "Kya Mujhe Pyaar Hai", "artist": "KK", "film": "Woh Lamhe", "year": 2006, "duration": 252},
        {"title": "Beete Lamhein", "artist": "KK", "film": "The Train", "year": 2007, "duration": 315},
        {"title": "Labon Ko", "artist": "KK", "film": "Bhool Bhulaiyaa", "year": 2007, "duration": 344},
        {"title": "Haan Tu Hain", "artist": "KK", "film": "Jannat", "year": 2008, "duration": 325},
        {"title": "Khuda Jaane", "artist": "KK", "film": "Bachna Ae Haseeno", "year": 2008, "duration": 333}
    ],
    "dil-se": [
        {"title": "Tujhe Dekha Toh", "artist": "Kumar Sanu, Lata Mangeshkar", "film": "DDLJ", "year": 1995, "duration": 302},
        {"title": "Ek Ladki Ko Dekha", "artist": "Kumar Sanu", "film": "1942: A Love Story", "year": 1994, "duration": 276},
        {"title": "Kuch Na Kaho", "artist": "Kumar Sanu", "film": "1942: A Love Story", "year": 1994, "duration": 376},
        {"title": "Chura Ke Dil Mera", "artist": "Kumar Sanu, Alka Yagnik", "film": "Main Khiladi Tu Anari", "year": 1994, "duration": 435},
        {"title": "Mera Dil Bhi Kitna Pagal Hai", "artist": "Kumar Sanu, Alka Yagnik", "film": "Saajan", "year": 1991, "duration": 322},
        {"title": "Tum Mile Dil Khile", "artist": "Kumar Sanu, Alka Yagnik", "film": "Criminal", "year": 1995, "duration": 358},
        {"title": "Baazigar O Baazigar", "artist": "Kumar Sanu, Alka Yagnik", "film": "Baazigar", "year": 1993, "duration": 450},
        {"title": "Dheere Dheere Se", "artist": "Kumar Sanu, Anuradha Paudwal", "film": "Aashiqui", "year": 1990, "duration": 329},
        {"title": "Tu Pyar Hai Kisi Aur Ka", "artist": "Kumar Sanu, Anuradha Paudwal", "film": "Dil Hai Ke Manta Nahin", "year": 1991, "duration": 412},
        {"title": "Adayein Bhi Hain", "artist": "Kumar Sanu, Anuradha Paudwal", "film": "Dil Hai Ke Manta Nahin", "year": 1991, "duration": 330}
    ],
    "raat-abhi-baaki-hai": [
        {"title": "Agar Tum Saath Ho", "artist": "Arijit Singh, Alka Yagnik", "film": "Tamasha", "year": 2015, "duration": 341},
        {"title": "Tum Hi Ho", "artist": "Arijit Singh", "film": "Aashiqui 2", "year": 2013, "duration": 262},
        {"title": "Channa Mereya", "artist": "Arijit Singh", "film": "Ae Dil Hai Mushkil", "year": 2016, "duration": 289},
        {"title": "Kalank Title Track", "artist": "Arijit Singh", "film": "Kalank", "year": 2019, "duration": 311},
        {"title": "Tujhe Kitna Chahne Lage", "artist": "Arijit Singh", "film": "Kabir Singh", "year": 2019, "duration": 284},
        {"title": "Khairiyat", "artist": "Arijit Singh", "film": "Chhichhore", "year": 2019, "duration": 270},
        {"title": "Shayad", "artist": "Arijit Singh", "film": "Love Aaj Kal", "year": 2020, "duration": 247},
        {"title": "Enna Sona", "artist": "Arijit Singh", "film": "OK Jaanu", "year": 2017, "duration": 213},
        {"title": "Mast Magan", "artist": "Arijit Singh", "film": "2 States", "year": 2014, "duration": 280},
        {"title": "Raabta", "artist": "Arijit Singh", "film": "Agent Vinod", "year": 2012, "duration": 244}
    ],
    "2-baje": [
        {"title": "Ghalat Fehmi", "artist": "Asim Azhar, Zenab Fatimah Sultan", "film": "Superstar", "year": 2019, "duration": 281},
        {"title": "Bol Kaffara Kya Hoga", "artist": "Sehar Gul Khan", "film": "", "year": 2018, "duration": 320},
        {"title": "Faasle", "artist": "Kaavish", "film": "Coke Studio", "year": 2017, "duration": 348},
        {"title": "Tajdar-e-Haram", "artist": "Atif Aslam", "film": "Coke Studio", "year": 2015, "duration": 612},
        {"title": "Afreen Afreen", "artist": "Rahat Fateh Ali Khan, Momina Mustehsan", "film": "Coke Studio", "year": 2016, "duration": 405},
        {"title": "Tu Kuja Man Kuja", "artist": "Shiraz Uppal, Rafaqat Ali Khan", "film": "Coke Studio", "year": 2016, "duration": 465},
        {"title": "Tera Woh Pyar", "artist": "Momina Mustehsan, Asim Azhar", "film": "Coke Studio", "year": 2016, "duration": 427},
        {"title": "Muntazir", "artist": "Momina Mustehsan, Danyal Zafar", "film": "Coke Studio", "year": 2017, "duration": 361},
        {"title": "Baaqi", "artist": "Arijit Singh", "film": "", "year": 2021, "duration": 230},
        {"title": "Aayat", "artist": "Arijit Singh", "film": "Bajirao Mastani", "year": 2015, "duration": 262}
    ],
    "highway-mode": [
        {"title": "Chaiyya Chaiyya", "artist": "Sukhwinder Singh, Sapna Awasthi", "film": "Dil Se", "year": 1998, "duration": 414},
        {"title": "Dard-E-Disco", "artist": "Sukhwinder Singh", "film": "Om Shanti Om", "year": 2007, "duration": 271},
        {"title": "Kar Har Maidaan Fateh", "artist": "Sukhwinder Singh, Shreya Ghoshal", "film": "Sanju", "year": 2018, "duration": 311},
        {"title": "Gallan Goodiyaan", "artist": "Yashita Sharma, Manish Kumar Tipu, Farhan Akhtar", "film": "Dil Dhadakne Do", "year": 2015, "duration": 296},
        {"title": "London Thumakda", "artist": "Labh Janjua, Sonu Kakkar, Neha Kakkar", "film": "Queen", "year": 2014, "duration": 230},
        {"title": "Badtameez Dil", "artist": "Benny Dayal", "film": "Yeh Jawaani Hai Deewani", "year": 2013, "duration": 252},
        {"title": "Dhinka Chika", "artist": "Mika Singh, Amrita Kak", "film": "Ready", "year": 2011, "duration": 272},
        {"title": "Character Dheela", "artist": "Neeraj Shridhar, Amrita Kak", "film": "Ready", "year": 2011, "duration": 236},
        {"title": "Subha Hone Na De", "artist": "Mika Singh, Shefali Alvares", "film": "Desi Boyz", "year": 2011, "duration": 288},
        {"title": "Desi Girl", "artist": "Shankar Mahadevan, Sunidhi Chauhan, Vishal Dadlani", "film": "Dostana", "year": 2008, "duration": 306}
    ],
    "subah-hone-wali-hai": [
        {"title": "Kabira (Encore)", "artist": "Arijit Singh, Harshdeep Kaur", "film": "Yeh Jawaani Hai Deewani", "year": 2013, "duration": 269},
        {"title": "Samjhawan", "artist": "Arijit Singh, Shreya Ghoshal", "film": "Humpty Sharma Ki Dulhania", "year": 2014, "duration": 269},
        {"title": "Main Rang Sharbaton Ka", "artist": "Atif Aslam, Chinmayi", "film": "Phata Poster Nikhla Hero", "year": 2013, "duration": 263},
        {"title": "Tere Bin", "artist": "Atif Aslam", "film": "Bas Ek Pal", "year": 2006, "duration": 285},
        {"title": "Dekhte Dekhte", "artist": "Atif Aslam", "film": "Batti Gul Meter Chalu", "year": 2018, "duration": 256},
        {"title": "O Saathi", "artist": "Atif Aslam", "film": "Baaghi 2", "year": 2018, "duration": 251},
        {"title": "Dil Diyan Gallan", "artist": "Atif Aslam", "film": "Tiger Zinda Hai", "year": 2017, "duration": 260},
        {"title": "Paniyon Sa", "artist": "Atif Aslam, Tulsi Kumar", "film": "Satyameva Jayate", "year": 2018, "duration": 236},
        {"title": "Tera Hua", "artist": "Atif Aslam", "film": "Loveyatri", "year": 2018, "duration": 214},
        {"title": "Tu Chahiye", "artist": "Atif Aslam", "film": "Bajrangi Bhaijaan", "year": 2015, "duration": 272}
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
    
    # A bit hacky but simple regex for ts structure:
    # id: "pid", ... tracks: [ ... ]
    
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
            tid = f"new-{pid}-{i}"
            film_str = f'"{t["film"]}"' if t["film"] else '""'
            new_tracks_str += f'\n      {{ id: "{tid}", title: "{t["title"]}", artist: "{t["artist"]}", film: {film_str}, year: {t["year"]}, duration: {t["duration"]}, videoId: "{t["videoId"]}" }},'
            
        new_content = content[:match.start()] + prefix + new_tracks_str + suffix + content[match.end():]
        content = new_content

with open("app/components/playlist-data.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Done updating playlist-data.ts!")
