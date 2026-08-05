import sys

filename = "src/lib/stores/workerHealth.store.ts"
with open(filename, "r") as f:
    content = f.read()

content = content.replace(" | 'crypto'", " | 'crypto' | 'regex'")

with open(filename, "w") as f:
    f.write(content)
