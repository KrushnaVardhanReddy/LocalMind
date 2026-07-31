import json

with open('package.json', 'r') as f:
    data = json.load(f)

data['scripts']['test'] = 'vitest run'

with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)
