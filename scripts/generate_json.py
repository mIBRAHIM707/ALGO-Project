import pandas as pd
import json
import numpy as np
import math

def clean_str(s):
    if pd.isna(s):
        return "MISSING"
    return str(s).strip()

def clean_int(val, default=0):
    if pd.isna(val) or val == "MISSING":
        return default
    try:
        return int(float(val))
    except:
        return default

# Load data
courses_df = pd.read_csv('courses.csv').fillna("MISSING")
timeslots_df = pd.read_csv('timeslots.csv').fillna("MISSING")
rooms_df = pd.read_excel('rooms.xlsx').fillna("MISSING")

# Clean strings
for col in courses_df.columns:
    if courses_df[col].dtype == object:
        courses_df[col] = courses_df[col].apply(clean_str)

for col in timeslots_df.columns:
    if timeslots_df[col].dtype == object:
        timeslots_df[col] = timeslots_df[col].apply(clean_str)

for col in rooms_df.columns:
    if rooms_df[col].dtype == object:
        rooms_df[col] = rooms_df[col].apply(clean_str)

# 1. Courses
courses = []
for _, row in courses_df.iterrows():
    courses.append({
        "id": row.get('code', "MISSING"),
        "title": row.get('title', "MISSING"),
        "program": row.get('program', "MISSING"),
        "creditHours": clean_int(row.get('credit_hours'), 3),
        "type": row.get('type', "MISSING"),
        "capacity": clean_int(row.get('capacity'), 40),
        "section": row.get('section', "MISSING"),
        "instructor": row.get('instructor', "MISSING")
    })

# 2. Teachers
teachers_map = {}
for c in courses:
    inst = c["instructor"]
    if inst and inst != "MISSING":
        if inst not in teachers_map:
            teachers_map[inst] = {
                "name": inst,
                "programs": set(),
                "courseIds": set()
            }
        teachers_map[inst]["programs"].add(c["program"])
        teachers_map[inst]["courseIds"].add(c["id"])

teachers = []
t_idx = 1
for inst, data in teachers_map.items():
    dep = list(data["programs"])[0] if data["programs"] else "MISSING" # simplest inference
    teachers.append({
        "id": f"T{t_idx:02d}",
        "name": data["name"],
        "department": dep,
        "courseIds": list(data["courseIds"])
    })
    t_idx += 1

# 3. Rooms
rooms = []
for _, row in rooms_df.iterrows():
    rooms.append({
        "id": row.get('room_id', "MISSING"),
        "name": row.get('room_name', "MISSING"),
        "building": row.get('building', "MISSING"),
        "type": row.get('type', "MISSING"),
        "capacity": clean_int(row.get('capacity', 40))
    })

# 4. Sections
sections_map = {}
for c in courses:
    sec = c["section"]
    prog = c["program"]
    if sec and sec != "MISSING":
        if sec not in sections_map:
            sections_map[sec] = {
                "program": prog,
                "courseIds": set()
            }
        sections_map[sec]["courseIds"].add(c["id"])

sections = []
for sec_id, data in sections_map.items():
    sections.append({
        "id": sec_id,
        "program": data["program"],
        "courseIds": list(data["courseIds"])
    })

# 5. TimeSlots
timeslots = []
for _, row in timeslots_df.iterrows():
    timeslots.append({
        "id": row.get('slot_id', "MISSING"),
        "day": row.get('day', "MISSING"),
        "startTime": row.get('start_time', "MISSING"),
        "endTime": row.get('end_time', "MISSING"),
        "slotIndex": clean_int(row.get('slot_index'), 0),
        "dayType": row.get('day_type', "MISSING")
    })

final_json = {
    "courses": courses,
    "teachers": teachers,
    "rooms": rooms,
    "sections": sections,
    "timeSlots": timeslots
}

with open('gik-data.json', 'w') as f:
    json.dump(final_json, f, indent=2)

print("Created gik-data.json successfully.")
