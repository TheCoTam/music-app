import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import HomePage from "@/Pages/home";
import RoomJoinPage from "@/Pages/room-join";
import CreateRoomPage from "@/Pages/create-room";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/join" element={<RoomJoinPage />} />
        <Route path="/create" element={<CreateRoomPage />} />
      </Routes>
      <Toaster />
    </div>
  );
}

export default App;
