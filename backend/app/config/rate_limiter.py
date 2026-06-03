from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared rate limiter instance using the client's remote IP address
limiter = Limiter(key_func=get_remote_address)
