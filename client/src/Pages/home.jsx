import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

axios.defaults.withCredentials = true;
const url = import.meta.env.VITE_API_URL;

const HomePage = () => {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const response = await axios.get(url + "/api/user-in-room");
      setRoomCode(response.data.code);
    }

    fetchData();
  }, []);
  if (roomCode) {
    navigate(`/room/${roomCode}`);
  }

  return (
    <div className="flex flex-col items-center justify-center gap-9 w-[300px]">
      <p className="text-5xl font-bold">House Party</p>
      <div className="w-full flex">
        <Link
          to="/join"
          className="text-center w-1/2 px-3 py-2 bg-blue-400 hover:bg-blue-500 active:bg-blue-600 rounded-l-md border-2 border-teal-400 hover:border-blue-600 border-r-0"
        >
          Join A Room
        </Link>
        <Link
          to="/create"
          className="text-center w-1/2 px-3 py-2 bg-rose-400 hover:bg-rose-500 active:bg-rose-600 rounded-r-md border-2 border-teal-400 hover:border-rose-600 border-l-0"
        >
          Create A Room
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
