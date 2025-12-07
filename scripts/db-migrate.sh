#!/usr/bin/env bash
#
# Database Migration Script for Thoughtbox
# =========================================
#
# This script handles the Drizzle ORM migration workflow:
#
# USAGE:
#   ./scripts/db-migrate.sh [command]
#
# COMMANDS:
#   generate    Generate new migration from schema changes (default)
#   status      Show current migration status
#   apply       Apply pending migrations (runs on server startup too)
#   drop        Drop all tables and reset (DESTRUCTIVE - dev only)
#   help        Show this help message
#
# WORKFLOW:
#   1. Edit src/persistence/db/schema.ts with your changes
#   2. Run: ./scripts/db-migrate.sh generate
#   3. Review the generated SQL in drizzle/
#   4. Build: npm run build
#   5. Migrations apply automatically on server startup
#
# FILES:
#   drizzle/
#   ├── XXXX_name.sql          # Migration SQL files
#   └── meta/
#       ├── _journal.json      # Migration history
#       └── XXXX_snapshot.json # Schema snapshots (required by Drizzle)
#
# NOTE: Never manually create migration files - always use drizzle-kit generate!
#       Drizzle requires snapshot files that only it can create properly.
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  Thoughtbox Database Migration Tool${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

show_help() {
    head -35 "$0" | tail -33 | sed 's/^# //' | sed 's/^#//'
}

show_status() {
    print_header
    echo ""
    print_info "Schema file: src/persistence/db/schema.ts"
    print_info "Migrations dir: drizzle/"
    echo ""
    
    echo -e "${YELLOW}Current migrations:${NC}"
    if [ -f "drizzle/meta/_journal.json" ]; then
        # Parse journal and show migrations
        cat drizzle/meta/_journal.json | grep -E '"tag"' | sed 's/.*"tag": "/  - /' | sed 's/".*//'
    else
        echo "  (no migrations found)"
    fi
    echo ""
    
    echo -e "${YELLOW}Schema tables:${NC}"
    grep -E "^export const .* = sqliteTable" src/persistence/db/schema.ts | \
        sed 's/export const /  - /' | sed "s/ = sqliteTable.*//"
    echo ""
}

generate_migration() {
    print_header
    echo ""
    print_info "Generating migration from schema changes..."
    echo ""
    
    # Run drizzle-kit generate
    npx drizzle-kit generate
    
    echo ""
    print_success "Migration generated!"
    echo ""
    
    # Show what was created
    echo -e "${YELLOW}Generated files:${NC}"
    ls -la drizzle/*.sql | tail -1 | awk '{print "  - " $NF}'
    echo ""
    
    print_info "Next steps:"
    echo "  1. Review the generated SQL in drizzle/"
    echo "  2. Run: npm run build"
    echo "  3. Migrations will apply on server startup"
    echo ""
}

apply_migrations() {
    print_header
    echo ""
    print_info "Applying pending migrations..."
    echo ""
    
    # Run the migration via the TypeScript entry point
    npx tsx src/persistence/db/migrate.ts
    
    echo ""
    print_success "Migrations applied!"
}

drop_database() {
    print_header
    echo ""
    print_warning "This will DELETE ALL DATA in the database!"
    echo ""
    
    read -p "Are you sure? Type 'yes' to confirm: " confirm
    if [ "$confirm" != "yes" ]; then
        print_info "Cancelled."
        exit 0
    fi
    
    # Get data directory
    DATA_DIR="${THOUGHTBOX_DATA_DIR:-$HOME/.thoughtbox}"
    DB_PATH="$DATA_DIR/thoughtbox.db"
    
    if [ -f "$DB_PATH" ]; then
        rm "$DB_PATH"
        rm -f "$DB_PATH-wal" "$DB_PATH-shm"  # WAL mode files
        print_success "Database deleted: $DB_PATH"
    else
        print_warning "Database not found: $DB_PATH"
    fi
    
    print_info "Run the server to recreate with fresh migrations."
}

# Main command dispatch
case "${1:-generate}" in
    generate)
        generate_migration
        ;;
    status)
        show_status
        ;;
    apply)
        apply_migrations
        ;;
    drop)
        drop_database
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
