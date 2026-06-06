from fastapi import APIRouter

router = APIRouter(
    prefix="/api/panel",
    tags=["panel"]
)

@router.get("/")
def panel_home():
    return {"message": "Panel home page"}
