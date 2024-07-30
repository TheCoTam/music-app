import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const url = import.meta.env.VITE_API_URL;
axios.defaults.withCredentials = true;

const formSchema = z.object({
  guest_can_pause: z.boolean(),
  votes_to_skip: z.number().int(),
});

const SettingRoom = ({ guest_can_pause, votes_to_skip, code }) => {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guest_can_pause: guest_can_pause,
      votes_to_skip: votes_to_skip,
    },
  });
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);

  const onSubmit = async (values) => {
    const { guest_can_pause, votes_to_skip } = values;
    try {
      setIsUpdating(true);
      const res = await axios.patch(url + "/api/update-room", {
        guest_can_pause,
        votes_to_skip,
        code,
      });

      setIsUpdating(false);
      navigate(0);
      toast.success(res.data.message);
    } catch (error) {
      console.log("[setting room]", error);
      toast.error("Something went wrong");
    }
  };

  return (
    <Sheet>
      <SheetTrigger className="border-2 border-teal-400 bg-teal-300 hover:bg-teal-400 active:bg-teal-500 rounded-md px-2 py-1 text-sm text-gray-700 uppercase font-semibold">
        Settings
      </SheetTrigger>
      <SheetContent>
        <SheetHeader className="uppercase text-2xl font-bold mb-8">
          Settings
        </SheetHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-5"
          >
            <FormField
              control={form.control}
              name="guest_can_pause"
              render={({ field }) => (
                <div className="flex flex-col">
                  <FormItem>
                    <FormLabel className="font-semibold text-lg">
                      Guest Control of Playback State
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex justify-between items-center"
                      >
                        <FormItem className="flex flex-col items-center gap-2">
                          <FormControl>
                            <RadioGroupItem
                              value={true}
                              disabled={isUpdating}
                              className="text-blue-500"
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer">
                            Play/Pause
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex flex-col items-center gap-2">
                          <FormControl>
                            <RadioGroupItem
                              value={false}
                              disabled={isUpdating}
                              className="text-red-500"
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer">
                            No Control
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
              )}
            />
            <FormField
              control={form.control}
              name="votes_to_skip"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      min={2}
                      placeholder="Number of votes"
                      disabled={isUpdating}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={isUpdating}>Update</Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default SettingRoom;
