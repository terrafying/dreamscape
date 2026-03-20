#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -f "$ROOT_DIR/.env.local" ]]; then
  set -a
  source "$ROOT_DIR/.env.local"
  set +a
fi

API_KEY="${STRIPE_API_KEY:-${STRIPE_SECRET_KEY:-}}"

if [[ -z "$API_KEY" ]]; then
  echo "Missing STRIPE_API_KEY or STRIPE_SECRET_KEY."
  echo "Set a test key (starts with sk_test_) in your shell or .env.local."
  exit 1
fi

if [[ "$API_KEY" != sk_test_* ]]; then
  echo "Refusing to run Stripe local triggers with non-test key: $API_KEY"
  echo "Use a test key (sk_test_...) to avoid live-mode trigger failures like tok_visa invalid token."
  exit 1
fi

if ! command -v stripe >/dev/null 2>&1; then
  echo "Stripe CLI is not installed. Install: https://docs.stripe.com/stripe-cli"
  exit 1
fi

COMMAND="${1:-}"

case "$COMMAND" in
  listen)
    exec stripe listen --api-key "$API_KEY" --forward-to localhost:3000/api/webhooks/stripe
    ;;
  trigger-checkout)
    exec stripe trigger checkout.session.completed --api-key "$API_KEY"
    ;;
  trigger-sub-updated)
    exec stripe trigger customer.subscription.updated --api-key "$API_KEY"
    ;;
  trigger-sub-deleted)
    exec stripe trigger customer.subscription.deleted --api-key "$API_KEY"
    ;;
  *)
    echo "Usage: scripts/stripe-local.sh <listen|trigger-checkout|trigger-sub-updated|trigger-sub-deleted>"
    exit 1
    ;;
esac
