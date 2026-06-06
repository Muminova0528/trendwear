import os
from typing import Optional

class RedisClient:
    def __init__(self):
        self.host = os.getenv("REDIS_HOST", "localhost")
        self.port = int(os.getenv("REDIS_PORT", 6379))
        self.db = int(os.getenv("REDIS_DB", 0))
        self._client = None
    
    def get_client(self):
        """Get Redis client instance"""
        if self._client is None:
            try:
                import redis
                self._client = redis.Redis(
                    host=self.host,
                    port=self.port,
                    db=self.db,
                    decode_responses=True
                )
                self._client.ping()
            except Exception as e:
                print(f"Redis connection warning: {e}")
                return None
        return self._client
    
    def get(self, key: str) -> Optional[str]:
        client = self.get_client()
        if client:
            return client.get(key)
        return None
    
    def set(self, key: str, value: str, ex: Optional[int] = None):
        client = self.get_client()
        if client:
            client.set(key, value, ex=ex)
    
    def delete(self, key: str):
        client = self.get_client()
        if client:
            client.delete(key)

_redis_client = RedisClient()

def get_redis() -> Optional[RedisClient]:
    return _redis_client
