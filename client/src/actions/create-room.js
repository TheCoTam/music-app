import axios from "axios";

const url = import.meta.env.VITE_API_URL;

export const createRoom = async (guestCanPause, votesToSkip) => {
  try {
    axios.defaults.withCredentials = true;
    const response = await axios.post(url + "/api/create-room", {
      guest_can_pause: guestCanPause,
      votes_to_skip: votesToSkip,
    });

    return response.data;
  } catch (error) {
    console.log("[create room]", error);
    return { error: "Something went wrong" };
  }
};
