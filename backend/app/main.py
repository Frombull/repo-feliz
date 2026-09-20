from fastapi import FastAPI, HTTPException

app = FastAPI()

ITEMS = {
    1: "café",
    2: "chá",
    3: "suco",
}


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/items/{item_id}")
def get_item(item_id: int):
    if item_id not in ITEMS:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return {"id": item_id, "name": ITEMS[item_id]}
