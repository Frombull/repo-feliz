from app.repositories.item_repository import ItemRepository


def test_data_persists_across_sessions(session_factory):
    with session_factory() as session:
        item = ItemRepository(session).add(name="suco", price=7.5, available=True)
        item_id = item.id

    with session_factory() as session:
        stored = ItemRepository(session).get(item_id)

    assert stored is not None
    assert stored.name == "suco"
    assert stored.price == 7.5
    assert stored.available is True


def test_list_filters_by_available(session_factory):
    with session_factory() as session:
        repository = ItemRepository(session)
        repository.add(name="café", price=5.0, available=True)
        repository.add(name="chá", price=4.0, available=False)

        assert [i.name for i in repository.list()] == ["café", "chá"]
        assert [i.name for i in repository.list(available=True)] == ["café"]
        assert [i.name for i in repository.list(available=False)] == ["chá"]


def test_update_and_delete(session_factory):
    with session_factory() as session:
        repository = ItemRepository(session)
        item = repository.add(name="café", price=5.0, available=True)

        repository.update(item, price=6.0)
        assert repository.get(item.id).price == 6.0

        repository.delete(item)
        assert repository.get(item.id) is None
