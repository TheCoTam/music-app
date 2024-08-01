from django.shortcuts import render, redirect
from rest_framework.views import APIView
from requests import Request, post
from rest_framework.response import Response
from rest_framework import status
from api.models import Room
from .credentials import CLIENT_ID, CLIENT_SECRET, REDIRECT_URI
from .utils import *
from .models import Vote


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
        is_playing = response.get('is_playing')
        album_cover = item.get('album').get('images')[1].get('url')
        progress = response.get('progress_ms')

        artist_string = ""

        for i, artist in enumerate(item.get('artists')):
            if i > 0:
                artist_string += ', '
            name = artist.get('name')
            artist_string += name

        votes = len(Vote.objects.filter(room=room, song_id=song_id))

        song = {
            'id': song_id,
            'title': item.get('name'),
            'artist': artist_string,
            'duration': duration,
            'time': progress,
            'image_url': album_cover,
            'is_playing': is_playing,
            'votes': votes,
            'votes_required': room.votes_to_skip
        }

        self.update_room_song(room=room, song_id=song_id)

        return Response(song, status=status.HTTP_200_OK)

    def update_room_song(self, room, song_id):
        current_song = room.current_song

        if current_song != song_id:
            room.current_song = song_id
            room.save(update_fields=['current_song'])
            votes = Vote.objects.filter(room=room).delete()


class PauseSong(APIView):
    def put(self, request, format=None):
        room_code = self.request.session.get('room_code')
        rooms = Room.objects.filter(code=room_code)

        if not rooms.exists():
            return Response({'message': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

        room = rooms[0]
        if self.request.session.session_key == room.host or room.guest_can_pause:
            pause_song(room.host)
            return Response({'message': 'Song paused if your spotify is premium'}, status=status.HTTP_200_OK)

        return Response({'message': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)


class PlaySong(APIView):
    def put(self, request, format=None):
        room_code = self.request.session.get('room_code')
        rooms = Room.objects.filter(code=room_code)

        if not rooms.exists():
            return Response({'message': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

        room = rooms[0]
        if self.request.session.session_key == room.host or room.guest_can_pause:
            play_song(room.host)
            return Response({'message': 'Song played if your spotify is premium'}, status=status.HTTP_200_OK)

        return Response({'message': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)


class SkipSong(APIView):
    def post(self, request, format=None):
        room_code = self.request.session.get('room_code')
        rooms = Room.objects.filter(code=room_code)

        if not rooms.exists():
            return Response({'message': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

        room = rooms[0]
        votes = Vote.objects.filter(room=room, song_id=room.current_song)

        # Undo skip if user already voted
        for vote in votes:
            if vote.user == self.request.session.session_key:
                vote.delete()
                return Response({'message': 'Undo skip song', 'success': False, 'voted': False},
                                status=status.HTTP_200_OK)

        # skip song if condition meet
        votes_needed = room.votes_to_skip
        if self.request.session.session_key == room.host or len(votes) + 1 >= votes_needed:
            votes.delete()
            skip_song(room.host)
            return Response({'message': 'Song skip if your spotify is premium', 'success': True},
                            status=status.HTTP_200_OK)

        # user not vote and condition not meet => add user to votes list
        vote = Vote(user=self.request.session.session_key, song_id=room.current_song, room=room)
        vote.save()

        return Response({'message': 'Wait another to skip this song', 'success': False, 'Voted': True},
                        status=status.HTTP_200_OK)


class IsGuestVote(APIView):
    def get(self, request, format=None):
        room_code = self.request.session.get('room_code')
        rooms = Room.objects.filter(code=room_code)

        if not rooms.exists():
            return Response({'message': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

        room = rooms[0]

        votes = Vote.objects.filter(user=self.request.session.session_key, room=room, song_id=room.current_song)
        if not votes.exists():
            return Response({'message': 'Guest not voted', 'voted': False}, status=status.HTTP_200_OK)

        return Response({'message': 'Guest voted', 'voted': True}, status=status.HTTP_200_OK)
