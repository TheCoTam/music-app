import axios from "axios";
import toast from "react-hot-toast";
import { Pause, Play, StepForward } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

const url = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true;

const MusicPlayer = ({
  title,
  artist,
  duration,
  time,
  image_url,
  is_playing,
  votes,
  votes_required,
  is_host,
}) => {
  const [voted, setVoted] = useState(false);
  const songProgress = Math.round((time / duration) * 100);

  const iconClassName =
    "w-5 h-5 sm:w-6 sm:h-6 md:w-10 md:h-10 hover:bg-slate-300 active:bg-slate-400 rounded-full p-1 cursor-pointer";

  const handlePause = async () => {
    try {
      const response = await axios.put(url + "/spotify/pause");
      toast.success(response.data.message);
    } catch (error) {
      if (error.data.status === 404 || error.data.status === 401) {
        toast.error(error.data.message);
        return;
      }

      console.log("[Pause song]", error);
      toast.error("Something went wrong");
    }
  };

  const handlePlay = async () => {
    try {
      await axios.put(url + "/spotify/play");
      toast.success("Played if your spotify is premium");
    } catch (error) {
      if (error.data.status === 404 || error.data.status === 401) {
        toast.error(error.data.message);
        return;
      }

      console.log("[Play song]", error);
      toast.error("Something went wrong");
    }
  };

  const handleSkip = async () => {
    try {
      const response = await axios.post(url + "/spotify/next");

      toast.success(response.data.message);
      if (!response.data.success) {
        setVoted(response.data.voted);
      }
    } catch (error) {
      console.log("[Skip song]", error);
      toast.error("Something went wrong");
    }
  };

  useEffect(() => {
    async function guestVoted() {
      if (is_host) return;

      try {
        const url = import.meta.env.VITE_API_URL;
        axios.defaults.withCredentials = true;

        const response = await axios.get(url + "/spotify/guest-voted");

        if (response.data.voted) {
          setVoted(true);
        }
      } catch (error) {
        console.log("[Music Player]", error);
      }
    }

    guestVoted();
  }, []);

  return (
    <div className="flex flex-col gap-3 p-5">
      <div className="grid grid-cols-3 gap-3">
        <img src={image_url} alt="album art" className="rounded-xl" />
        <div className="col-span-2 flex flex-col gap-6">
          <p className="flex flex-col gap-3">
            <p className="text-base sm:text-2xl md:text-3xl font-bold text-center">
              {title}
            </p>
            <p className="text-xs sm:text-sm md:text-base font-semibold text-gray-500 text-center">
              {artist}
            </p>
          </p>
          <div className="flex gap-8 items-center justify-center">
            {is_playing ? (
              <Pause className={iconClassName} onClick={handlePause} />
            ) : (
              <Play className={iconClassName} onClick={handlePlay} />
            )}
            <StepForward
              className={`${iconClassName} ${
                !is_host && voted && "text-red-500"
              }`}
              onClick={handleSkip}
            />
            <Badge variant="secondary">
              {votes} / {votes_required}
            </Badge>
          </div>
        </div>
      </div>
      <Progress value={songProgress} />
    </div>
  );
};

export default MusicPlayer;
