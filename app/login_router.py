from fastapi import APIRouter

login_router = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)

@login_router.post("/login")
def login(username: str, password: str):
    return {"message": "Login endpoint"}

@login_router.post("/logout")
def logout():
    return {"message": "Logout endpoint"}
