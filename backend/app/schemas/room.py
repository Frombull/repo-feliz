from typing import Annotated

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
)

RoomName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)
]
Location = Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)]


def _blank_to_none(value):
    if isinstance(value, str) and not value.strip():
        return None
    return value


class RoomCreate(BaseModel):
    name: RoomName
    capacity: int = Field(ge=1, le=500)
    location: Location | None = None

    _clean_location = field_validator("location", mode="before")(_blank_to_none)


class RoomUpdate(BaseModel):
    name: RoomName | None = None
    capacity: int | None = Field(default=None, ge=1, le=500)
    location: Location | None = None
    active: bool | None = None

    _clean_location = field_validator("location", mode="before")(_blank_to_none)

    @field_validator("name", "capacity", "active")
    @classmethod
    def _not_null(cls, value):
        # só roda quando o campo foi enviado; null explícito não faz sentido
        if value is None:
            raise ValueError("não pode ser nulo")
        return value


class Room(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    capacity: int
    location: str | None
    active: bool
