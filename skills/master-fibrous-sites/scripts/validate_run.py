"""Validate build contracts and evidence without pretending to judge design quality."""
import argparse
import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from audit_artifact import audit


def validate_quality(site):
    """Consume the same QUALITY_EVIDENCE.json contract as Weave's runtime gate.

    Evidence completeness is machine checked; aesthetic merit still needs review.
    Paths are relative to the delivered site, never the portfolio or filesystem.
    """
    errors = []
    fingerprints = {}
    def fail(message):
        errors.append('QUALITY_EVIDENCE.json: ' + message)
    def obj(value, label):
        if not isinstance(value, dict):
            fail(label + ' must be an object')
            return {}
        return value
    def words(value, label):
        if not isinstance(value, str) or not value.strip():
            fail(label + ' must be nonblank text')
    def file(value, label, image=False):
        if not isinstance(value, str) or not value.strip():
            fail(label + ' must be a relative file path')
            return None
        path = (site / value).resolve()
        if Path(value).is_absolute() or not path.is_relative_to(site.resolve()):
            fail(label + ' escapes site')
            return None
        if not path.is_file() or not path.stat().st_size:
            fail(label + ' is missing or empty')
            return None
        if image:
            try:
                from PIL import Image
                with Image.open(path) as im:
                    if im.format not in {'PNG', 'JPEG'}:
                        raise ValueError('expected PNG or JPEG')
                    if max(im.size) > 16384 or im.width * im.height > 24000000:
                        raise ValueError('screenshot exceeds supported dimensions')
                    im.verify()
                with Image.open(path) as im:
                    im.load()
                    fingerprints[path] = (im.size, hashlib.sha256(im.convert('RGBA').tobytes()).digest())
            except (ImportError, OSError, ValueError, SyntaxError) as exc:
                fail(label + ' must decode as PNG/JPEG: ' + str(exc))
                return None
        return path
    try:
        evidence_path = file('QUALITY_EVIDENCE.json', 'evidence')
        if evidence_path is None:
            return errors
        data = obj(json.loads(evidence_path.read_text(encoding='utf-8-sig')), 'evidence')
    except (OSError, ValueError):
        return ['Missing or invalid QUALITY_EVIDENCE.json; completion needs observed browser evidence']
    if type(data.get('version')) is not int or data['version'] != 1:
        fail('version must be 1')
    signature = obj(data.get('signatureInteraction'), 'signatureInteraction')
    for key in ('requested', 'implemented', 'trigger', 'observed'):
        words(signature.get(key), 'signatureInteraction.' + key)
    prototype = obj(data.get('prototype'), 'prototype')
    file(prototype.get('path'), 'prototype.path')
    words(prototype.get('review'), 'prototype.review')
    build = obj(data.get('build'), 'build')
    words(build.get('command'), 'build.command')
    if build.get('status') != 'passed':
        fail('build.status must be passed')
    file(build.get('log'), 'build.log')
    checks = data.get('browserChecks')
    if not isinstance(checks, list):
        fail('browserChecks must be an array')
        checks = []
    seen = set()
    for i, raw in enumerate(checks):
        label = 'browserChecks[' + str(i) + ']'
        check = obj(raw, label)
        mode = check.get('viewport')
        if mode not in ('desktop', 'mobile', 'reduced-motion'):
            fail(label + '.viewport is invalid')
        else:
            seen.add(mode)
        for key in ('action', 'observed'):
            words(check.get(key), label + '.' + key)
        if check.get('status') != 'passed':
            fail(label + '.status must be passed')
        shots = check.get('screenshots')
        if not isinstance(shots, list):
            shots = []
        paths = [file(v, label + '.screenshots', image=True) for v in shots]
        valid = {v for v in paths if v is not None}
        required = 2 if mode == 'desktop' else 1
        if len(valid) < required:
            fail(label + ' needs ' + str(required) + ' distinct valid screenshots')
        elif mode == 'desktop':
            if len({fingerprints[v] for v in valid}) < 2:
                fail(label + ' needs distinct rendered states, not duplicate pixels')
    if seen != {'desktop', 'mobile', 'reduced-motion'}:
        fail('browserChecks requires desktop, mobile and reduced-motion')
    review = obj(data.get('visualReview'), 'visualReview')
    if review.get('status') != 'passed':
        fail('visualReview.status must be passed')
    words(review.get('reviewer'), 'visualReview.reviewer')
    for key in ('findings', 'corrections'):
        words(review.get(key), 'visualReview.' + key)
    if review.get('remaining') != []:
        fail('visualReview.remaining must explicitly contain zero unresolved material issues')
    return errors


