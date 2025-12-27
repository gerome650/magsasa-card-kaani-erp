# PR-8: Flow Compiler

## Summary

This PR implements a Markdown-to-JSON flow compiler that allows non-developers (like John/Pepoy) to author KaAni flows in a simple Markdown format and compile them into validated Flow Package JSON files.

## Features

- **Markdown Authoring Format**: Simple, readable format with YAML frontmatter and sections for slots/steps
- **Compiler CLI**: `pnpm flow:compile <pathToMd>` - compiles Markdown to JSON
- **Validator CLI**: `pnpm flow:validate` - validates all flow JSON files against Zod schema
- **Watch Mode**: `pnpm flow:watch <pathToMd>` - recompiles on file changes (optional)
- **Error Messages**: Clear, actionable errors with file + line number references
- **Deterministic Output**: Same input always produces identical JSON (stable ordering, consistent formatting)

## Files Changed

### New Files
- `scripts/flow-compiler/compile.ts` - Main compiler CLI
- `scripts/flow-compiler/parseMarkdown.ts` - Markdown parser
- `scripts/flow-compiler/normalize.ts` - Flow package normalizer (stable ordering)
- `scripts/flow-compiler/errors.ts` - Error handling utilities
- `scripts/flow-compiler/validate.ts` - Flow validator CLI
- `scripts/flow-compiler/watch.ts` - Watch mode CLI
- `templates/flow_authoring_template.md` - Authoring template
- `templates/example_farmer_flow.md` - Example farmer flow
- `templates/example_loan_officer_flow.md` - Example loan officer flow
- `docs/PR8_NOTES.md` - This file
- `docs/JOHN_FLOW_AUTHORING_GUIDE.md` - Authoring guide

### Modified Files
- `package.json` - Added `flow:compile`, `flow:validate`, `flow:watch` scripts
- Added dependency: `glob` (dev) for file globbing in validator

## Usage

### Compile a Flow
```bash
pnpm flow:compile templates/example_farmer_flow.md
```

Output: `client/src/features/kaani/flows/v1/farmer.default.flow.json`

### Validate All Flows
```bash
pnpm flow:validate
```

Validates all `*.flow.json` files in `client/src/features/kaani/flows/**` against the Zod schema.

### Watch Mode (Optional)
```bash
pnpm flow:watch templates/example_farmer_flow.md
```

Recompiles automatically when the Markdown file changes.

## Markdown Format

See `docs/JOHN_FLOW_AUTHORING_GUIDE.md` for detailed authoring instructions.

Quick reference:
- YAML frontmatter: `id`, `version`, `audience`, `dialectsSupported`, `title`, `description`
- `## Slots` section: Define fields to collect
- `## Steps` section: Define conversation steps with prompts and chips

## Backward Compatibility

- ✅ All existing flow JSON files continue to work
- ✅ Compiler outputs match existing format exactly
- ✅ No runtime changes required
- ✅ Validator works with existing flows

## Testing

1. **Test Compilation**:
   ```bash
   pnpm flow:compile templates/example_farmer_flow.md
   pnpm flow:compile templates/example_loan_officer_flow.md
   ```

2. **Test Validation**:
   ```bash
   pnpm flow:validate
   ```

3. **Verify Output**:
   - Check that compiled JSON files are valid
   - Compare with existing flow files (should match structure)

4. **Test Error Handling**:
   - Try compiling an invalid Markdown file (missing required fields)
   - Verify error messages are clear and actionable

## Known Limitations

1. **Simple YAML Parser**: Frontmatter parser is basic (only supports key:value and arrays). Complex YAML features not supported.

2. **Step Navigation**: Only supports simple step ID references in `Next:` field. Conditional navigation not yet implemented in parser (but schema supports it).

3. **Validation Rules**: Simple validation only. Complex validation rules not yet supported in Markdown format.

## Future Enhancements

- Support conditional navigation in Markdown (`Next:` with conditions)
- Support validation rules in Markdown format
- Support report templates in Markdown
- Multiple flows per audience (currently only supports `default`)
- Flow versioning and migration helpers

