from django.contrib import admin

from .models import Problem, Subject, Unit


class ImportedContentAdmin(admin.ModelAdmin):
    """コンテンツの正データは content/ 配下のMarkdownで、import_content コマンドが
    取り込む。Adminはインポート結果の確認用途とし、手動での作成・削除は行わない。"""

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Subject)
class SubjectAdmin(ImportedContentAdmin):
    list_display = ('name', 'slug', 'order')


@admin.register(Unit)
class UnitAdmin(ImportedContentAdmin):
    list_display = ('name', 'slug', 'subject', 'order')
    list_filter = ('subject',)


@admin.register(Problem)
class ProblemAdmin(ImportedContentAdmin):
    list_display = ('title', 'slug', 'unit', 'order')
    list_filter = ('unit__subject', 'unit')
