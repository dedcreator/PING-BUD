import hashlib
from django.utils import timezone
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import ApiKey

class ApiKeyAuthentication(BaseAuthentication):
    """
    Authenticates requests using Sentiro Scoped Developer API Keys (pw_live_...).
    Supports:
      - Header: 'X-API-Key: pw_live_...'
      - Header: 'Authorization: Bearer pw_live_...'
      - Header: 'Authorization: Api-Key pw_live_...'
      - Header: 'Authorization: Token pw_live_...'
      - Query param: '?api_key=pw_live_...'
    """
    def authenticate(self, request):
        token_str = None

        # 1. Check X-API-Key header
        x_api_key = request.headers.get('X-API-Key') or request.META.get('HTTP_X_API_KEY')
        if x_api_key:
            token_str = x_api_key.strip()

        # 2. Check Authorization header
        if not token_str:
            auth_header = request.headers.get('Authorization') or request.META.get('HTTP_AUTHORIZATION')
            if auth_header:
                parts = auth_header.split()
                if len(parts) == 2 and parts[0].lower() in ('bearer', 'api-key', 'token'):
                    token_str = parts[1].strip()

        # 3. Check query param fallback (?api_key=...)
        if not token_str:
            token_str = request.query_params.get('api_key') or request.GET.get('api_key')

        if not token_str or not token_str.startswith('pw_live_'):
            return None  # Let standard Token/Session auth classes handle it

        # Extract the raw secret (after pw_live_)
        raw_secret = token_str[len('pw_live_'):]
        key_hash = hashlib.sha256(raw_secret.encode()).hexdigest()

        api_key = ApiKey.objects.select_related('user').filter(key_hash=key_hash).first()
        if not api_key:
            raise AuthenticationFailed('Invalid or revoked Sentiro API Key.')

        # Update last used timestamp
        api_key.last_used_at = timezone.now()
        api_key.save(update_fields=['last_used_at'])

        request.api_key = api_key
        return (api_key.user, api_key)

    def authenticate_header(self, request):
        return 'Bearer realm="Sentiro API"'

