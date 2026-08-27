import re

from django.conf import settings

from .models import UploadedImage


def link_images_to_paper(paper):
    """
    Scan every page's saved HTML for /media/... image URLs and point the
    matching UploadedImage rows at this paper. Runs on every save, so an
    image pasted before the paper existed still gets linked once saved,
    and an image removed from the text simply stays unlinked.
    """
    pattern = re.compile(re.escape(settings.MEDIA_URL) + r"[\w./-]+")

    urls_in_use = set()
    for page in paper.pages.all():
        urls_in_use.update(pattern.findall(page.content or ""))

    if not urls_in_use:
        return

    for url in urls_in_use:
        relative_path = url[len(settings.MEDIA_URL):]  # strip "/media/"
        UploadedImage.objects.filter(image=relative_path).update(exam_paper=paper)
