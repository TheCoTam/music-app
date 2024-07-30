import { Button } from "@/components/ui/button";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

const url = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true;

const RoomPage = () => {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const [room, setRoom] = useState({});

  useEffect(() => {
    async function getRoomDetail() {
      try {
        const response = await axios.get(
          url + `/api/get-room?code=${roomCode}`
        );
        setRoom(response.data);
      } catch (error) {
        if (error.response.status === 404) {
          navigate("/");
          return;
        }
        console.log("[room]", error);
        toast.error("Something went wrong");
      }
    }

    getRoomDetail();
  }, [roomCode]);

  const handleLeaveRoom = async () => {
    try {
      await axios.post(url + "/api/leave-room");
      navigate("/");
    } catch (error) {
      console.log("[room]", error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-3xl font-bold">Code: {room.code}</p>
      <p>Votes: {room.votes_to_skip}</p>
      <p>Guest Can Pause: {room.guest_can_pause?.toString()}</p>
      <p>Host: {room.is_host?.toString()}</p>
      <Button
        variant="destructive"
        className="uppercase"
        onClick={handleLeaveRoom}
      >
        leave room
      </Button>
    </div>
  );
};

export default RoomPage;
