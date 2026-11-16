"""Check local static website assets; visual quality still requires browser review."""
import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


# Consume a complete quoted URL, including SVG data URIs containing their own
# quotes/parentheses. Otherwise an inner url(%23filter) looks like a missing file.
CSS_URL = re.compile(r'''url\(\s*(?:"((?:\\.|[^"\\])*)"|'((?:\\.|[^'\\])*)'|([^)]*))\s*\)''', re.I)


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('src', 'poster'):
            if attrs.get(key):
                self.urls.append(attrs[key])
        if tag in ('a', 'link') and attrs.get('href'):
            self.urls.append(attrs['href'])
        if attrs.get('srcset') and not attrs['srcset'].lstrip().startswith('data:'):
            self.urls.extend(item.strip().split()[0] for item in attrs['srcset'].split(',') if item.strip())


def audit(site):
    site = site.resolve()
    errors = []
    pages = list(site.rglob('*.html'))
    if not pages:
        return {'passed': False, 'pages': 0, 'errors': ['No static HTML pages found; run the framework production build before auditing its output.']}
    for file in [*pages, *site.rglob('*.css')]:
        if any(part in {'node_modules', '.git', '.glow-up'} for part in file.relative_to(site).parts):
            continue
        content = file.read_text(encoding='utf-8-sig')
        refs = References()
        if file.suffix == '.html':
            refs.feed(content)
        refs.urls.extend(next(value for value in match.groups() if value is not None).strip() for match in CSS_URL.finditer(content))
        for value in refs.urls:
            url = urlsplit(value.strip())
            if url.scheme or url.netloc or not url.path:
                continue
            target = ((site / unquote(url.path).lstrip('/')) if url.path.startswith('/') else (file.parent / unquote(url.path))).resolve()
            if not target.is_relative_to(site):
                errors.append(f'{file.relative_to(site)}: reference escapes site: {value}')
            elif not target.exists() or target.is_file() and target.stat().st_size == 0:
                errors.append(f'{file.relative_to(site)}: missing/empty local resource: {value}')
    return {'passed': not errors, 'pages': len(pages), 'errors': sorted(set(errors))}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('site', type=Path)
    p.add_argument('--output', type=Path)
    args = p.parse_args()
    report = audit(args.site)
    text = json.dumps(report, indent=2)
    if args.output:
        args.output.write_text(text, encoding='utf-8')
    print(text)
    raise SystemExit(not report['passed'])
