import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import HomePage from "@/Pages/home";
import RoomJoinPage from "@/Pages/room-join";
import CreateRoomPage from "@/Pages/create-room";
import RoomPage from "@/Pages/room";

function App() {
  return (
    <div className="min-h-[100vh] bg-blue-100 flex items-center justify-center">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/join" element={<RoomJoinPage />} />
        <Route path="/create" element={<CreateRoomPage />} />
        <Route path="/room/:roomCode" element={<RoomPage />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
