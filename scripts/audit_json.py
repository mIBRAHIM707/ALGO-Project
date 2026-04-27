import json

with open('data/gik-data.json', 'r') as f:
    data = json.load(f)

report = []

# 1. Duplicate course IDs
course_id_counts = {}
for c in data['courses']:
    course_id_counts[c['id']] = course_id_counts.get(c['id'], 0) + 1
duplicates = [cid for cid, count in course_id_counts.items() if count > 1]
if duplicates:
    report.append(f"""- Found duplicate course IDs: {", ".join(duplicates)}. **Fix**: Kept only the first occurrence of each course ID.""")

# Fix 1: Deduplicate courses
seen_courses = set()
new_courses = []
for c in data['courses']:
    if c['id'] not in seen_courses:
        seen_courses.add(c['id'])
        new_courses.append(c)
data['courses'] = new_courses
valid_course_ids = set([c['id'] for c in data['courses']])

# 2. Teachers with 0 courses assigned
teachers_zero_courses = [t['id'] for t in data['teachers'] if not t['courseIds']]
if teachers_zero_courses:
    report.append(f"""- Found teachers with 0 courses assigned: {", ".join(teachers_zero_courses)}. **Fix**: Removed them.""")

# Fix 2: Remove teachers with zero courses
data['teachers'] = [t for t in data['teachers'] if t['courseIds']]

# 3. Sections with 0 courses assigned
sections_zero_courses = [s['id'] for s in data['sections'] if not s['courseIds']]
if sections_zero_courses:
    report.append(f"""- Found sections with 0 courses assigned: {", ".join(sections_zero_courses)}. **Fix**: Removed them.""")

# Fix 3: Remove sections with zero courses
data['sections'] = [s for s in data['sections'] if s['courseIds']]

# 4. Any "MISSING" values
missing_locations = []
def find_missing(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            find_missing(v, f"{path}.{k}" if path else k)
    elif isinstance(obj, list):
        for i, item in enumerate(obj):
            find_missing(item, f"{path}[{i}]")
    elif obj == "MISSING":
        missing_locations.append(path)

for section_name, section_list in data.items():
    find_missing(section_list, section_name)

if missing_locations:
    report.append(f"""- Found "MISSING" values at the following paths:\n  - """ + "\n  - ".join(missing_locations[:20]) + ("\n  - ... and more" if len(missing_locations)>20 else "") + "\n  **Fix**: Left as requested for flagging, but noted.")

# 5. Rooms with capacity 0
rooms_cap_zero = [r['id'] for r in data['rooms'] if r.get('capacity', 0) == 0]
if rooms_cap_zero:
    report.append(f"""- Found rooms with 0 capacity: {", ".join(rooms_cap_zero)}. **Fix**: Set capacity to default 40.""")

# Fix 5: Set room capacity to 40 if 0
for r in data['rooms']:
    if r.get('capacity', 0) == 0:
        r['capacity'] = 40

# 6. Course IDs referenced in sections/teachers that don't exist in the courses array
invalid_teacher_courses = []
for t in data['teachers']:
    valid_ids = [cid for cid in t['courseIds'] if cid in valid_course_ids]
    if len(valid_ids) != len(t['courseIds']):
        invalid_teacher_courses.append(t['id'])
    t['courseIds'] = valid_ids

invalid_section_courses = []
for s in data['sections']:
    valid_ids = [cid for cid in s['courseIds'] if cid in valid_course_ids]
    if len(valid_ids) != len(s['courseIds']):
        invalid_section_courses.append(s['id'])
    s['courseIds'] = valid_ids

if invalid_teacher_courses or invalid_section_courses:
    report.append(f"""- Found nonexistent course ID references in teachers ({", ".join(invalid_teacher_courses)}) and sections ({", ".join(invalid_section_courses)}). **Fix**: Removed the invalid course IDs from those arrays.""")

# 7. Instructors in courses that don't exist in teachers array
valid_teacher_names = set([t['name'] for t in data['teachers']])
courses_with_invalid_teachers = [c['id'] for c in data['courses'] if c['instructor'] not in valid_teacher_names and c['instructor'] != "MISSING"]

if courses_with_invalid_teachers:
    report.append(f"""- Found courses referencing nonexistent teachers: {", ".join(courses_with_invalid_teachers)}. **Fix**: Marked as MISSING.""")
    for c in data['courses']:
        if c['instructor'] not in valid_teacher_names and c['instructor'] != "MISSING":
            c['instructor'] = "MISSING"

with open("report.txt", "w") as f:
    f.write("\\n".join(report))

with open("data/gik-data-fixed.json", "w") as f:
    json.dump(data, f, indent=2)

print("Done")
