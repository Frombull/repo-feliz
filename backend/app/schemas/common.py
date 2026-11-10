from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator


def _without_timezone(value: datetime) -> datetime:
    if value.tzinfo is not None:
        raise ValueError("informe o horário local, sem fuso (ex.: 2030-05-10T09:00)")
    return value


# Horário local, sem fuso. Rejeita valores como "...Z" ou "...-03:00".
LocalDateTime = Annotated[datetime, AfterValidator(_without_timezone)]
