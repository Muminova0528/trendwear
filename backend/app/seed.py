"""Boshlang'ich (demo) ma'lumotlarni bazaga yuklash."""
import random

from sqlalchemy.orm import Session

from . import models
from .auth import hash_password


def seed_data(db: Session):
    # Agar foydalanuvchilar mavjud bo'lsa, qayta seed qilmaymiz
    if db.query(models.User).first():
        return

    # --- Foydalanuvchilar ---
    admin = models.User(
        full_name="Abdulloh Admin",
        email="admin@distinction.uz",
        hashed_password=hash_password("admin123"),
        role=models.UserRole.admin,
    )
    manager = models.User(
        full_name="Dilshod Manager",
        email="manager@distinction.uz",
        hashed_password=hash_password("manager123"),
        role=models.UserRole.manager,
    )
    db.add_all([admin, manager])

    # --- Kategoriyalar ---
    cat_names = ["Erkaklar kiyimi", "Ayollar kiyimi", "Bolalar kiyimi",
                 "Sport kiyimlari", "Aksessuarlar"]
    categories = [models.Category(name=n) for n in cat_names]
    db.add_all(categories)
    db.flush()

    # --- Mahsulotlar ---
    sample_products = [
        ("Klassik ko'ylak", "Erkaklar kiyimi", 145000, 320),
        ("Jinsi shim", "Erkaklar kiyimi", 210000, 180),
        ("Yozgi libos", "Ayollar kiyimi", 185000, 95),
        ("Trikotaj kofta", "Ayollar kiyimi", 165000, 8),
        ("Bolalar futbolkasi", "Bolalar kiyimi", 65000, 540),
        ("Sport shimi", "Sport kiyimlari", 175000, 6),
        ("Sport futbolka", "Sport kiyimlari", 95000, 260),
        ("Charm kamar", "Aksessuarlar", 85000, 410),
        ("Qishki kurtka", "Erkaklar kiyimi", 420000, 70),
        ("Ipak ro'mol", "Aksessuarlar", 120000, 4),
        ("Palto", "Ayollar kiyimi", 380000, 45),
        ("Bolalar shimi", "Bolalar kiyimi", 78000, 300),
    ]
    cat_map = {c.name: c.id for c in categories}
    products = []
    for i, (name, cat, price, stock) in enumerate(sample_products, start=1):
        products.append(models.Product(
            sku=f"TW-{1000 + i}",
            name=name,
            description=f"{name} — sifatli to'qima, ulgurji yetkazib berish.",
            price=price,
            stock=stock,
            reorder_level=10,
            category_id=cat_map[cat],
        ))
    db.add_all(products)
    db.flush()

    # --- Mijozlar ---
    customers_data = [
        ("Moda Savdo MChJ", "Aziz Karimov", "aziz@moda.uz", "+998901234567", "Toshkent"),
        ("Style Market", "Nilufar Yusupova", "nilufar@style.uz", "+998935554433", "Samarqand"),
        ("Fashion Hub", "Bobur Aliyev", "bobur@fhub.uz", "+998971112233", "Buxoro"),
        ("Kiyim Olami", "Gulnora Saidova", "g@kiyim.uz", "+998901119988", "Andijon"),
    ]
    customers = [models.Customer(
        company_name=c[0], contact_name=c[1], email=c[2],
        phone=c[3], city=c[4]
    ) for c in customers_data]
    db.add_all(customers)
    db.flush()

    # --- Buyurtmalar ---
    statuses = list(models.OrderStatus)
    for _ in range(15):
        cust = random.choice(customers)
        order = models.Order(
            customer_id=cust.id,
            status=random.choice(statuses),
        )
        db.add(order)
        db.flush()
        total = 0.0
        for _ in range(random.randint(1, 4)):
            prod = random.choice(products)
            qty = random.randint(5, 40)
            item = models.OrderItem(
                order_id=order.id,
                product_id=prod.id,
                quantity=qty,
                unit_price=prod.price,
            )
            total += qty * prod.price
            db.add(item)
        order.total_amount = total

    db.commit()
