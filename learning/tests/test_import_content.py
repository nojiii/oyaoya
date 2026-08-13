import shutil
import tempfile
from pathlib import Path

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase, override_settings

from learning.models import Problem, Subject, Unit

FIXTURE_CONTENT_DIR = Path(__file__).parent / 'fixtures' / 'content'


class ImportContentTests(TestCase):
    def test_imports_subjects_units_and_problems(self):
        with override_settings(CONTENT_DIR=FIXTURE_CONTENT_DIR):
            call_command('import_content')

        subject = Subject.objects.get(slug='math')
        self.assertEqual(subject.name, '算数')

        unit = Unit.objects.get(subject=subject, slug='unit-01')
        self.assertEqual(unit.name, 'たし算')

        problem = Problem.objects.get(unit=unit, slug='problem-01')
        self.assertEqual(problem.title, 'テスト問題')
        self.assertIn('りんご', problem.question_html)
        self.assertIn('3 + 2 = 5', problem.how_to_solve_html)

    def test_check_flag_does_not_write_to_db(self):
        with override_settings(CONTENT_DIR=FIXTURE_CONTENT_DIR):
            call_command('import_content', '--check')

        self.assertEqual(Subject.objects.count(), 0)

    def test_missing_content_file_raises_with_path(self):
        with tempfile.TemporaryDirectory() as tmp:
            broken_dir = Path(tmp) / 'content'
            shutil.copytree(FIXTURE_CONTENT_DIR, broken_dir)
            (broken_dir / 'math' / 'unit-01' / 'problem-01' / 'how_to_teach.md').unlink()

            with override_settings(CONTENT_DIR=broken_dir):
                with self.assertRaises(CommandError) as ctx:
                    call_command('import_content')

            self.assertIn('how_to_teach.md', str(ctx.exception))
