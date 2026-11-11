from typing import Annotated, Literal, Self

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
    model_validator,
)

from app.schemas.common import LocalDateTime

BookingStatus = Literal["confirmed", "cancelled"]

Title = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)
]
Requester = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=60)
]


class BookingCreate(BaseModel):
    room_id: int = Field(gt=0)
    title: Title
    requester: Requester
    attendees: int = Field(ge=1)
    start_at: LocalDateTime
    end_at: LocalDateTime

    @model_validator(mode="after")
    def _end_after_start(self) -> Self:
        if self.end_at <= self.start_at:
            raise ValueError("o fim deve ser depois do início")
        return self


class BookingUpdate(BaseModel):
    """Alteração parcial. O service junta com a reserva atual e valida o conjunto."""

    room_id: int | None = Field(default=None, gt=0)
    title: Title | None = None
    requester: Requester | None = None
    attendees: int | None = Field(default=None, ge=1)
    start_at: LocalDateTime | None = None
    end_at: LocalDateTime | None = None

    @field_validator("room_id", "title", "requester", "attendees", "start_at", "end_at")
    @classmethod
    def _not_null(cls, value):
        # só roda quando o campo foi enviado; null explícito não faz sentido
        if value is None:
            raise ValueError("não pode ser nulo")
        return value


class Booking(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    room_id: int
    title: str
    requester: str
    attendees: int
    start_at: LocalDateTime
    end_at: LocalDateTime
    status: BookingStatus
