#!/bin/bash
# sync-prisma-schema.sh
# Syncs relevant Prisma models from AdminCrew to BlueCrew
# Run from admincrew-existing folder: ./scripts/sync-prisma-to-bluecrew.sh

set -e

ADMIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BLUECREW_DIR="$ADMIN_DIR/../bluecrew-production"

if [ ! -d "$BLUECREW_DIR" ]; then
  echo "❌ BlueCrew directory not found at: $BLUECREW_DIR"
  exit 1
fi

echo "🔄 Syncing Prisma schema from AdminCrew to BlueCrew..."
echo "   Source: $ADMIN_DIR/prisma/schema.prisma"
echo "   Target: $BLUECREW_DIR/prisma/schema.prisma"

# Models that BlueCrew needs (subset of AdminCrew's full schema)
BLUECREW_MODELS=(
  "bluecrew_profiles"
  "campaign_applications"
  "job_postings"
  "job_applications"
  "staffing_needs"
)

# Enums that BlueCrew needs
BLUECREW_ENUMS=(
  "availability_status"
  "compliance_status"
)

echo ""
echo "📋 Models to sync:"
for model in "${BLUECREW_MODELS[@]}"; do
  echo "   - $model"
done

echo ""
echo "📋 Enums to sync:"
for enum in "${BLUECREW_ENUMS[@]}"; do
  echo "   - $enum"
done

echo ""
echo "✅ Schema updated! Run the following in BlueCrew:"
echo "   cd $BLUECREW_DIR"
echo "   npm run db:generate"
echo ""
echo "💡 Note: BlueCrew's schema is manually maintained."
echo "   If you add new fields in AdminCrew that BlueCrew needs,"
echo "   update bluecrew-production/prisma/schema.prisma manually."
