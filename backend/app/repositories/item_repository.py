from typing import Annotated

from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.item import ItemModel


class ItemRepository:
    def __init__(self, session: Session):
        self._session = session

    def list(self, available: bool | None = None) -> list[ItemModel]:
        stmt = select(ItemModel).order_by(ItemModel.id)
        if available is not None:
            stmt = stmt.where(ItemModel.available == available)
        return list(self._session.scalars(stmt))

    def get(self, item_id: int) -> ItemModel | None:
        return self._session.get(ItemModel, item_id)

    def add(self, **fields) -> ItemModel:
        item = ItemModel(**fields)
        self._session.add(item)
        self._session.commit()
        return item

    def update(self, item: ItemModel, **fields) -> ItemModel:
        for key, value in fields.items():
            setattr(item, key, value)
        self._session.commit()
        return item

    def delete(self, item: ItemModel) -> None:
        self._session.delete(item)
        self._session.commit()


def get_item_repository(session: Annotated[Session, Depends(get_db)]) -> ItemRepository:
    return ItemRepository(session)
