import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import toast from "react-hot-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  roomCode: z.string().length(6, "Room code must be exactly 6 characters long"),
});

const RoomJoinPage = () => {
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      roomCode: "",
    },
  });

  const onSubmit = async (values) => {
    const url = import.meta.env.VITE_API_URL;
    try {
      const response = await axios.post(url + "/api/join-room", {
        code: values.roomCode,
      });
      navigate(`/room/${values.roomCode}`);
    } catch (error) {
      if (error.response.status === 404) {
        toast.error("Room not found");
        return;
      } else {
        console.log("[join room]", error);
        toast.error("Something went wrong");
      }
    }
  };

  return (
    <div className="space-y-2 w-max">
      <p className="text-2xl font-bold mb-[20px]">Join A Room</p>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5 items-center"
        >
          <FormField
            control={form.control}
            name="roomCode"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input {...field} placeholder="Enter a room code" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button>Enter Room</Button>
        </form>
      </Form>
      <div className="w-full flex justify-center">
        <Button size="sm" variant="outline" onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
    </div>
  );
};

export default RoomJoinPage;
