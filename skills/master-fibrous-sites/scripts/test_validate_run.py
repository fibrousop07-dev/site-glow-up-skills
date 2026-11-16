import json
import tempfile
import unittest
from pathlib import Path

from validate_run import validate


class EvidenceValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.research = self.root / '_research' / '08-test'
        self.research.mkdir(parents=True)
        for name in ('concept.md', 'research.md', 'design-plan.md', 'assets.md'):
            (self.research / name).write_text('https://21st.dev/ inspected; original build chosen.')

    def check(self, capabilities):
        (self.research / 'capabilities.json').write_text(json.dumps({'capabilities': capabilities}))
        return validate(self.root, '08-test', 'prebuild')

    def test_original_boolean_claim_is_rejected(self):
        self.assertTrue(self.check({'vision': True, 'eye_score': 6}))

    def test_unknown_optional_capability_does_not_block_build(self):
        self.assertEqual(self.check({'image_gen': {'status': 'unknown'}}), [])

    def test_verified_requires_real_nonempty_evidence(self):
        item = {'status': 'verified', 'tested_at': '2026-01-01T00:00:00Z', 'evidence': ['missing.txt']}
        self.assertTrue(self.check({'browser': item}))
        evidence = self.root / 'browser-output.txt'
        evidence.write_text('Actual command output')
        item['evidence'] = ['browser-output.txt']
        self.assertEqual(self.check({'browser': item}), [])

    def test_outside_evidence_is_rejected(self):
        self.assertTrue(self.check({'browser': {'status': 'verified', 'tested_at': '2026-01-01T00:00:00Z', 'evidence': ['../outside.txt']}}))

    def test_final_requires_product_and_browser_artifacts(self):
        self.check({'browser': {'status': 'unknown'}})
        self.assertTrue(validate(self.root, '08-test', 'final'))

    def fixture(self):
        from PIL import Image
        site = self.root / '08-test'
        site.mkdir(exist_ok=True)
        for name in ('README.md', 'REPORT.md', 'index.html', 'build.log'):
            (site / name).write_text('Actual fixture output')
        for i, name in enumerate(('before.png', 'after.png', 'mobile.png', 'reduced.png')):
            Image.new('RGB', (8, 8), (i * 40, 30, 60)).save(site / name)
        data = {
            'version': 1,
            'signatureInteraction': {'requested': 'rotary cups', 'implemented': 'rotary cups', 'trigger': 'Next button', 'observed': 'Vanilla moves to centre; mocha moves left'},
            'prototype': {'path': 'index.html', 'review': 'Hero exercised before adding remaining sections'},
            'build': {'command': 'fixture build', 'status': 'passed', 'log': 'build.log'},
            'browserChecks': [{'viewport': mode, 'status': 'passed', 'action': 'Next then previous', 'observed': 'Visible selected flavour updates', 'screenshots': shots} for mode, shots in [('desktop', ['before.png', 'after.png']), ('mobile', ['mobile.png']), ('reduced-motion', ['reduced.png'])]],
            'visualReview': {'reviewer': 'Fixture reviewer', 'status': 'passed', 'findings': 'Reviewed four rendered states', 'corrections': 'Adjusted mobile crop', 'remaining': []}}
        return site, data

    def quality(self, site, data):
        from validate_run import validate_quality
        (site / 'QUALITY_EVIDENCE.json').write_text(json.dumps(data))
        return validate_quality(site)

    def test_complete_evidence_passes(self):
        site, data = self.fixture()
        self.assertEqual(self.quality(site, data), [])
        self.check({'browser': {'status': 'unknown'}})
        self.assertEqual(validate(self.root, '08-test', 'final'), [])

    def test_missing_evidence_rejected(self):
        from validate_run import validate_quality
        site, _ = self.fixture()
        self.assertTrue(validate_quality(site))

    def test_wrong_types_do_not_crash(self):
        site, data = self.fixture()
        for key in data:
            changed = dict(data)
            changed[key] = 42
            self.assertTrue(self.quality(site, changed), key)
        self.assertTrue(self.quality(site, []))

    def test_corrupt_image_and_duplicate_states_rejected(self):
        site, data = self.fixture()
        (site / 'before.png').write_bytes(b'PNG fake fixture')
        self.assertTrue(self.quality(site, data))
        (site / 'before.png').write_bytes((site / 'after.png').read_bytes())
        self.assertTrue(self.quality(site, data))

    def test_escape_and_absolute_paths_rejected(self):
        site, data = self.fixture()
        for path in ('../outside.png', str(self.root / 'outside.png')):
            data['browserChecks'][0]['screenshots'][0] = path
            self.assertTrue(self.quality(site, data))

    def test_same_pixels_with_different_metadata_rejected(self):
        from PIL import Image, PngImagePlugin
        site, data = self.fixture()
        info = PngImagePlugin.PngInfo()
        info.add_text('description', 'different metadata, same rendered state')
        with Image.open(site / 'before.png') as im:
            im.save(site / 'after.png', pnginfo=info)
        self.assertNotEqual((site / 'before.png').read_bytes(), (site / 'after.png').read_bytes())
        self.assertTrue(self.quality(site, data))

    def test_oversized_screenshot_rejected(self):
        from PIL import Image
        site, data = self.fixture()
        Image.new('RGB', (16385, 1)).save(site / 'before.png')
        self.assertTrue(self.quality(site, data))

    def test_quality_manifest_symlink_escape_rejected(self):
        from validate_run import validate_quality
        site, data = self.fixture()
        outside = self.root / 'outside-evidence.json'
        outside.write_text(json.dumps(data))
        try:
            (site / 'QUALITY_EVIDENCE.json').symlink_to(outside)
        except OSError:
            self.skipTest('symlinks unavailable')
        self.assertTrue(validate_quality(site))

    def test_failed_checks_and_unresolved_review_rejected(self):
        site, data = self.fixture()
        for target in (data['build'], data['browserChecks'][0], data['visualReview']):
            target['status'] = 'failed'
            self.assertTrue(self.quality(site, data))
            target['status'] = 'passed'
        data['visualReview']['remaining'] = ['Cup clipped on mobile']
        self.assertTrue(self.quality(site, data))

    def test_missing_state_trace_and_modes_rejected(self):
        site, data = self.fixture()
        data['signatureInteraction']['observed'] = ' '
        self.assertTrue(self.quality(site, data))
        data['signatureInteraction']['observed'] = 'Cup rotates'
        data['browserChecks'].pop()
        self.assertTrue(self.quality(site, data))


if __name__ == '__main__':
    unittest.main()
