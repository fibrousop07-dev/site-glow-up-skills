import tempfile
import unittest
from pathlib import Path

from audit_artifact import audit


class StaticArtifactTests(unittest.TestCase):
    def test_svg_data_uri_with_nested_url_is_not_a_local_file(self):
        with tempfile.TemporaryDirectory() as d:
            site = Path(d)
            (site / 'index.html').write_text('<link href="site.css" rel="stylesheet">')
            (site / 'site.css').write_text('''body {background-image:url("data:image/svg+xml,%3Csvg%3E%3Crect filter='url(%23n)'/%3E%3C/svg%3E")}''')
            self.assertTrue(audit(site)['passed'])
            with (site / 'site.css').open('a') as f:
                f.write(' .product {background:url("missing.webp")}')
            result = audit(site)
            self.assertFalse(result['passed'])
            self.assertEqual(len(result['errors']), 1)
            self.assertIn('missing.webp', result['errors'][0])

    def test_quoted_url_can_contain_parentheses(self):
        with tempfile.TemporaryDirectory() as d:
            site = Path(d)
            (site / 'index.html').write_text('<link href="site.css" rel="stylesheet">')
            (site / 'site.css').write_text('body {background:url("hero (1).webp")}')
            (site / 'hero (1).webp').write_bytes(b'fixture')
            self.assertTrue(audit(site)['passed'])

    def test_missing_hidden_image_and_css_asset_fail(self):
        with tempfile.TemporaryDirectory() as d:
            site = Path(d)
            (site / 'index.html').write_text('<img src="missing.jpg" onerror="this.style.display=\'none\'"><link href="site.css" rel="stylesheet">')
            (site / 'site.css').write_text('.hero {background:url("hero.webp")}')
            result = audit(site)
            self.assertFalse(result['passed'])
            self.assertEqual(len(result['errors']), 2)
            (site / 'missing.jpg').write_bytes(b'image')
            (site / 'hero.webp').write_bytes(b'image')
            self.assertTrue(audit(site)['passed'])

    def test_internal_routes_and_relative_assets(self):
        with tempfile.TemporaryDirectory() as d:
            site = Path(d)
            (site / 'img').mkdir()
            (site / 'img' / 'a.jpg').write_bytes(b'image')
            (site / 'index.html').write_text('<img src="/img/a.jpg?v=1"><a href="missing.html">Menu</a><a href="mailto:hello@example.com">Mail</a>')
            self.assertFalse(audit(site)['passed'])
            (site / 'missing.html').write_text('<a href="#menu">Menu</a>')
            self.assertTrue(audit(site)['passed'])


if __name__ == '__main__':
    unittest.main()
