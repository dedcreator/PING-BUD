import os
import hmac
import hashlib
import time
import base64
import struct
import urllib.parse

def generate_totp_secret() -> str:
    """
    Generates a cryptographically secure Base32 secret string
    compatible with Google Authenticator, 1Password, and Apple Keychain.
    """
    random_bytes = os.urandom(20)
    return base64.b32encode(random_bytes).decode('utf-8').rstrip('=')

def get_totp_token(secret: str, intervals_no: int = None, time_step: int = 30) -> str:
    """
    Computes standard RFC 6238 6-digit TOTP token using HMAC-SHA1.
    """
    if intervals_no is None:
        intervals_no = int(time.time()) // time_step

    clean_secret = secret.replace(' ', '').upper()
    secret_padded = clean_secret + '=' * ((8 - len(clean_secret) % 8) % 8)
    key = base64.b32decode(secret_padded, casefold=True)

    msg = struct.pack(">Q", intervals_no)
    h = hmac.new(key, msg, hashlib.sha1).digest()
    offset = h[19] & 15
    code_int = (struct.unpack(">I", h[offset:offset + 4])[0] & 0x7fffffff) % 1000000
    return f"{code_int:06d}"

def verify_totp_token(secret: str, token: str, window: int = 1, time_step: int = 30) -> bool:
    """
    Verifies a 6-digit token against the Base32 secret, allowing +/- window intervals (clock drift).
    """
    if not secret or not token:
        return False

    token_clean = str(token).strip()
    if len(token_clean) != 6 or not token_clean.isdigit():
        return False

    current_interval = int(time.time()) // time_step
    for drift in range(-window, window + 1):
        if get_totp_token(secret, current_interval + drift, time_step) == token_clean:
            return True
    return False

def get_otpauth_url(account_name: str, secret: str, issuer: str = "Sentiro") -> str:
    """
    Generates an otpauth:// URI that authenticator apps parse to register the account.
    """
    label = urllib.parse.quote(f"{issuer}:{account_name}")
    issuer_encoded = urllib.parse.quote(issuer)
    return f"otpauth://totp/{label}?secret={secret}&issuer={issuer_encoded}&algorithm=SHA1&digits=6&period=30"
