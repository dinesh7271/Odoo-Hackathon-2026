import sys
from sqlalchemy import text
from app.core.database import engine, SessionLocal
from app.models import Base

def verify():
    print("1. Testing database connectivity...")
    try:
        # Attempt to connect to the database and execute a simple query
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            print(f"   Success! Connection query returned: {result.scalar()}")
    except Exception as e:
        print("   FAILED to connect to PostgreSQL database.")
        print(f"   Error details: {e}")
        print("\nPlease ensure that your PostgreSQL database is running and accessible.")
        print("If using Docker, run: docker compose up -d db")
        sys.exit(1)

    print("\n2. Creating database tables if they do not exist...")
    try:
        Base.metadata.create_all(bind=engine)
        print("   Success! Tables created successfully or already exist.")
    except Exception as e:
        print("   FAILED to create tables.")
        print(f"   Error details: {e}")
        sys.exit(1)

    print("\n3. Testing SessionLocal session creation...")
    try:
        db = SessionLocal()
        # Verify we can query the users table (even if it's empty)
        db.execute(text("SELECT count(*) FROM users"))
        db.close()
        print("   Success! SessionLocal test successful.")
    except Exception as e:
        print("   FAILED to execute session test.")
        print(f"   Error details: {e}")
        sys.exit(1)

    print("\nAll database verifications PASSED successfully!")

if __name__ == "__main__":
    verify()
