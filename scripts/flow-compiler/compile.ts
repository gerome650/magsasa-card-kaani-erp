#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import { parseMarkdownFlow } from './parseMarkdown';
import { normalizeToFlowPackage } from './normalize';
import { FlowPackageSchema } from '../../server/ai/flows/flowSchema';
import { FlowCompilerError } from './errors';

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: pnpm flow:compile <pathToMd>');
    console.error('Example: pnpm flow:compile templates/example_farmer_flow.md');
    process.exit(1);
  }

  const inputPath = args[0];
  
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: File not found: ${inputPath}`);
    process.exit(1);
  }

  try {
    // Parse markdown
    const parsed = parseMarkdownFlow(inputPath);

    // Normalize to FlowPackage
    const flowPackage = normalizeToFlowPackage(parsed);

    // Validate against Zod schema
    const validationResult = FlowPackageSchema.safeParse(flowPackage);
    if (!validationResult.success) {
      console.error('Validation errors:');
      validationResult.error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }

    // Determine output path
    // Extract audience from flow ID or metadata
    const audience = flowPackage.audience;
    const outputDir = path.join(process.cwd(), 'client', 'src', 'features', 'kaani', 'flows', 'v1');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${audience}.default.flow.json`);

    // Write JSON with stable formatting (2-space indent, sorted keys)
    const jsonOutput = JSON.stringify(flowPackage, null, 2);
    fs.writeFileSync(outputPath, jsonOutput + '\n', 'utf-8');

    console.log(`✓ Compiled flow: ${inputPath}`);
    console.log(`✓ Output: ${outputPath}`);
    console.log(`✓ Flow ID: ${flowPackage.id} (${flowPackage.audience})`);
    console.log(`✓ Steps: ${flowPackage.steps.length}, Slots: ${flowPackage.slots.length}`);
  } catch (error) {
    if (error instanceof FlowCompilerError) {
      console.error(`Error: ${error.toString()}`);
    } else {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

main();

