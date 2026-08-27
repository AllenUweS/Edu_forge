import django.db.models.deletion

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("questionbank", "0005_backfill_question_banks"),
    ]

    operations = [
        # Every row was populated by 0005_backfill_question_banks; now the
        # schema enforces that a question always belongs to a bank.
        migrations.AlterField(
            model_name="question",
            name="question_bank",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="questions",
                to="questionbank.questionbank",
            ),
        ),
    ]
