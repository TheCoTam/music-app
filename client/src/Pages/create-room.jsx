import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import {
  Form,
  FormField,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { createRoom } from "@/actions/create-room";

const formSchema = z.object({
  guestCanPause: z.boolean(),
  votesToSkip: z.number().int().min(2, {
    required_error: "Please enter a valid number",
  }),
});

const CreateRoomPage = () => {
  const navigate = useNavigate();
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guestCanPause: true,
      votesToSkip: 2,
    },
  });

  const onSubmit = async (values) => {
    const res = await createRoom(values.guestCanPause, values.votesToSkip);
    if (res && "error" in res) {
      toast.error(res.error);
    } else {
      navigate(`/room/${res.code}`);
    }
  };

  return (
    <div className="flex flex-col gap-3 items-center justify-center w-[500px] py-8 bg-rose-100 rounded-lg shadow-md">
      <p className="text-3xl font-bold mb-[40px]">Create A Room</p>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <FormField
            control={form.control}
            name="guestCanPause"
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
                          <RadioGroupItem value={true} />
                        </FormControl>
                        <FormLabel className="cursor-pointer">
                          Play/Pause
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex flex-col items-center gap-2">
                        <FormControl>
                          <RadioGroupItem value={false} />
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
            name="votesToSkip"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold text-lg">
                  Votes Required To Skip Song
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={2}
                    placeholder="Number of votes"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" variant="destructive">
            Create A Room
          </Button>
        </form>
      </Form>
      <Button
        onClick={() => navigate(-1)}
        size="sm"
        className="w-1/4 self-center"
      >
        Back
      </Button>
    </div>
  );
};

export default CreateRoomPage;
