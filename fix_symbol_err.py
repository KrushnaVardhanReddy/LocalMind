with open('src/lib/workers/WorkerManager.ts', 'r') as f:
    text = f.read()

text = text.replace("return target[prop];", "return target[prop as keyof typeof target];")

with open('src/lib/workers/WorkerManager.ts', 'w') as f:
    f.write(text)
