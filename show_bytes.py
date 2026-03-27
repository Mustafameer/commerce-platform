#!/usr/bin/env python3

with open('server.ts', 'r') as f:
    lines = f.readlines()

# Look at raw bytes for lines around 7295
for i in range(7285, min(7310, len(lines))):
    raw = lines[i]
    print(f"{i+1:5d}: {repr(raw)[:180]}")
