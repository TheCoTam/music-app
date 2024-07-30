from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.http import JsonResponse

from .models import Room
from .serializers import RoomSerializer, CreateRoomSerializer, UpdateRoomSerializer


# Create your views here.
# API view all room in database
class RoomView(generics.ListAPIView):
    queryset = Room.objects.all()
    serializer_class = RoomSerializer


# API get room detail according to room code from client
class GetRoom(APIView):
    serializer_class = RoomSerializer
    lookup_url_kwarg = 'code'

    def get(self, request, format=None):
        code = request.GET.get(self.lookup_url_kwarg)
        if code != None:
            room = Room.objects.filter(code=code)
            if len(room) > 0:
                data = RoomSerializer(room[0]).data
                data['is_host'] = self.request.session.session_key == room[0].host

                return Response(data, status=status.HTTP_200_OK)

            return Response({'Room not found': 'Invalid Room Code.'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'Bad request': 'Code parameter not found in request'}, status=status.HTTP_400_BAD_REQUEST)


# API take room code from client and set last room current user join to that room code
class JoinRoom(APIView):
    lookup_url_kwarg = 'code'

    def post(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        code = request.data.get(self.lookup_url_kwarg)
        if code is not None:
            room_result = Room.objects.filter(code=code)
            if len(room_result) > 0:
                room = room_result[0]
                self.request.session['room_code'] = code
                return Response({'message': 'Room Joined!', 'code': self.request.session['room_code']},
                                status=status.HTTP_200_OK)

            return Response({'Bad request': 'Room Not Found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'Bad request': 'Invalid post data, did not find a code key'},
                        status=status.HTTP_400_BAD_REQUEST)


# API create a new room and set the last room current user join to new created room
class CreateRoomView(APIView):
    serializer_class = CreateRoomSerializer

    def post(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            guest_can_pause = serializer.data.get('guest_can_pause')
            votes_to_skip = serializer.data.get('votes_to_skip')
            host = self.request.session.session_key
            querySet = Room.objects.filter(host=host)

            if querySet.exists():
                room = querySet[0]
                room.guest_can_pause = guest_can_pause
                room.votes_to_skip = votes_to_skip

                room.save()
                self.request.session['room_code'] = room.code
            else:
                room = Room(host=host, guest_can_pause=guest_can_pause, votes_to_skip=votes_to_skip)
                room.save()
                self.request.session['room_code'] = room.code

            return Response(RoomSerializer(room).data, status=status.HTTP_201_CREATED)

        return Response({'Bad request': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)


# API get room code that current user last join
class UserInRoom(APIView):
    def get(self, request, format=None):
        if not self.request.session.exists(self.request.session.session_key):
            self.request.session.create()

        data = {
            'code': self.request.session.get('room_code')
        }

        return JsonResponse(data, status=status.HTTP_200_OK)


# API leave room and delete room if leaver is host's room
class LeaveRoom(APIView):
    def post(self, request, format=None):
        if 'room_code' in self.request.session:
            code = self.request.session.pop('room_code')
            host_id = self.request.session.session_key
            room_results = Room.objects.filter(host=host_id)

            if len(room_results) > 0:
                room = room_results[0]
                room.delete()

        return Response({'message': 'Success'}, status=status.HTTP_200_OK)


# API delete room with room code from client
class DeleteRoom(APIView):
    lookup_url_kwarg = 'code'

    def delete(self, request, format=None):
        code = request.data.get(self.lookup_url_kwarg)
        if code is None:
            return Response({'message': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)

        room_results = Room.objects.filter(code=code)
        if len(room_results):
            room = room_results[0]
            room.delete()
            return Response({'message': 'Room deleted'}, status=status.HTTP_200_OK)

        return Response({'message': 'Room Code not found'}, status=status.HTTP_404_NOT_FOUND)


# API update infomation of a certain room
class UpdateRoom(APIView):
    serializer_class = UpdateRoomSerializer

    def patch(self, request, format=None):
        if not self.request.session.session_key:
            self.request.session.create()

        serializer = self.serializer_class(data=request.data)
        if not serializer.is_valid():
            return Response({'message': 'Invalid data'}, status=status.HTTP_400_BAD_REQUEST)

        guest_can_pause = serializer.data.get('guest_can_pause')
        votes_to_skip = serializer.data.get('votes_to_skip')
        code = serializer.data.get('code')

        queryset = Room.objects.filter(code=code)

        if not queryset.exists():
            return Response({'message': 'Room not found'}, status=status.HTTP_404_NOT_FOUND)

        room = queryset[0]

        if room.host != self.request.session.session_key:
            return Response({'message': 'Unauthorize'}, status=status.HTTP_401_UNAUTHORIZED)

        room.guest_can_pause = guest_can_pause
        room.votes_to_skip = votes_to_skip

        room.save(update_fields=['guest_can_pause', 'votes_to_skip'])

        return Response({'message': 'Room updated', 'data': RoomSerializer(room).data}, status=status.HTTP_200_OK)
