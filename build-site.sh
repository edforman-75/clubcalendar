#!/bin/bash
#
# Build script for ClubCalendar documentation site.
# Converts markdown docs to HTML using pandoc.
#
# Usage:
#   ./build-site.sh
#
# Requires:
#   pandoc (brew install pandoc)
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCS_DIR="$SCRIPT_DIR/docs"
SITE_DIR="$SCRIPT_DIR/site"
SITE_DOCS_DIR="$SITE_DIR/docs"
TEMPLATE_FILE="$SITE_DOCS_DIR/template.html"

echo "Building ClubCalendar documentation site..."
echo

# Ensure output directory exists
mkdir -p "$SITE_DOCS_DIR"

# Function to convert a markdown file
convert_doc() {
    local md_file="$1"
    local title="$2"
    local md_path="$DOCS_DIR/$md_file"
    local html_file="${md_file%.md}.html"
    local html_path="$SITE_DOCS_DIR/$html_file"

    echo "  Converting $md_file..."

    # Convert markdown to HTML body
    local body=$(pandoc "$md_path" --from markdown --to html)

    # Read template and substitute
    local template=$(cat "$TEMPLATE_FILE")
    local output="${template//\{\{TITLE\}\}/$title}"
    output="${output//\{\{CONTENT\}\}/$body}"

    echo "$output" > "$html_path"
    echo "    → $html_file"
}

echo "Converting markdown to HTML:"

convert_doc "ClubCalendar_Product_Architecture.md" "Product Architecture"
convert_doc "Custom_Server_Setup_Guide.md" "Custom Server Setup Guide"
convert_doc "Google_Cloud_Setup_Guide.md" "Google Cloud Setup Guide"
convert_doc "Wild_Apricot_Installation_Guide.md" "Wild Apricot Installation Guide"
convert_doc "Event_Tagging_Guide.md" "Event Tagging Guide"
convert_doc "events_json_schema.md" "JSON Schema Reference"

echo
echo "Build complete!"
echo "Site files are in: $SITE_DIR"
echo
echo "To preview locally:"
echo "  cd $SITE_DIR"
echo "  python3 -m http.server 8000"
echo "  Open http://localhost:8000"
