"""
GIK Institute Timetable Data Generator
=======================================
Section ID = PROG-Y{year}-{letter}  (e.g. BME-Y1-A) — student sub-group
Course  ID = baseCode-{letter}      (e.g. CS112-A)   — physical class
Credit hours from courses.csv. Y5/Y6 excluded.
"""

import openpyxl, json, re, csv

# 1. Load credit hours
credit_map = {}
with open(r'data\courses.csv', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        code = row['code'].strip().upper()
        try:
            ch = int(float(row['credit_hours']))
        except (ValueError, KeyError):
            ch = 3
        if code and code not in credit_map:
            credit_map[code] = ch

# 2. Helpers
PROG_MAP = {
    'Civil': 'CVE', 'Computer Science': 'BCS',
    'Computer Engineering': 'BCE', 'Artificial Intelligence': 'BAI',
    'Data Science': 'BDS', 'Electrical': 'BEE',
    'Engineering Sciences': 'BES', 'Mechanical': 'BME',
    'Management': 'MGS', 'Materials': 'MTE',
    'Cyber': 'CYS', 'Software': 'SE', 'Chemical': 'CHE',
}

def get_prog(full_name):
    for k, v in PROG_MAP.items():
        if k in str(full_name): return v
    return 'GEN'

def get_year(full_name):
    m = re.search(r'20(\d\d)', str(full_name))
    if not m: return None
    year = 2026 - int(m.group(0))
    return year if 1 <= year <= 4 else None

def extract_base_code(raw_course):
    text = str(raw_course)
    if ' - ' in text:
        for part in text.split(' - '):
            if re.match(r'^[A-Za-z]+-\d+', part.strip()):
                text = part.strip(); break
    m = re.match(r'^([A-Za-z]+)-(\d+)(?:-L)?', text.strip())
    if not m: return None
    prefix = m.group(1).upper()
    number = m.group(2)
    is_lab = bool(re.search(r'-L\b', text))
    return f"{prefix}{number}{'L' if is_lab else ''}"

def extract_title(raw_course):
    text = str(raw_course)
    if ' - ' in text: text = text.split(' - ')[-1].strip()
    title = re.sub(r'^[A-Za-z]+-\d+(-L)?-?\s*', '', text).strip()
    return title if title else text

# 3. Process Excel
wb = openpyxl.load_workbook(r'data\Spring 2026 Courses List with Class Strength.xlsx')
ws = wb['All']
rows = list(ws.iter_rows(values_only=True))[1:]

courses_map = {}
teachers_map = {}
sections_map = {}

for row in rows:
    if not row[0]: continue
    raw_course     = row[1]
    section_letter = str(row[2]).strip() if row[2] else None
    program        = row[3]
    instructor     = row[4]
    class_size     = row[5]
    ctype          = row[8]
    if not raw_course or not section_letter or not program: continue

    year = get_year(str(program))
    if year is None: continue

    base_code = extract_base_code(str(raw_course))
    if not base_code: continue

    course_id  = f"{base_code}-{section_letter}"
    prog_short = get_prog(str(program))
    section_id = f"{prog_short}-Y{year}-{section_letter}"

    title  = extract_title(str(raw_course))
    is_lab = (str(ctype).strip().lower() == 'lab' or
              base_code.endswith('L') or 'lab' in title.lower())
    ch  = credit_map.get(base_code, 1 if is_lab else 3)
    cap = int(class_size) if class_size and str(class_size).strip().isdigit() else 40
    instr = re.sub(r'\s*\(.*?\)', '', str(instructor)).strip() if instructor else 'TBA'
    if not instr: instr = 'TBA'

    if course_id not in courses_map:
        courses_map[course_id] = {
            "id": course_id, "title": title, "program": prog_short,
            "creditHours": ch, "type": "lab" if is_lab else "lecture",
            "capacity": cap, "instructor": instr,
        }

    if section_id not in sections_map:
        sections_map[section_id] = {"courseIds": set(), "program": prog_short}
    sections_map[section_id]["courseIds"].add(course_id)

    if instr and instr != 'TBA':
        if instr not in teachers_map:
            teachers_map[instr] = {"department": prog_short, "courseIds": set()}
        teachers_map[instr]["courseIds"].add(course_id)

# 4. Build output
courses  = list(courses_map.values())
teachers = [{"id": f"T{i+1:03d}", "name": n, "department": d["department"],
             "courseIds": list(d["courseIds"])}
            for i, (n, d) in enumerate(teachers_map.items())]
sections = [{"id": sid, "program": s["program"], "courseIds": list(s["courseIds"])}
            for sid, s in sections_map.items()]

with open(r'data\gik-data-spring2026.json') as f:
    existing = json.load(f)

output = {"courses": courses, "teachers": teachers,
          "rooms": existing["rooms"], "sections": sections,
          "timeSlots": existing["timeSlots"]}

with open(r'data\gik-data-spring2026.json', 'w') as f:
    json.dump(output, f, indent=2)

print(f"Courses:  {len(courses)}")
print(f"Teachers: {len(teachers)}")
print(f"Sections: {len(sections)}")
for s in sorted(sections, key=lambda x: x['id']):
    print(f"  {s['id']:15s} | {len(s['courseIds']):2d} courses")