from app.schemas.item import Item, ItemCreate, ItemUpdate


class ItemService:
    def __init__(self):
        self._items: dict[int, Item] = {}
        self._next_id = 1

    def list(self, available: bool | None = None) -> list[Item]:
        items = list(self._items.values())
        if available is not None:
            items = [item for item in items if item.available == available]
        return items

    def get(self, item_id: int) -> Item | None:
        return self._items.get(item_id)

    def create(self, data: ItemCreate) -> Item:
        item = Item(id=self._next_id, **data.model_dump())
        self._items[item.id] = item
        self._next_id += 1
        return item

    def replace(self, item_id: int, data: ItemCreate) -> Item | None:
        if item_id not in self._items:
            return None
        item = Item(id=item_id, **data.model_dump())
        self._items[item_id] = item
        return item

    def update(self, item_id: int, data: ItemUpdate) -> Item | None:
        item = self._items.get(item_id)
        if item is None:
            return None
        changes = data.model_dump(exclude_unset=True, exclude_none=True)
        updated = item.model_copy(update=changes)
        self._items[item_id] = updated
        return updated

    def delete(self, item_id: int) -> bool:
        return self._items.pop(item_id, None) is not None


item_service = ItemService()
item_service.create(ItemCreate(name="café", price=5.0))
item_service.create(ItemCreate(name="chá", price=4.0))
item_service.create(ItemCreate(name="suco", price=7.5))


def get_item_service() -> ItemService:
    return item_service
