#!/usr/bin/env python3
"""
Package the VS Code extension into a .vsix file.
A .vsix file is a ZIP archive with specific metadata.
"""
import json
import zipfile
import os
import sys
from pathlib import Path

def main():
    pkg_path = Path('package.json')
    pkg = json.loads(pkg_path.read_text())
    
    version = pkg['version']
    name = pkg['name']
    publisher = pkg.get('publisher', 'sentry-log-explorer')
    vsix_name = f'{name}-{version}.vsix'
    
    print(f'Packaging {name}@{version}...')
    
    # Create extension manifest
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
        'publisher': publisher,
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
    
    # Create the .vsix file (it's a ZIP)
    with zipfile.ZipFile(vsix_name, 'w', zipfile.ZIP_DEFLATED) as zf:
        # Add extension files from dist/
        dist_dir = Path('dist')
        if dist_dir.exists():
            for file_path in sorted(dist_dir.rglob('*')):
                if file_path.is_file():
                    arc_path = file_path.relative_to('.')
                    zf.write(file_path, arc_path)
        
        # Add manifest files
        zf.writestr('extension.vsixmanifest', manifest_json)
        zf.writestr('_manifest', manifest_json)
    
    file_size = os.path.getsize(vsix_name)
    print(f'Created {vsix_name} ({file_size} bytes)')

if __name__ == '__main__':
    main()
