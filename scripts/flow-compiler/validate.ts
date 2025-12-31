#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { FlowPackageSchema } from '../../server/ai/flows/flowSchema';

async function main() {
  const flowsDir = path.join(process.cwd(), 'client', 'src', 'features', 'kaani', 'flows', '**', '*.flow.json');
  
  console.log('Validating flow packages...');
  console.log(`Searching: ${flowsDir}\n`);

  const flowFiles = await glob(flowsDir);
  
  if (flowFiles.length === 0) {
    console.log('No flow JSON files found.');
    process.exit(0);
  }

  let hasErrors = false;

  for (const filePath of flowFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const json = JSON.parse(content);

      const result = FlowPackageSchema.safeParse(json);

      if (result.success) {
        console.log(`✓ ${path.relative(process.cwd(), filePath)}`);
      } else {
        console.error(`✗ ${path.relative(process.cwd(), filePath)}`);
        result.error.errors.forEach(err => {
          const pathStr = err.path.length > 0 ? err.path.join('.') : 'root';
          console.error(`  - ${pathStr}: ${err.message}`);
        });
        hasErrors = true;
      }
    } catch (error) {
      console.error(`✗ ${path.relative(process.cwd(), filePath)}`);
      if (error instanceof SyntaxError) {
        console.error(`  - JSON parse error: ${error.message}`);
      } else {
        console.error(`  - Error: ${error instanceof Error ? error.message : String(error)}`);
      }
      hasErrors = true;
    }
  }

  console.log('');
  if (hasErrors) {
    console.error('Validation failed. Please fix the errors above.');
    process.exit(1);
  } else {
    console.log(`✓ All ${flowFiles.length} flow package(s) are valid.`);
    process.exit(0);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

