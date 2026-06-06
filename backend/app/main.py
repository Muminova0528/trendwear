import time
import socket

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from .config import settings
from .database import engine, get_db, Base
from . import models, schemas
from .auth import (
    hash_password, verify_password, create_access_token, get_current_user
)
from .seed import seed_data

# Jadvallarni yaratish (DB tayyor bo'lmasligi mumkin — qayta urinamiz)
for attempt in range(10):
    try:
        Base.metadata.create_all(bind=engine)
        break
    except Exception:
        time.sleep(3)

app = FastAPI(
    title="TrendWear Distribution — Bulutli Boshqaruv Platformasi",
    description="ERP + CRM + WMS yagona bulutli tizimi (BTEC Unit 6)",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# CORS — frontend bilan ishlash uchun
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    db = next(get_db())
    try:
        seed_data(db)
    finally:
        db.close()


# ============ HEALTH / INFRA ============
@app.get("/api/health", tags=["infra"])
def health_check():
    """Load Balancer va auto-scaling uchun salomatlik tekshiruvi.
    Qaysi konteyner (node) javob berayotganini ham qaytaradi."""
    return {
        "status": "healthy",
        "server_id": settings.SERVER_ID,
        "hostname": socket.gethostname(),
        "timestamp": time.time(),
    }


@app.get("/api/load-test/{iterations}", tags=["infra"])
def load_test(iterations: int):
    """Auto-scaling/load balancing namoyishi: CPU yuklamasini simulyatsiya
    qiladi va so'rovga qaysi node javob berganini ko'rsatadi."""
    iterations = min(iterations, 5_000_000)
    x = 0
    for i in range(iterations):
        x += i * i
    return {
        "served_by": settings.SERVER_ID,
        "hostname": socket.gethostname(),
        "iterations": iterations,
        "result": x,
    }


# ============ AUTH ============
@app.post("/api/auth/register", response_model=schemas.UserOut, tags=["auth"])
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Bu email allaqachon ro'yxatdan o'tgan")
    user = models.User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/api/auth/login", response_model=schemas.Token, tags=["auth"])
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email yoki parol noto'g'ri")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.get("/api/auth/me", response_model=schemas.UserOut, tags=["auth"])
def me(current: models.User = Depends(get_current_user)):
    return current


# ============ DASHBOARD ============
@app.get("/api/dashboard", response_model=schemas.DashboardStats, tags=["dashboard"])
def dashboard(db: Session = Depends(get_db),
              _: models.User = Depends(get_current_user)):
    total_products = db.query(func.count(models.Product.id)).scalar()
    total_customers = db.query(func.count(models.Customer.id)).scalar()
    total_orders = db.query(func.count(models.Order.id)).scalar()
    total_revenue = db.query(func.coalesce(func.sum(models.Order.total_amount), 0.0)).scalar()
    low_stock = db.query(func.count(models.Product.id)).filter(
        models.Product.stock <= models.Product.reorder_level
    ).scalar()
    pending = db.query(func.count(models.Order.id)).filter(
        models.Order.status == models.OrderStatus.pending
    ).scalar()
    return schemas.DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        total_revenue=float(total_revenue),
        low_stock_count=low_stock,
        pending_orders=pending,
    )


# ============ CATEGORIES ============
@app.get("/api/categories", response_model=list[schemas.CategoryOut], tags=["categories"])
def list_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()


@app.post("/api/categories", response_model=schemas.CategoryOut, tags=["categories"])
def create_category(payload: schemas.CategoryCreate, db: Session = Depends(get_db),
                    _: models.User = Depends(get_current_user)):
    cat = models.Category(name=payload.name)
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


# ============ PRODUCTS (WMS) ============
@app.get("/api/products", response_model=list[schemas.ProductOut], tags=["products"])
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).order_by(models.Product.id).all()


@app.post("/api/products", response_model=schemas.ProductOut, tags=["products"])
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db),
                   _: models.User = Depends(get_current_user)):
    if db.query(models.Product).filter(models.Product.sku == payload.sku).first():
        raise HTTPException(status_code=400, detail="Bu SKU allaqachon mavjud")
    prod = models.Product(**payload.model_dump())
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return prod


@app.put("/api/products/{product_id}", response_model=schemas.ProductOut, tags=["products"])
def update_product(product_id: int, payload: schemas.ProductUpdate,
                   db: Session = Depends(get_db),
                   _: models.User = Depends(get_current_user)):
    prod = db.query(models.Product).get(product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(prod, k, v)
    db.commit()
    db.refresh(prod)
    return prod


@app.delete("/api/products/{product_id}", tags=["products"])
def delete_product(product_id: int, db: Session = Depends(get_db),
                   _: models.User = Depends(get_current_user)):
    prod = db.query(models.Product).get(product_id)
    if not prod:
        raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
    db.delete(prod)
    db.commit()
    return {"ok": True}


# ============ CUSTOMERS (CRM) ============
@app.get("/api/customers", response_model=list[schemas.CustomerOut], tags=["customers"])
def list_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).order_by(models.Customer.id).all()


@app.post("/api/customers", response_model=schemas.CustomerOut, tags=["customers"])
def create_customer(payload: schemas.CustomerCreate, db: Session = Depends(get_db),
                    _: models.User = Depends(get_current_user)):
    cust = models.Customer(**payload.model_dump())
    db.add(cust)
    db.commit()
    db.refresh(cust)
    return cust


@app.delete("/api/customers/{customer_id}", tags=["customers"])
def delete_customer(customer_id: int, db: Session = Depends(get_db),
                    _: models.User = Depends(get_current_user)):
    cust = db.query(models.Customer).get(customer_id)
    if not cust:
        raise HTTPException(status_code=404, detail="Mijoz topilmadi")
    db.delete(cust)
    db.commit()
    return {"ok": True}


# ============ ORDERS (ERP) ============
@app.get("/api/orders", response_model=list[schemas.OrderOut], tags=["orders"])
def list_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).order_by(models.Order.id.desc()).all()


@app.post("/api/orders", response_model=schemas.OrderOut, tags=["orders"])
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db),
                 _: models.User = Depends(get_current_user)):
    customer = db.query(models.Customer).get(payload.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Mijoz topilmadi")
    order = models.Order(customer_id=payload.customer_id)
    db.add(order)
    db.flush()
    total = 0.0
    for item in payload.items:
        prod = db.query(models.Product).get(item.product_id)
        if not prod:
            raise HTTPException(status_code=404, detail=f"Mahsulot {item.product_id} topilmadi")
        if prod.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"'{prod.name}' uchun omborda yetarli zaxira yo'q (mavjud: {prod.stock})"
            )
        prod.stock -= item.quantity  # Omborni kamaytirish (WMS)
        oi = models.OrderItem(
            order_id=order.id, product_id=prod.id,
            quantity=item.quantity, unit_price=prod.price,
        )
        total += item.quantity * prod.price
        db.add(oi)
    order.total_amount = total
    db.commit()
    db.refresh(order)
    return order


@app.patch("/api/orders/{order_id}/status", response_model=schemas.OrderOut, tags=["orders"])
def update_order_status(order_id: int, payload: schemas.OrderStatusUpdate,
                        db: Session = Depends(get_db),
                        _: models.User = Depends(get_current_user)):
    order = db.query(models.Order).get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Buyurtma topilmadi")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order
