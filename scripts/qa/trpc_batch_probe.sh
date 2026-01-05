#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="http://localhost:3012/api/trpc/auth.demoLogin?batch=1"
PROXY_URL="http://localhost:3007/api/trpc/auth.demoLogin?batch=1"
OUTDIR="/tmp/proxy_batch_probe_$(date +%s)"
mkdir -p "$OUTDIR"

declare -a payloads
payloads[0]='{"0":{"username":"manager","password":"demo123"}}'   # keyed-object
payloads[1]='[{"username":"manager","password":"demo123"}]'      # raw array
payloads[2]='[{"input":{"username":"manager","password":"demo123"}}]' # array-with-input
payloads[3]='{"0":{"input":{"username":"manager","password":"demo123"}}}' # keyed-with-input
payloads[4]='{"input":{"username":"manager","password":"demo123"}}'      # single envelope
payloads[5]='{"username":"manager","password":"demo123"}'               # plain object

i=0
for p in "${payloads[@]}"; do
  echo "=== PAYLOAD #$i ===" | tee "$OUTDIR/payload_$i.txt"
  echo "$p" | tee -a "$OUTDIR/payload_$i.txt"

  echo -e "\n--- Direct backend (HTTP) ---" | tee "$OUTDIR/result_backend_$i.txt"
  curl -i -s -X POST "$BACKEND_URL" -H "Content-Type: application/json" -d "$p" >> "$OUTDIR/result_backend_$i.txt" || true

  echo -e "\n--- Via proxy (HTTP) ---" | tee -a "$OUTDIR/result_backend_$i.txt"
  curl -i -s -X POST "$PROXY_URL" -H "Content-Type: application/json" -d "$p" >> "$OUTDIR/result_proxy_$i.txt" || true

  i=$((i+1))
done

# Save a list of outputs
ls -l "$OUTDIR" > "$OUTDIR/summary.txt"
echo "$OUTDIR"

