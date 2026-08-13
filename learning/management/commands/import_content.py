from pathlib import Path

import markdown
import yaml
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from learning.models import Problem, Subject, Unit

SECTION_FIELDS = {
    'question.md': 'question_html',
    'how_to_solve.md': 'how_to_solve_html',
    'how_to_teach.md': 'how_to_teach_html',
    'example_phrases.md': 'example_phrases_html',
}


def _load_meta(meta_path):
    if not meta_path.exists():
        raise CommandError(f'meta file not found: {meta_path}')
    with meta_path.open(encoding='utf-8') as f:
        data = yaml.safe_load(f) or {}
    return data


def _require(data, key, path):
    if key not in data or data[key] in (None, ''):
        raise CommandError(f'"{key}" is missing in {path}')
    return data[key]


def _render_problem_dir(problem_dir):
    """Validate a problem directory and return the field values to save."""
    meta = _load_meta(problem_dir / 'meta.yaml')
    title = _require(meta, 'title', problem_dir / 'meta.yaml')
    order = meta.get('order', 0)

    fields = {}
    for filename, field_name in SECTION_FIELDS.items():
        md_path = problem_dir / filename
        if not md_path.exists():
            raise CommandError(f'required content file not found: {md_path}')
        text = md_path.read_text(encoding='utf-8')
        fields[field_name] = markdown.markdown(text)

    return title, order, fields


class Command(BaseCommand):
    help = 'content/ 配下のMarkdown+メタデータをSubject/Unit/Problemモデルへ取り込みます'

    def add_arguments(self, parser):
        parser.add_argument(
            '--check',
            action='store_true',
            help='DBへの書き込みを行わず、コンテンツの検証のみ行います(CI用)',
        )

    def handle(self, *args, **options):
        content_dir = Path(settings.CONTENT_DIR)
        if not content_dir.is_dir():
            raise CommandError(f'content directory not found: {content_dir}')

        check_only = options['check']

        with transaction.atomic():
            imported = self._import_all(content_dir)
            if check_only:
                transaction.set_rollback(True)

        verb = 'を検証しました' if check_only else 'を取り込みました'
        self.stdout.write(self.style.SUCCESS(f'{imported["subjects"]}教科 / {imported["units"]}単元 / {imported["problems"]}問題{verb}'))

    def _import_all(self, content_dir):
        counts = {'subjects': 0, 'units': 0, 'problems': 0}

        subject_dirs = sorted(d for d in content_dir.iterdir() if d.is_dir() and (d / '_meta.yaml').exists())
        for subject_dir in subject_dirs:
            meta = _load_meta(subject_dir / '_meta.yaml')
            name = _require(meta, 'name', subject_dir / '_meta.yaml')
            order = meta.get('order', 0)

            subject, _ = Subject.objects.update_or_create(
                slug=subject_dir.name,
                defaults={'name': name, 'order': order},
            )
            counts['subjects'] += 1

            unit_dirs = sorted(d for d in subject_dir.iterdir() if d.is_dir() and (d / '_meta.yaml').exists())
            for unit_dir in unit_dirs:
                unit_meta = _load_meta(unit_dir / '_meta.yaml')
                unit_name = _require(unit_meta, 'name', unit_dir / '_meta.yaml')
                unit_order = unit_meta.get('order', 0)

                unit, _ = Unit.objects.update_or_create(
                    subject=subject,
                    slug=unit_dir.name,
                    defaults={'name': unit_name, 'order': unit_order},
                )
                counts['units'] += 1

                problem_dirs = sorted(d for d in unit_dir.iterdir() if d.is_dir() and (d / 'meta.yaml').exists())
                for problem_dir in problem_dirs:
                    title, problem_order, fields = _render_problem_dir(problem_dir)
                    Problem.objects.update_or_create(
                        unit=unit,
                        slug=problem_dir.name,
                        defaults={'title': title, 'order': problem_order, **fields},
                    )
                    counts['problems'] += 1

        return counts
