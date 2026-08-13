from django.urls import path

from . import views

app_name = 'learning'

urlpatterns = [
    path('', views.home, name='home'),
    path('<slug:subject_slug>/', views.subject_detail, name='subject_detail'),
    path('<slug:subject_slug>/<slug:unit_slug>/', views.unit_detail, name='unit_detail'),
    path('<slug:subject_slug>/<slug:unit_slug>/<slug:problem_slug>/', views.problem_detail, name='problem_detail'),
]
