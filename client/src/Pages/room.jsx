import SettingRoom from "@/components/setting-room";
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
  const [room, setRoom] = useState(null);

  async function getRoomDetail() {
    try {
      const response = await axios.get(url + `/api/get-room?code=${roomCode}`);
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

  useEffect(() => {
    async function auth() {
      try {
        const response = await axios.get(url + "/spotify/is-authenticated");

        if (!response.data.status) {
          const fetchAuthUrl = await axios.get(url + "/spotify/get-auth-url");
          const authUrl = fetchAuthUrl.data.url;
          window.location.replace(authUrl);
          return;
        }

        getRoomDetail();
      } catch (error) {
        console.log("[Auth-room", error);
      }
    }

    auth();
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
    <div className="flex flex-col gap-2 items-center">
      <p className="text-3xl font-bold">Code: {room?.code}</p>
      <div className="flex space-x-3">
        <p className="font-semibold">Votes:</p>
        <p>{room?.votes_to_skip}</p>
      </div>
      <div className="flex space-x-3">
        <p className="font-semibold">Guest Can Pause:</p>
        <p>{room?.guest_can_pause?.toString()}</p>
      </div>
      <div className="flex space-x-3">
        <p className="font-semibold">Host:</p>
        <p>{room?.is_host?.toString()}</p>
      </div>
      {room && (
        <SettingRoom
          guest_can_pause={room.guest_can_pause}
          votes_to_skip={room.votes_to_skip}
          code={room.code}
          updateCallback={getRoomDetail}
        />
      )}
      <Button
        variant="destructive"
        className="uppercase w-max "
        onClick={handleLeaveRoom}
      >
        leave room
      </Button>
    </div>
  );
};

export default RoomPage;
