from django.shortcuts import render, redirect
from rest_framework.views import APIView
from requests import Request, post
from rest_framework.response import Response
from rest_framework import status
from .credentials import CLIENT_ID, CLIENT_SECRET, REDIRECT_URI
from .utils import *
from api.models import Room


# Create your views here.
class AuthURL(APIView):
    def get(self, request, format=None):
        scopes = 'user-read-playback-state user-modify-playback-state user-read-currently-playing'
        url = Request('GET', 'https://accounts.spotify.com/authorize', params={
            'scope': scopes,
            'response_type': 'code',
            'redirect_uri': REDIRECT_URI,
            'client_id': CLIENT_ID
        }).prepare().url

        return Response({'url': url}, status=status.HTTP_200_OK)


def spotify_callback(request, format=None):
    code = request.GET.get('code')
    error = request.GET.get('error')

    response = post('https://accounts.spotify.com/api/token', data={
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URI,
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET
    }).json()

    access_token = response.get('access_token')
    token_type = response.get('token_type')
    expires_in = response.get('expires_in')
    refresh_token = response.get('refresh_token')
    error = response.get('error')

    if not request.session.exists(request.session.session_key):
        request.session.create()

    update_or_create_user_tokens(session_id=request.session.session_key, access_token=access_token,
                                 token_type=token_type, refresh_token=refresh_token, expires_in=expires_in)

    return redirect('http://localhost:5173/')


class IsAuthenticated(APIView):
    def get(self, request, format=None):
        is_authenticated = is_spotify_authenticated(self.request.session.session_key)

        return Response({'status': is_authenticated}, status=status.HTTP_200_OK)


class CurrentSong(APIView):
    def get(self, request, format=None):
        room_code = self.request.session.get('room_code')
        rooms = Room.objects.filter(code=room_code)
        if not rooms.exists():
            return Response({'message': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)
        room = rooms[0]
        host = room.host
        endpoint = 'player/currently-playing'
        response = execute_spotify_api_request(session_id=host, endpoint=endpoint, post_=False, put_=False)

        if 'error' in response or 'item' not in response:
            return Response({}, status=status.HTTP_204_NO_CONTENT)

        item = response.get('item')
        song_id = item.get('id')
        duration = item.get('duration_ms')
        is_playing = item.get('is_playing')
        album_cover = item.get('album').get('images')[0].get('url')
        progress = response.get('progress_ms')

        artist_string = ""

        for i, artist in enumerate(item.get('artists')):
            if i > 0:
                artist_string += ', '
            name = artist.get('name')
            artist_string += name

        song = {
            'id': song_id,
            'title': item.get('name'),
            'artist': artist_string,
            'duration': duration,
            'time': progress,
            'image_url': album_cover,
            'is_playing': is_playing,
            'votes': 0
        }

        return Response(song, status=status.HTTP_200_OK)