def validate(root, slug, stage):
    errors = []
    root = root.resolve()
    if Path(slug).name != slug or slug in {'.', '..'}:
        return ['Site must be a single folder name']
    research = root / '_research' / slug
    cache = research / 'capabilities.json'
    if not cache.exists():
        errors.append(f'Missing per-site capabilities: {cache}')
    else:
        try:
            data = json.loads(cache.read_text(encoding='utf-8-sig'))
            capabilities = data['capabilities']
            if not isinstance(capabilities, dict) or not capabilities:
                raise ValueError('capabilities must be a nonempty object')
            for name, item in capabilities.items():
                if not isinstance(item, dict) or item.get('status') not in {'unknown', 'unavailable', 'verified'}:
                    errors.append(f'{name}: requires explicit status; booleans and unsupported claims are invalid')
                    continue
                if item['status'] != 'verified':
                    continue
                try:
                    tested = datetime.fromisoformat(item['tested_at'].replace('Z', '+00:00'))
                    if tested.tzinfo is None or tested.utcoffset().total_seconds() != 0:
                        raise ValueError('timestamp must be UTC')
                    if tested > datetime.now(timezone.utc):
                        raise ValueError('timestamp is in the future')
                except (KeyError, TypeError, AttributeError, ValueError) as exc:
                    errors.append(f'{name}: invalid tested_at ({exc})')
                evidence = item.get('evidence')
                if not isinstance(evidence, list) or not evidence:
                    errors.append(f'{name}: verified requires evidence files')
                    continue
                for entry in evidence:
                    if not isinstance(entry, str):
                        errors.append(f'{name}: evidence path must be a string')
                        continue
                    path = (root / entry).resolve()
                    if Path(entry).is_absolute() or not path.is_relative_to(root):
                        errors.append(f'{name}: evidence must stay within portfolio')
                    elif not path.is_file() or not path.stat().st_size:
                        errors.append(f'{name}: missing or empty evidence: {entry}')
        except (ValueError, KeyError, TypeError) as exc:
            errors.append(f'Invalid capabilities JSON: {exc}')
    for name in ('concept.md', 'research.md', 'design-plan.md', 'assets.md'):
        path = research / name
        if not path.is_file() or not path.stat().st_size:
            errors.append(f'Missing or empty contract: {path}')
    research_file = research / 'research.md'
    if research_file.is_file() and 'https://21st.dev/' not in research_file.read_text(encoding='utf-8-sig'):
        errors.append('Research must record 21st.dev discovery or an honest access limitation')
    if stage == 'final':
        site = root / slug
        for name in ('README.md', 'REPORT.md'):
            if not (site / name).is_file() or not (site / name).stat().st_size:
                errors.append(f'Missing final deliverable: {site / name}')
        if not any((site / name).is_file() for name in ('index.html', 'package.json')):
            errors.append('Missing website entry point')
        if (site / 'index.html').is_file():
            errors.extend(audit(site)['errors'])
        errors.extend(validate_quality(site))
    return errors


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('portfolio_root', type=Path)
    parser.add_argument('site')
    parser.add_argument('--stage', choices=['prebuild', 'final'], required=True)
    args = parser.parse_args()
    problems = validate(args.portfolio_root, args.site, args.stage)
    print(json.dumps({'stage': args.stage, 'valid': not problems, 'errors': problems}, indent=2))
    raise SystemExit(bool(problems))
