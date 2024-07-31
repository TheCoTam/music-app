from .models import SpotifyToken
from django.utils import timezone
from datetime import timedelta
from requests import post
from .credentials import CLIENT_ID, CLIENT_SECRET


def get_user_tokens(session_id):
    existingTokens = SpotifyToken.objects.filter(user=session_id)

    if not existingTokens.exists():
        return None

    return existingTokens[0]


def update_or_create_user_tokens(session_id, access_token, token_type, refresh_token, expires_in):
    tokens = get_user_tokens(session_id)
    expires_in = timezone.now() + timedelta(seconds=expires_in)

    if not tokens:
        token = SpotifyToken(user=session_id, access_token=access_token, token_type=token_type,
                             refresh_token=refresh_token, expires_in=expires_in)
        token.save()
        return

    tokens.access_token = access_token
    tokens.token_type = token_type
    tokens.refresh_token = refresh_token
    tokens.expires_in = expires_in

    tokens.save(update_fields=['access_token', 'token_type', 'refresh_token', 'expires_in'])


def refresh_spotify_token(session_id):
    refresh_token = get_user_tokens(session_id).refresh_token

    response = post('https://acounts.spotify.com/api/token', data={
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    expires_in = response.get('expires_in')
    refresh_token = response.get('refresh_token')

    update_or_create_user_tokens(session_id=session_id, access_token=access_token, token_type=token_type,
                                 expires_in=expires_in, refresh_token=refresh_token)


def is_spotify_authenticated(session_id):
    tokens = get_user_tokens(session_id)

    if not tokens:
        return False

    expiry = tokens.expires_in
    if expiry <= timezone.now():
        refresh_spotify_token(session_id)

    return True