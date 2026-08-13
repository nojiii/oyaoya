from django.test import TestCase
from django.urls import reverse

from learning.models import Problem, Subject, Unit


class LearningFlowTests(TestCase):
    def setUp(self):
        self.subject = Subject.objects.create(slug='math', name='算数', order=1)
        self.unit = Unit.objects.create(subject=self.subject, slug='unit-01', name='たし算', order=1)
        self.problem = Problem.objects.create(
            unit=self.unit,
            slug='problem-01',
            title='あわせていくつ',
            order=1,
            question_html='<p>問題文</p>',
            how_to_solve_html='<p>解き方</p>',
            how_to_teach_html='<p>教え方</p>',
            example_phrases_html='<p>声掛け例</p>',
        )

    def test_home_lists_subject(self):
        response = self.client.get(reverse('learning:home'))
        self.assertContains(response, '算数')

    def test_subject_detail_lists_unit(self):
        response = self.client.get(reverse('learning:subject_detail', args=[self.subject.slug]))
        self.assertContains(response, 'たし算')

    def test_unit_detail_lists_problem(self):
        response = self.client.get(reverse('learning:unit_detail', args=[self.subject.slug, self.unit.slug]))
        self.assertContains(response, 'あわせていくつ')

    def test_problem_detail_shows_all_sections(self):
        response = self.client.get(reverse('learning:problem_detail', args=[self.subject.slug, self.unit.slug, self.problem.slug]))
        self.assertContains(response, '問題文')
        self.assertContains(response, '解き方')
        self.assertContains(response, '教え方')
        self.assertContains(response, '声掛け例')
