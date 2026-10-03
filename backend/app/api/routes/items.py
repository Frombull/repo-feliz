from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.schemas.item import Item, ItemCreate, ItemUpdate
from app.services.item_service import ItemService, get_item_service

router = APIRouter(prefix="/items", tags=["items"])

Service = Annotated[ItemService, Depends(get_item_service)]
ItemId = Annotated[int, Path(gt=0)]


def _not_found():
    return HTTPException(status_code=404, detail="Item não encontrado")


@router.get("", response_model=list[Item])
def list_items(service: Service, available: Annotated[bool | None, Query()] = None):
    return service.list(available)


@router.get("/{item_id}", response_model=Item)
def get_item(item_id: ItemId, service: Service):
    item = service.get(item_id)
    if item is None:
        raise _not_found()
    return item


@router.post("", response_model=Item, status_code=status.HTTP_201_CREATED)
def create_item(data: ItemCreate, service: Service):
    return service.create(data)


@router.put("/{item_id}", response_model=Item)
def replace_item(item_id: ItemId, data: ItemCreate, service: Service):
    item = service.replace(item_id, data)
    if item is None:
        raise _not_found()
    return item


@router.patch("/{item_id}", response_model=Item)
def update_item(item_id: ItemId, data: ItemUpdate, service: Service):
    item = service.update(item_id, data)
    if item is None:
        raise _not_found()
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: ItemId, service: Service):
    if not service.delete(item_id):
        raise _not_found()
