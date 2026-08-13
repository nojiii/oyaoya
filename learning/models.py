from django.db import models


class Subject(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'slug']

    def __str__(self):
        return self.name


class Unit(models.Model):
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='units')
    slug = models.SlugField()
    name = models.CharField(max_length=100)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'slug']
        unique_together = [('subject', 'slug')]

    def __str__(self):
        return f'{self.subject.name} / {self.name}'


class Problem(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='problems')
    slug = models.SlugField()
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)

    question_html = models.TextField(blank=True)
    how_to_solve_html = models.TextField(blank=True)
    how_to_teach_html = models.TextField(blank=True)
    example_phrases_html = models.TextField(blank=True)

    class Meta:
        ordering = ['order', 'slug']
        unique_together = [('unit', 'slug')]

    def __str__(self):
        return f'{self.unit} / {self.title}'
