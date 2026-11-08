#!/usr/bin/env bash
#
# End-to-end API smoke test for Wonderlust.
#
# Exercises authentication (register, login, session, logout), every API
# endpoint, CRUD flows, ownership/authorization rules and rate limiting against
# a running server and a real PostgreSQL database.
#
# Usage:
#   npm run build && npm start &        # or: npm run dev
#   ./scripts/api-smoke.sh
#
# Env:
#   BASE  — server origin (default http://127.0.0.1:3000)

set -uo pipefail

BASE="${BASE:-http://127.0.0.1:3000}"
STAMP="$(date +%s)-$$"
USER_A="smoke-a-${STAMP}@wonderlust.test"
USER_B="smoke-b-${STAMP}@wonderlust.test"
PASSWORD="Wonderlust123!"

JAR_A="$(mktemp)"
JAR_B="$(mktemp)"
BODY="$(mktemp)"
PASSED=0
FAILED=0
SKIPPED=0

json() { node -e '
  let raw = "";
  process.stdin.on("data", (chunk) => (raw += chunk));
  process.stdin.on("end", () => {
    try {
      const value = process.argv[1].split(".").reduce((acc, key) => acc?.[key], JSON.parse(raw));
      process.stdout.write(value === undefined || value === null ? "" : String(value));
    } catch {
      process.stdout.write("");
    }
  });
' "$1"; }

check() { # label expected actual
  if [ "$3" = "$2" ]; then
    echo "PASS  [$3] $1"
    PASSED=$((PASSED + 1))
  else
    echo "FAIL  [$3, expected $2] $1"
    FAILED=$((FAILED + 1))
  fi
}

req() { # method path expected label [json-body] [jar]
  local method="$1" path="$2" expected="$3" label="$4"
  local data="${5:-}" jar="${6:-$JAR_A}"
  local code
  if [ -n "$data" ]; then
    code=$(curl -sS -o "$BODY" -w "%{http_code}" -X "$method" "$BASE$path" \
      -H "Content-Type: application/json" -b "$jar" -c "$jar" -d "$data")
  else
    code=$(curl -sS -o "$BODY" -w "%{http_code}" -X "$method" "$BASE$path" \
      -b "$jar" -c "$jar")
  fi
  check "$label" "$expected" "$code"
}

body_field() { json "$1" < "$BODY"; }

login() { # jar email password → "ok" | "fail"
  local jar="$1" email="$2" password="$3" csrf code location
  csrf=$(curl -sS -c "$jar" "$BASE/api/auth/csrf" | json csrfToken)
  location=$(curl -sS -o /dev/null -w "%{redirect_url}" -b "$jar" -c "$jar" \
    -X POST "$BASE/api/auth/callback/credentials" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    --data-urlencode "csrfToken=$csrf" \
    --data-urlencode "email=$email" \
    --data-urlencode "password=$password" \
    --data-urlencode "callbackUrl=$BASE/dashboard")
  code=$(curl -sS -o /dev/null -w "%{http_code}" -b "$jar" "$BASE/api/auth/session")
  # A successful sign-in leaves a session that carries the user's email.
  local session_email
  session_email=$(curl -sS -b "$jar" "$BASE/api/auth/session" | json user.email)
  if [ "$code" = "200" ] && [ "$session_email" = "$email" ] \
    && [[ "$location" != *"error"* ]]; then
    echo "ok"
  else
    echo "fail"
  fi
}

echo "== Wonderlust API smoke test =="
echo "Base: $BASE"
echo "User A: $USER_A"
echo "User B: $USER_B"
echo

echo "-- Public endpoints --"
req GET /api/destinations 200 "GET /api/destinations (public list)"
DEST_ID=$(body_field "destinations.0.id")
check "destinations list is non-empty" "true" "$([ -n "$DEST_ID" ] && echo true || echo false)"
DEST_SLUG=$(body_field "destinations.0.slug")
req GET "/api/destinations/$DEST_SLUG" 200 "GET /api/destinations/:slug"
req GET "/api/destinations/does-not-exist-xyz" 404 "GET missing destination → 404"
req GET "/api/destinations?search=kyoto&limit=5" 200 "GET /api/destinations?search="
req GET /api/trips 200 "GET /api/trips (public featured)"
req GET /api/reviews 200 "GET /api/reviews (public list)"

echo
echo "-- Unauthenticated access is rejected --"
req GET /api/users 401 "GET /api/users without session"
req GET /api/saved/destinations 401 "GET /api/saved/destinations without session"
req GET "/api/trips?mine=1" 401 "GET /api/trips?mine=1 without session"
req GET /api/bookings 401 "GET /api/bookings without session"
req POST /api/trips 401 "POST /api/trips without session" '{"title":"x"}'
req POST /api/reviews 401 "POST /api/reviews without session" '{"destinationId":"x","rating":5}'
req POST /api/bookings 401 "POST /api/bookings without session" '{"tripId":"x"}'

echo
echo "-- Registration validation --"
req POST /api/auth/register 400 "register with invalid email" \
  '{"email":"not-an-email","password":"Wonderlust123!","confirmPassword":"Wonderlust123!"}'
req POST /api/auth/register 400 "register with short password" \
  '{"email":"short@wonderlust.test","password":"short","confirmPassword":"short"}'
req POST /api/auth/register 400 "register with mismatched passwords" \
  '{"email":"mismatch@wonderlust.test","password":"Wonderlust123!","confirmPassword":"Different123!"}'
req POST /api/auth/register 201 "register user A" \
  "{\"email\":\"$USER_A\",\"password\":\"$PASSWORD\",\"confirmPassword\":\"$PASSWORD\"}"
USER_A_ID=$(body_field "user.id")
req POST /api/auth/register 409 "register duplicate email → 409" \
  "{\"email\":\"$USER_A\",\"password\":\"$PASSWORD\",\"confirmPassword\":\"$PASSWORD\"}"
req POST /api/auth/register 201 "register user B" \
  "{\"email\":\"$USER_B\",\"password\":\"$PASSWORD\",\"confirmPassword\":\"$PASSWORD\"}" "" "$JAR_B"

echo
echo "-- Login and session --"
check "login with wrong password fails" "fail" "$(login "$JAR_A" "$USER_A" "WrongPassword1!")"
req GET /api/users 401 "session absent after failed login"
check "login user A" "ok" "$(login "$JAR_A" "$USER_A" "$PASSWORD")"
check "login user B" "ok" "$(login "$JAR_B" "$USER_B" "$PASSWORD")"
req GET /api/auth/session 200 "GET /api/auth/session"
check "session carries user A email" "$USER_A" "$(body_field "user.email")"
req GET /api/users 200 "GET /api/users (own profile)"
check "profile belongs to user A" "$USER_A" "$(body_field "user.email")"

echo
echo "-- Profile update --"
req PUT /api/users 200 "PUT /api/users (update name)" '{"name":"Smoke Tester"}' "$JAR_A"
check "name was persisted" "Smoke Tester" "$(body_field "user.name")"
req PUT /api/users 400 "PUT /api/users with empty body → 400" '{}' "$JAR_A"
req PUT /api/users 400 "PUT /api/users with wrong type → 400" '{"name":123}' "$JAR_A"

echo
echo "-- Saved destinations --"
req POST /api/saved/destinations 201 "save a destination" \
  "{\"destinationId\":\"$DEST_ID\"}" "$JAR_A"
SAVED_ID=$(body_field "saved.id")
req POST /api/saved/destinations 409 "save the same destination twice → 409" \
  "{\"destinationId\":\"$DEST_ID\"}" "$JAR_A"
req GET /api/saved/destinations 200 "list saved destinations" "" "$JAR_A"
check "saved list has one entry" "1" "$(body_field "pagination.total")"
req GET /api/saved/destinations 200 "user B list is scoped" "" "$JAR_B"
check "user B sees no saved destinations" "0" "$(body_field "pagination.total")"
req DELETE "/api/saved/destinations/$SAVED_ID" 404 "user B cannot delete user A's saved entry (404, no leakage)" "" "$JAR_B"
req DELETE "/api/saved/destinations/$SAVED_ID" 200 "unsave destination" "" "$JAR_A"
req DELETE "/api/saved/destinations/$SAVED_ID" 404 "unsave again → 404" "" "$JAR_A"

echo
echo "-- Trips CRUD and ownership --"
START=$(date -u -d "+30 days" +%Y-%m-%dT00:00:00.000Z)
END=$(date -u -d "+37 days" +%Y-%m-%dT00:00:00.000Z)
req POST /api/trips 400 "create trip with invalid budget → 400" \
  "{\"title\":\"Bad budget\",\"destinationId\":\"$DEST_ID\",\"startDate\":\"$START\",\"endDate\":\"$END\",\"budget\":\"platinum\"}" "$JAR_A"
req POST /api/trips 400 "create trip with end before start → 400" \
  "{\"title\":\"Bad dates\",\"destinationId\":\"$DEST_ID\",\"startDate\":\"$END\",\"endDate\":\"$START\",\"budget\":\"standard\"}" "$JAR_A"
req POST /api/trips 404 "create trip for unknown destination → 404" \
  '{"title":"Nowhere","destinationId":"missing","startDate":"'"$START"'","endDate":"'"$END"'","budget":"standard"}' "$JAR_A"
req POST /api/trips 201 "create trip" \
  "{\"title\":\"Smoke Test Trip\",\"destinationId\":\"$DEST_ID\",\"startDate\":\"$START\",\"endDate\":\"$END\",\"travelers\":2,\"budget\":\"luxury\",\"price\":1500}" "$JAR_A"
TRIP_ID=$(body_field "trip.id")
check "trip belongs to user A" "$USER_A_ID" "$(body_field "trip.userId")"
check "trip duration derived from dates" "7" "$(body_field "trip.durationDays")"

req GET "/api/trips?mine=1" 200 "list own trips" "" "$JAR_A"
check "own trip list contains the trip" "1" "$(body_field "pagination.total")"
req GET "/api/trips?user_id=$USER_A_ID" 403 "cannot list another user's trips by id" "" "$JAR_B"
req GET "/api/trips?mine=1" 200 "user B trip list is scoped" "" "$JAR_B"
check "user B has no trips" "0" "$(body_field "pagination.total")"

req GET "/api/trips/$TRIP_ID" 200 "owner can read private trip" "" "$JAR_A"
req GET "/api/trips/$TRIP_ID" 404 "other user cannot read private trip (404)" "" "$JAR_B"
req PUT "/api/trips/$TRIP_ID" 403 "other user cannot update trip" '{"title":"Hijacked"}' "$JAR_B"
req DELETE "/api/trips/$TRIP_ID" 403 "other user cannot delete trip" "" "$JAR_B"
req PUT "/api/trips/$TRIP_ID" 200 "owner updates trip" '{"title":"Updated Smoke Trip","travelers":3}' "$JAR_A"
check "trip title updated" "Updated Smoke Trip" "$(body_field "trip.title")"
req PUT "/api/trips/$TRIP_ID" 400 "update with empty body → 400" '{}' "$JAR_A"
req PUT "/api/trips/$TRIP_ID" 400 "update with invalid date range → 400" \
  "{\"startDate\":\"$END\",\"endDate\":\"$START\"}" "$JAR_A"

echo
echo "-- Bookings --"
req POST /api/bookings 404 "book unknown trip → 404" '{"tripId":"missing"}' "$JAR_A"
req POST /api/bookings 201 "create booking" "{\"tripId\":\"$TRIP_ID\",\"travelers\":2}" "$JAR_A"
BOOKING_ID=$(body_field "booking.id")
check "booking status starts pending" "pending" "$(body_field "booking.status")"
check "booking total derived server-side" "3000" "$(body_field "booking.totalPrice")"
req GET /api/bookings 200 "list own bookings" "" "$JAR_A"
check "booking list contains the booking" "1" "$(body_field "pagination.total")"
req GET "/api/bookings/$BOOKING_ID" 403 "other user cannot read booking" "" "$JAR_B"
req PATCH "/api/bookings/$BOOKING_ID" 403 "customer cannot confirm own booking" '{"status":"confirmed"}' "$JAR_A"
req PATCH "/api/bookings/$BOOKING_ID" 200 "customer cancels booking" '{"status":"cancelled"}' "$JAR_A"
req PATCH "/api/bookings/$BOOKING_ID" 409 "cannot cancel twice → 409" '{"status":"cancelled"}' "$JAR_A"
req DELETE "/api/bookings/$BOOKING_ID" 200 "delete booking" "" "$JAR_A"
req GET "/api/bookings/$BOOKING_ID" 404 "deleted booking → 404" "" "$JAR_A"

echo
echo "-- Reviews --"
req POST /api/reviews 400 "review with rating 6 → 400" \
  "{\"destinationId\":\"$DEST_ID\",\"rating\":6}" "$JAR_A"
req POST /api/reviews 201 "create review" \
  "{\"destinationId\":\"$DEST_ID\",\"rating\":4,\"comment\":\"Lovely trip\"}" "$JAR_A"
REVIEW_ID=$(body_field "review.id")
req POST /api/reviews 409 "duplicate review → 409" \
  "{\"destinationId\":\"$DEST_ID\",\"rating\":5}" "$JAR_A"
req GET "/api/reviews?destination_id=$DEST_ID" 200 "list reviews for destination"
req DELETE "/api/reviews/$REVIEW_ID" 403 "other user cannot delete review" "" "$JAR_B"
req DELETE "/api/reviews/$REVIEW_ID" 200 "author deletes review" "" "$JAR_A"

echo
echo "-- Trip deletion --"
req DELETE "/api/trips/$TRIP_ID" 200 "owner deletes trip" "" "$JAR_A"
req GET "/api/trips/$TRIP_ID" 404 "deleted trip → 404" "" "$JAR_A"

echo
echo "-- Password reset request --"
req POST /api/auth/forgot-password 400 "forgot-password validates email" '{"email":"nope"}'
req POST /api/auth/forgot-password 200 "forgot-password is generic for a known address" \
  "{\"email\":\"$USER_A\"}"
RESET_URL=$(body_field devResetUrl)
if [ -n "$RESET_URL" ]; then
  check "a reset link was generated (development mode)" "true" "true"
else
  echo "SKIP  reset link is only exposed by a development server (got a production-style response)"
  SKIPPED=$((SKIPPED + 1))
fi
req POST /api/auth/forgot-password 200 "unknown address returns the same response" \
  '{"email":"nobody-here@wonderlust.test"}'
check "unknown address gets no reset link" "" "$(body_field devResetUrl)"
FORGOT_IP_CODE=$(curl -sS -o "$BODY" -w "%{http_code}" -X POST "$BASE/api/auth/forgot-password" \
  -H "Content-Type: application/json" -d '{"email":"flood@wonderlust.test"}')
check "forgot-password rate limited" "429" "$FORGOT_IP_CODE"

RESET_TOKEN=$(node -e 'try { process.stdout.write(new URL(process.argv[1]).searchParams.get("token") || ""); } catch { process.stdout.write(""); }' "$RESET_URL")

echo
echo "-- Registration rate limiting --"
RATE_CODE=""
for i in 1 2 3 4 5 6; do
  RATE_CODE=$(curl -sS -o "$BODY" -w "%{http_code}" -X POST "$BASE/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"flood-$i-${STAMP}@wonderlust.test\",\"password\":\"Wonderlust123!\",\"confirmPassword\":\"Wonderlust123!\"}")
done
check "register rate limited after 10 attempts" "429" "$RATE_CODE"

echo
echo "-- Logout --"
LOGOUT_CSRF=$(curl -sS -b "$JAR_A" -c "$JAR_A" "$BASE/api/auth/csrf" | json csrfToken)
curl -sS -o /dev/null -b "$JAR_A" -c "$JAR_A" -X POST "$BASE/api/auth/signout" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "csrfToken=$LOGOUT_CSRF" >/dev/null
req GET /api/users 401 "session cleared after sign out" "" "$JAR_A"

echo
echo "-- Password reset completion --"
NEW_PASSWORD="Wonderlust456!"
req POST /api/auth/reset-password 400 "unknown reset token → 400" \
  '{"token":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","password":"Wonderlust456!","confirmPassword":"Wonderlust456!"}'

if [ -z "${RESET_URL:-}" ]; then
  echo "SKIP  reset completion (no token available on a production-mode server)"
  SKIPPED=$((SKIPPED + 1))
else
req POST /api/auth/reset-password 400 "weak new password → 400" \
  "{\"token\":\"$RESET_TOKEN\",\"password\":\"short\",\"confirmPassword\":\"short\"}"
req POST /api/auth/reset-password 400 "mismatched new passwords → 400" \
  "{\"token\":\"$RESET_TOKEN\",\"password\":\"$NEW_PASSWORD\",\"confirmPassword\":\"Different456!\"}"
req POST /api/auth/reset-password 200 "reset password with a valid token" \
  "{\"token\":\"$RESET_TOKEN\",\"password\":\"$NEW_PASSWORD\",\"confirmPassword\":\"$NEW_PASSWORD\"}"
req POST /api/auth/reset-password 400 "token is single-use → 400 on replay" \
  "{\"token\":\"$RESET_TOKEN\",\"password\":\"$NEW_PASSWORD\",\"confirmPassword\":\"$NEW_PASSWORD\"}"
check "login with the old password now fails" "fail" "$(login "$JAR_A" "$USER_A" "$PASSWORD")"
check "login with the new password works" "ok" "$(login "$JAR_A" "$USER_A" "$NEW_PASSWORD")"
req GET /api/users 200 "new password session can read the profile" "" "$JAR_A"
fi

rm -f "$JAR_A" "$JAR_B" "$BODY"

echo
echo "======================================"
echo "Passed: $PASSED   Failed: $FAILED   Skipped: $SKIPPED"
echo "======================================"
[ "$FAILED" -eq 0 ]
