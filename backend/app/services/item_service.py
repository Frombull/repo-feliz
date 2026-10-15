from typing import Annotated

from fastapi import Depends

from app.repositories.item_repository import ItemRepository, get_item_repository
from app.schemas.item import Item, ItemCreate, ItemUpdate


class ItemService:
    def __init__(self, repository: ItemRepository):
        self._repository = repository

    def list(self, available: bool | None = None) -> list[Item]:
        return [Item.model_validate(m) for m in self._repository.list(available)]

    def get(self, item_id: int) -> Item | None:
        model = self._repository.get(item_id)
        return Item.model_validate(model) if model else None

    def create(self, data: ItemCreate) -> Item:
        model = self._repository.add(**data.model_dump())
        return Item.model_validate(model)

    def replace(self, item_id: int, data: ItemCreate) -> Item | None:
        model = self._repository.get(item_id)
        if model is None:
            return None
        model = self._repository.update(model, **data.model_dump())
        return Item.model_validate(model)

    def update(self, item_id: int, data: ItemUpdate) -> Item | None:
        model = self._repository.get(item_id)
        if model is None:
            return None
        changes = data.model_dump(exclude_unset=True, exclude_none=True)
        model = self._repository.update(model, **changes)
        return Item.model_validate(model)

    def delete(self, item_id: int) -> bool:
        model = self._repository.get(item_id)
        if model is None:
            return False
        self._repository.delete(model)
        return True


def get_item_service(
    repository: Annotated[ItemRepository, Depends(get_item_repository)],
) -> ItemService:
    return ItemService(repository)
