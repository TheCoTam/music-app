import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const RoomPage = () => {
  const { roomCode } = useParams();
  const [room, setRoom] = useState({});

  useEffect(() => {
    async function getRoomDetail() {
      axios.defaults.withCredentials = true;
      const url = import.meta.env.VITE_API_URL;
      const response = await axios.get(url + `/api/get-room?code=${roomCode}`);
      setRoom(response.data);
    }

    getRoomDetail();
  }, [roomCode]);

  return (
    <div className="space-y-2">
      <p className="text-3xl font-bold">{room.code}</p>
      <p>Votes: {room.votes_to_skip}</p>
      <p>Guest Can Pause: {room.guest_can_pause?.toString()}</p>
      <p>Host: {room.is_host?.toString()}</p>
    </div>
  );
};

export default RoomPage;
