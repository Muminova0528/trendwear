from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr

from .models import UserRole, OrderStatus


# ---------- Auth ----------
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.staff


class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Category ----------
class CategoryCreate(BaseModel):
    name: str


class CategoryOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


# ---------- Product ----------
class ProductCreate(BaseModel):
    sku: str
    name: str
    description: str = ""
    price: float = 0.0
    stock: int = 0
    reorder_level: int = 10
    category_id: Optional[int] = None
    image_url: str = ""


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    reorder_level: Optional[int] = None
    category_id: Optional[int] = None
    image_url: Optional[str] = None


class ProductOut(BaseModel):
    id: int
    sku: str
    name: str
    description: str
    price: float
    stock: int
    reorder_level: int
    category_id: Optional[int]
    image_url: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Customer ----------
class CustomerCreate(BaseModel):
    company_name: str
    contact_name: str = ""
    email: str = ""
    phone: str = ""
    city: str = ""


class CustomerOut(BaseModel):
    id: int
    company_name: str
    contact_name: str
    email: str
    phone: str
    city: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Order ----------
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int


class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    customer_id: int
    status: OrderStatus
    total_amount: float
    created_at: datetime
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


# ---------- Dashboard ----------
class DashboardStats(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    total_revenue: float
    low_stock_count: int
    pending_orders: int
