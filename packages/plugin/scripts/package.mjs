/**
 * Package the VS Code extension into a .vsix file.
 * A .vsix file is a ZIP archive with specific metadata.
 * This script is used when vsce is not available or hangs.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { createReadStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const version = pkg.version;
const name = pkg.name;
const publisher = pkg.publisher || 'sentry-log-explorer';
const vsixName = `${name}-${version}.vsix`;

console.log(`Packaging ${name}@${version}...`);

// Step 1: Compile TypeScript
console.log('Compiling TypeScript...');
execSync('tsc -p ./tsconfig.json', { stdio: 'inherit' });

// Step 2: Copy webview assets
console.log('Copying webview assets...');
execSync('node scripts/copy-webview.mjs', { stdio: 'inherit' });

// Step 3: Create .vsix file using Python (more reliable than vsce in headless env)
console.log('Creating .vsix package...');
const pythonScript = `
import json, zipfile, os, hashlib

pkg = json.load(open('package.json', 'r'))
manifest = {
    'name': pkg['name'],
    'displayName': pkg['displayName'],
    'description': pkg['description'],
    'version': pkg['version'],
    'engines': pkg['engines'],
    'categories': pkg.get('categories', []),
    'keywords': pkg.get('keywords', []),
    'activationEvents': pkg.get('activationEvents', []),
    'main': pkg['main'],
    'contributes': pkg.get('contributes', {}),
    'publisher': pkg.get('publisher', ''),
    'license': pkg.get('license', ''),
    'icon': None,
    'galleryBanner': None,
    'bugs': None,
    'homepage': None,
    'repository': None,
    'qna': None,
    'preview': False,
    'private': False,
    'dependencies': {},
    'devDependencies': {},
    'extensionDependencies': [],
    'bundledExtensions': {},
    'extensionKind': ['workspace'],
    '_dependenciesWithoutVersion': [],
    '_preRelease': False,
    '_modulePlatform': 'node'
}

manifest_json = json.dumps(manifest, indent=2)

with zipfile.ZipFile('${vsixName}', 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk('dist'):
        for file in files:
            file_path = join(root, file)
            zf.write(file_path, file_path)
    zf.writestr('extension.vsixmanifest', manifest_json)
    zf.writestr('_manifest', manifest_json)

print(f"Created {vsixName} ({os.path.getsize('${vsixName}')} bytes)")
`;

execSync(`python3 -c '${pythonScript.replace(/'/g, "'\\''")}'`, { stdio: 'inherit' });

console.log(`Done! Package created: ${vsixName}`);
