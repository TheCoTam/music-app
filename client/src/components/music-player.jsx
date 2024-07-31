import { Pause, Play, StepForward } from "lucide-react";
import toast from "react-hot-toast";

const MusicPlayer = ({
  title,
  artist,
  duration,
  time,
  image_url,
  is_playing,
}) => {
  const songProgress = Math.round((time / duration) * 100);

  const iconClassName =
    "w-4 h-4 sm:w-6 sm:h-6 md:w-10 md:h-10 hover:bg-slate-300 active:bg-slate-400 rounded-full p-1 cursor-pointer";

  const handlePause = () => toast.success("Gonna Pause");
  const handlePlay = () => toast.success("Gonna Play");
  const handleForward = () => toast.success("Gonna Forward");

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
            <StepForward className={iconClassName} onClick={handleForward} />
          </div>
        </div>
      </div>
      <div className="h-[4px] bg-gray-400 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-400"
          style={{ width: `${songProgress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default MusicPlayer;
