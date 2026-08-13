from django.shortcuts import get_object_or_404, render

from .models import Problem, Subject, Unit


def home(request):
    subjects = Subject.objects.all()
    return render(request, 'learning/home.html', {'subjects': subjects})


def subject_detail(request, subject_slug):
    subject = get_object_or_404(Subject, slug=subject_slug)
    units = subject.units.all()
    return render(request, 'learning/subject_detail.html', {'subject': subject, 'units': units})


def unit_detail(request, subject_slug, unit_slug):
    unit = get_object_or_404(Unit, subject__slug=subject_slug, slug=unit_slug)
    problems = unit.problems.all()
    return render(request, 'learning/unit_detail.html', {'unit': unit, 'problems': problems})


def problem_detail(request, subject_slug, unit_slug, problem_slug):
    problem = get_object_or_404(
        Problem,
        unit__subject__slug=subject_slug,
        unit__slug=unit_slug,
        slug=problem_slug,
    )
    return render(request, 'learning/problem_detail.html', {'problem': problem})
