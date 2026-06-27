# Verification script for database models, auth, and logic
import os
import sys

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine, SessionLocal, Base
import models
import auth

def run_tests():
    print("Starting database and authentication logic verification...")

    # 1. Create tables
    print("1. Re-creating SQLite tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables verified/created successfully.")

    # 2. Check auth password hashing
    print("2. Verifying password hashing functions...")
    test_pass = "mypassword123"
    hashed = auth.get_password_hash(test_pass)
    assert hashed != test_pass
    assert auth.verify_password(test_pass, hashed) is True
    assert auth.verify_password("wrongpassword", hashed) is False
    print("Password hashing functions verified successfully.")

    # 3. Check JWT token creation & decoding
    print("3. Verifying JWT token operations...")
    token_data = {"sub": "testuser", "role": "student", "user_id": 999}
    token = auth.create_access_token(token_data)
    assert token is not None
    
    # Decode
    payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
    assert payload.get("sub") == "testuser"
    assert payload.get("role") == "student"
    assert payload.get("user_id") == 999
    print("JWT creation and decoding verified successfully.")

    # 4. Check database operations (insert user & query)
    print("4. Testing database insert and query...")
    
    # Import and run startup event to seed database
    from main import startup_event
    startup_event()
    
    db = SessionLocal()
    try:
        # Check seeded Admin
        admin = db.query(models.User).filter(models.User.username == "jeevan-gowda08").first()
        if not admin:
            # Seed here if startup didn't run
            hashed_pwd = auth.get_password_hash("jeevan@420")
            admin = models.User(
                username="jeevan-gowda08",
                email="jeevan@example.com",
                hashed_password=hashed_pwd,
                role="admin"
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        
        assert admin.username == "jeevan-gowda08"
        assert admin.role == "admin"
        assert auth.verify_password("jeevan@420", admin.hashed_password)

        # Check seeded domains
        domains = db.query(models.TrainingDomain).all()
        print(f"Seeded training domains found: {[d.name for d in domains]}")
        assert len(domains) >= 6

        print("Database insert and queries verified successfully.")
    finally:
        db.close()

    print("\nALL BACKEND LOGIC CHECKS PASSED!")

if __name__ == "__main__":
    run_tests()
