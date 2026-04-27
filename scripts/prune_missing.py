import json

with open('data/gik-data-fixed.json', 'r') as f:
    data = json.load(f)

valid_course_ids = set()

# Process courses
for c in data['courses']:
    valid_course_ids.add(c['id'])
    
    # section is MISSING -> remove that field entirely
    if c.get('section') == "MISSING":
        del c['section']
    
    # capacity is 0 or MISSING -> set to 40 as default
    if c.get('capacity') in [0, "MISSING", "0"]:
        c['capacity'] = 40
        
    # instructor is MISSING -> assign to a teacher called "TBA"
    if c.get('instructor') == "MISSING":
        c['instructor'] = "TBA"

# Process rooms
for r in data['rooms']:
    if r.get('capacity') in [0, "MISSING", "0"]:
        r['capacity'] = 40

# Ensure TBA teacher exists
tba_exists = any(t['name'] == 'TBA' for t in data['teachers'])
if not tba_exists:
    # Find the next available ID number just to be neat, or use 'T_TBA'
    data['teachers'].append({
        "id": "T00",
        "name": "TBA",
        "department": "TBA",
        "courseIds": []
    })

tba_teacher = next(t for t in data['teachers'] if t['name'] == 'TBA')

# Prune missing courseIds in teachers and assign TBA courses
for t in data['teachers']:
    t['courseIds'] = [cid for cid in t.get('courseIds', []) if cid in valid_course_ids]

for c in data['courses']:
    if c['instructor'] == 'TBA':
        if c['id'] not in tba_teacher['courseIds']:
            tba_teacher['courseIds'].append(c['id'])

# Prune missing courseIds in sections
for s in data['sections']:
    s['courseIds'] = [cid for cid in s.get('courseIds', []) if cid in valid_course_ids]

# Write back
with open('data/gik-data-fixed.json', 'w') as f:
    json.dump(data, f, indent=2)

print(f"Total courses: {len(data['courses'])}")
print(f"Total unique teachers: {len(data['teachers'])}")
print(f"Total rooms: {len(data['rooms'])}")
print(f"Total sections: {len(data['sections'])}")
print(f"Total time slots: {len(data['timeSlots'])}")
