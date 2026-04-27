import openpyxl, json, re

wb = openpyxl.load_workbook('data/List of Offered Courses Spring 2025.xlsx')
ws = wb['Sheet1']
rows = list(ws.iter_rows(values_only=True))[1:]

courses, teachers_map, sections_map = [], {}, {}

for row in rows:
    code, title, ch, section, for_prog, instructor, *_ = row
    if not code or not title: continue

    code = str(code).strip()
    title = str(title).strip()
    ch = int(ch) if ch else 3
    section = str(section).strip() if section else None
    programs = [p.strip() for p in re.split(r'[+,]', str(for_prog))] if for_prog else ['GEN']
    instructor = str(instructor).strip() if instructor else 'TBA'
    is_lab = 'lab' in title.lower() or (code.endswith('L') and not title.lower().startswith('l'))

    courses.append({
        "id": code,
        "title": title,
        "program": programs[0],
        "creditHours": ch,
        "type": "lab" if is_lab else "lecture",
        "capacity": 40,
        "instructor": instructor
    })

    # Teachers
    if instructor != 'TBA':
        if instructor not in teachers_map:
            teachers_map[instructor] = {"name": instructor, "department": programs[0], "courseIds": set()}
        teachers_map[instructor]["courseIds"].add(code)

    # Sections — one per program+section combo
    if section:
        for prog in programs:
            key = f"{prog}-{section}"
            if key not in sections_map:
                sections_map[key] = {"id": key, "program": prog, "courseIds": set()}
            sections_map[key]["courseIds"].add(code)

# Deduplicate courses by id (keep first)
seen = set()
deduped_courses = []
for c in courses:
    if c['id'] not in seen:
        seen.add(c['id'])
        deduped_courses.append(c)

teachers = [{"id": f"T{i+1:02d}", "name": n, "department": d["department"], "courseIds": list(d["courseIds"])}
            for i, (n, d) in enumerate(teachers_map.items())]

sections = [{"id": k, "program": v["program"], "courseIds": list(v["courseIds"])}
            for k, v in sections_map.items()]

# Load existing rooms + timeslots
with open('data/gik-data-with-sections.json') as f:
    existing = json.load(f)

output = {
    "courses": deduped_courses,
    "teachers": teachers,
    "rooms": existing["rooms"],
    "sections": sections,
    "timeSlots": existing["timeSlots"]
}

with open('data/gik-data-spring2025.json', 'w') as f:
    json.dump(output, f, indent=2)

print(f"Courses: {len(deduped_courses)}")
print(f"Teachers: {len(teachers)}")
print(f"Sections: {len(sections)}")
print(f"Rooms: {len(existing['rooms'])}")
print(f"TimeSlots: {len(existing['timeSlots'])}")